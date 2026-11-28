import { Router, type NextFunction, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import type { TransactionStore } from '../repositories/transactionRepository.js';
import type { UserStore } from '../repositories/userRepository.js';
import type { PiggyBankItemModel } from '../types/domain.js';

const userIdOf = (req: AuthenticatedRequest) => req.auth?.sub;
const todayIso = () => new Date().toISOString().slice(0, 10);
const FREE_ACTIVE_GOALS = 3;

const createSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().max(120).default(''),
  goalAmount: z.number().positive('Informe quanto quer juntar.'),
  deadline: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  iconType: z.string().optional(),
  progressColor: z.string().default('#7c3aed'),
});

const moveSchema = z.object({
  amount: z.number().positive('Informe um valor maior que zero.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const progressOf = (saved: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0);

/** Aplica o aporte/retirada na meta (mesma conta do withMove do front). */
function applyMove(goal: PiggyBankItemModel, amount: number, date: string): PiggyBankItemModel {
  const saved = Math.max(0, goal.savedAmount + amount);
  const done = goal.goalAmount > 0 && saved >= goal.goalAmount;
  return {
    ...goal,
    savedAmount: saved,
    progress: progressOf(saved, goal.goalAmount),
    moves: [...(goal.moves ?? []), { id: `mv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, date, amount }],
    completedAt: done ? (goal.completedAt ?? date) : undefined,
  };
}

export function createPiggyBanksRouter(users: UserStore, transactions: TransactionStore): Router {
  const router = Router();
  router.use(requireAuth);

  /** GET /piggy-banks — metas com progresso calculado. */
  router.get('/piggy-banks', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const user = await users.findById(userId);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
      const items = user.profile.piggyBanks.map((g) => ({
        ...g,
        left: Math.max(0, g.goalAmount - g.savedAmount),
        progress: progressOf(g.savedAmount, g.goalAmount),
        done: g.goalAmount > 0 && g.savedAmount >= g.goalAmount,
      }));
      res.json({ items });
    } catch (err) { next(err); }
  });

  /** POST /piggy-banks — cria meta (grátis: até 3 em andamento). */
  router.post('/piggy-banks', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados da meta inválidos.' });
        return;
      }
      const user = await users.findById(userId);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }

      const active = user.profile.piggyBanks.filter((g) => !(g.goalAmount > 0 && g.savedAmount >= g.goalAmount));
      if (user.plan === 'free' && active.length >= FREE_ACTIVE_GOALS) {
        res.status(403).json({ error: `No plano grátis são até ${FREE_ACTIVE_GOALS} cofrinhos em andamento. Conclua uma meta ou conheça o Premium.` });
        return;
      }

      const data = parsed.data;
      const goal: PiggyBankItemModel = {
        id: Math.max(0, ...user.profile.piggyBanks.map((g) => g.id)) + 1,
        title: data.title,
        description: data.description,
        savedAmount: 0,
        goalAmount: data.goalAmount,
        progress: 0,
        iconType: data.iconType,
        progressColor: data.progressColor,
        deadline: data.deadline,
        createdAt: todayIso(),
        moves: [],
      };
      await users.saveOnboardingProfile(userId, { ...user.profile, piggyBanks: [...user.profile.piggyBanks, goal] });
      res.status(201).json({ item: goal });
    } catch (err) { next(err); }
  });

  /**
   * Aporte e resgate: POST /piggy-banks/:id/deposit|withdraw {amount, date?}.
   * Também lança a transação correspondente — "encher o cofrinho" deduz do saldo do mês.
   */
  const move = (kind: 'deposit' | 'withdraw') => async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = moveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Valor inválido.' });
        return;
      }
      const user = await users.findById(userId);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }

      const id = Number(req.params.id);
      const goal = user.profile.piggyBanks.find((g) => g.id === id);
      if (!goal) { res.status(404).json({ error: 'Cofrinho não encontrado.' }); return; }

      const date = parsed.data.date ?? todayIso();
      const amount = kind === 'deposit' ? Math.abs(parsed.data.amount) : -Math.abs(parsed.data.amount);
      const updated = applyMove(goal, amount, date);
      const piggyBanks = user.profile.piggyBanks.map((g) => (g.id === id ? updated : g));
      await users.saveOnboardingProfile(userId, { ...user.profile, piggyBanks });

      // O aporte sai do saldo do mês (despesa); o resgate volta como entrada.
      const item = await transactions.create(userId, {
        kind: kind === 'deposit' ? 'despesa' : 'receita',
        amount: Math.abs(amount),
        date,
        description: kind === 'deposit' ? `Cofrinho: ${goal.title}` : `Resgate do cofrinho: ${goal.title}`,
        category: kind === 'deposit' ? 'outros' : 'outrasEntradas',
        method: 'pix',
        impulse: false,
      });

      res.json({ item: updated, transaction: item });
    } catch (err) { next(err); }
  };

  router.post('/piggy-banks/:id/deposit', move('deposit'));
  router.post('/piggy-banks/:id/withdraw', move('withdraw'));

  return router;
}
