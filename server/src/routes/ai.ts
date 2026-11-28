import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import type { StoredTransaction, TransactionStore } from '../repositories/transactionRepository.js';
import type { UserStore } from '../repositories/userRepository.js';
import type { StoredUserRecord } from '../types/domain.js';
import { chat, generatePlan, type AiContext } from '../utils/ai.js';
import { currentMonthKey } from '../utils/dashboard.js';

const userIdOf = (req: AuthenticatedRequest) => req.auth?.sub;

const chatSchema = z.object({
  message: z.string().trim().min(1, 'Escreva uma pergunta.').max(500),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(1000) }))
    .max(12)
    .default([]),
});

/**
 * Contexto anonimizado para a IA (LGPD): só números e nomes de categorias —
 * sem títulos de metas, descrições de transações, nome, e-mail, CPF ou IDs.
 * O `spent` é o gasto real do mês calculado das transações (o do perfil vem zerado).
 */
function aiContext(user: StoredUserRecord, monthTx: StoredTransaction[]): AiContext {
  const profile = user.profile;
  const spent = new Map<string, number>();
  let income = 0;
  let expense = 0;
  for (const t of monthTx) {
    if (t.kind === 'receita') income += t.amount;
    else {
      expense += t.amount;
      spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
    }
  }
  return {
    plan: user.plan,
    monthlyIncome: profile.salary + profile.extraIncome,
    fixedBillsTotal: profile.fixedBills.reduce((s, b) => s + b.value, 0),
    subscriptionsTotal: profile.subscriptions.reduce((s, b) => s + b.price, 0),
    categories: profile.categoryBudgets.map((b) => ({
      category: b.name,
      monthlyLimit: b.limit,
      spent: spent.get(b.id) ?? 0,
    })),
    piggyBanks: profile.piggyBanks.map((pb) => ({
      goalAmount: pb.goalAmount,
      savedAmount: pb.savedAmount,
      progressPct: pb.goalAmount > 0 ? Math.min(100, Math.round((pb.savedAmount / pb.goalAmount) * 100)) : 0,
    })),
    month: { income, expense, balance: income - expense },
  };
}

/** Cotas do plano grátis (Slide 8): 1 plano de IA e 10 perguntas ao assistente por mês. */
const FREE_PLANS_PER_MONTH = 1;
const FREE_CHATS_PER_MONTH = 10;

/** Uso de IA por pessoa e mês (memória do processo — suficiente para a demo; persistir em Redis/SQL na escala). */
const aiUsage = new Map<string, { plans: number; chats: number }>();

function consumeAiQuota(userId: string, plan: 'free' | 'premium', kind: 'plan' | 'chat'): string | null {
  if (plan === 'premium') return null;
  const key = `${userId}:${currentMonthKey()}`;
  const usage = aiUsage.get(key) ?? { plans: 0, chats: 0 };
  if (kind === 'plan') {
    if (usage.plans >= FREE_PLANS_PER_MONTH) {
      return `No plano grátis é ${FREE_PLANS_PER_MONTH} plano por mês. O Premium libera planos ilimitados.`;
    }
    usage.plans += 1;
  } else {
    if (usage.chats >= FREE_CHATS_PER_MONTH) {
      return `No plano grátis são ${FREE_CHATS_PER_MONTH} perguntas por mês. O Premium libera o assistente sem limite.`;
    }
    usage.chats += 1;
  }
  aiUsage.set(key, usage);
  return null;
}

/** Apenas para os testes: zera os contadores entre cenários. */
export function resetAiUsage() {
  aiUsage.clear();
}

export function createAiRouter(users: UserStore, transactions: TransactionStore): Router {
  const router = Router();
  router.use(requireAuth);

  /** POST /ai/plan — "Gerar meu Plano com IA": 3 ações práticas com valores e prazos. */
  router.post('/ai/plan', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const [user, monthTx] = await Promise.all([
        users.findById(userId),
        transactions.list(userId, currentMonthKey()),
      ]);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
      const blocked = consumeAiQuota(userId, user.plan, 'plan');
      if (blocked) { res.status(403).json({ error: blocked, upgrade: true }); return; }
      const result = await generatePlan(aiContext(user, monthTx));
      res.json(result);
    } catch (err) { next(err); }
  });

  /** POST /assistant/chat — pergunta em linguagem natural, resposta curta e sem jargões. */
  router.post('/assistant/chat', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = chatSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Pergunta inválida.' });
        return;
      }
      const [user, monthTx] = await Promise.all([
        users.findById(userId),
        transactions.list(userId, currentMonthKey()),
      ]);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
      const blocked = consumeAiQuota(userId, user.plan, 'chat');
      if (blocked) { res.status(403).json({ error: blocked, upgrade: true }); return; }
      const result = await chat(parsed.data.message, aiContext(user, monthTx), parsed.data.history);
      res.json(result);
    } catch (err) { next(err); }
  });

  return router;
}
