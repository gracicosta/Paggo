import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import type { TransactionStore } from '../repositories/transactionRepository.js';
import type { UserStore } from '../repositories/userRepository.js';
import { resolveCategorySlug } from '../utils/categorize.js';
import { buildLimitAlert } from '../utils/dashboard.js';

const transactionSchema = z.object({
  kind: z.enum(['receita', 'despesa']),
  amount: z.number().positive('Informe um valor maior que zero.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use aaaa-mm-dd).'),
  description: z.string().trim().min(1).max(200),
  /** Categoria opcional: vazia ou desconhecida, a descrição decide (categorização automática). */
  category: z.string().trim().optional(),
  method: z.enum(['pix', 'debito', 'credito', 'dinheiro', 'boleto', 'deposito']).default('pix'),
  impulse: z.boolean().default(false),
});

const bulkSchema = z.object({ items: z.array(transactionSchema.extend({ id: z.string().optional() })).max(5000) });

const userIdOf = (req: AuthenticatedRequest) => req.auth?.sub;

/**
 * POST /transactions devolve, além da transação salva, o alerta de limite da categoria
 * (>=80% atenção, >100% estourou) — é o gatilho do aviso em tempo real no Dashboard.
 */
async function limitAlertFor(users: UserStore, transactions: TransactionStore, userId: string, category: string, date: string) {
  const [user, monthTx] = await Promise.all([
    users.findById(userId),
    transactions.list(userId, date.slice(0, 7)),
  ]);
  const budget = user?.profile.categoryBudgets.find((b) => b.id === category && b.limit > 0);
  if (!budget) return null;
  const spent = monthTx
    .filter((t) => t.kind === 'despesa' && t.category === category)
    .reduce((s, t) => s + t.amount, 0);
  return buildLimitAlert({ id: budget.id, name: budget.name, limit: budget.limit }, spent);
}

export function createTransactionsRouter(transactions: TransactionStore, users: UserStore): Router {
  const router = Router();
  router.use(requireAuth);

  /** GET /transactions?month=aaaa-mm — lista (sem month: tudo, do mais recente ao mais antigo). */
  router.get('/transactions', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const month = String(req.query.month ?? '').trim();
      const validMonth = /^\d{4}-\d{2}$/.test(month) ? month : undefined;
      res.json({ items: await transactions.list(userId, validMonth) });
    } catch (err) { next(err); }
  });

  /** PUT /transactions {items} — espelha a lista inteira do cliente (uma escrita por mudança). */
  router.put('/transactions', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = bulkSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Lista de transações inválida.' });
        return;
      }
      const items = await transactions.replaceAll(
        userId,
        parsed.data.items.map((t) => ({ ...t, category: resolveCategorySlug(t.category, t.description, t.kind) })),
      );
      res.json({ items });
    } catch (err) { next(err); }
  });

  /** POST /transactions — cria um lançamento (sem categoria, a descrição decide) e já avalia o limite. */
  router.post('/transactions', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = transactionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Transação inválida.' });
        return;
      }
      const data = parsed.data;
      const input = {
        ...data,
        category: resolveCategorySlug(data.category, data.description, data.kind),
      };
      const item = await transactions.create(userId, input);
      const limitAlert = input.kind === 'despesa'
        ? await limitAlertFor(users, transactions, userId, input.category, input.date)
        : null;
      res.status(201).json({ item, autoCategorized: !data.category, limitAlert });
    } catch (err) { next(err); }
  });

  router.put('/transactions/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const parsed = transactionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Transação inválida.' });
        return;
      }
      const data = parsed.data;
      const item = await transactions.update(userId, String(req.params.id), {
        ...data,
        category: resolveCategorySlug(data.category, data.description, data.kind),
      });
      if (!item) { res.status(404).json({ error: 'Transação não encontrada.' }); return; }
      res.json({ item });
    } catch (err) { next(err); }
  });

  router.delete('/transactions/:id', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const removed = await transactions.remove(userId, String(req.params.id));
      if (!removed) { res.status(404).json({ error: 'Transação não encontrada.' }); return; }
      res.status(204).end();
    } catch (err) { next(err); }
  });

  return router;
}
