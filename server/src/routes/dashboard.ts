import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import type { TransactionStore } from '../repositories/transactionRepository.js';
import type { UserStore } from '../repositories/userRepository.js';
import { billStatus, buildLimitAlert, currentMonthKey, limitStatus } from '../utils/dashboard.js';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const userIdOf = (req: AuthenticatedRequest) => req.auth?.sub;
const monthParam = (raw: unknown) => (/^\d{4}-\d{2}$/.test(String(raw)) ? String(raw) : currentMonthKey());

const prevMonthKey = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

const addMonthsKey = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const sums = (items: { kind: string; amount: number }[]) => ({
  income: items.filter((t) => t.kind === 'receita').reduce((s, t) => s + t.amount, 0),
  expense: items.filter((t) => t.kind === 'despesa').reduce((s, t) => s + t.amount, 0),
});

export function createDashboardRouter(users: UserStore, transactions: TransactionStore): Router {
  const router = Router();
  router.use(requireAuth);

  /**
   * GET /dashboard/summary?month=aaaa-mm
   * Entradas, saídas e saldo do mês + gasto por categoria com teto e alertas (>=80%).
   */
  router.get('/dashboard/summary', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const month = monthParam(req.query.month);

      const [user, monthTx, prevTx] = await Promise.all([
        users.findById(userId),
        transactions.list(userId, month),
        transactions.list(userId, prevMonthKey(month)),
      ]);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }

      const expenses = monthTx.filter((t) => t.kind === 'despesa');
      const { income, expense } = sums(monthTx);
      const prev = sums(prevTx);
      const byCategory = new Map<string, number>();
      for (const t of expenses) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);

      const categories = user.profile.categoryBudgets
        .filter((b) => b.limit > 0)
        .map((b) => {
          const spent = byCategory.get(b.id) ?? 0;
          const used = spent / b.limit;
          return { id: b.id, name: b.name, limit: b.limit, spent, used, left: b.limit - spent, status: limitStatus(used) };
        })
        .sort((a, b) => b.used - a.used);

      const alerts = categories
        .map((c) => buildLimitAlert({ id: c.id, name: c.name, limit: c.limit }, c.spent))
        .filter((a) => a !== null);

      res.json({
        month,
        income,
        expense,
        balance: income - expense,
        /** Parte da renda que sobrou no mês (0 a 1). */
        savingsRate: income > 0 ? Math.max(0, (income - expense) / income) : 0,
        impulseTotal: expenses.filter((t) => t.impulse).reduce((s, t) => s + t.amount, 0),
        counts: { income: monthTx.length - expenses.length, expense: expenses.length },
        previousMonth: { month: prevMonthKey(month), income: prev.income, expense: prev.expense },
        categories,
        alerts,
      });
    } catch (err) { next(err); }
  });

  /**
   * GET /dashboard/evolution?months=3&end=aaaa-mm
   * Evolução mensal: um ponto por mês (receitas, despesas, saldo), do mais antigo ao `end`.
   */
  router.get('/dashboard/evolution', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const months = Math.min(12, Math.max(2, Number(req.query.months) || 3));
      const end = monthParam(req.query.end);
      const all = await transactions.list(userId);

      const series = Array.from({ length: months }, (_, i) => {
        const key = addMonthsKey(end, i - (months - 1));
        const monthTx = all.filter((t) => t.date.startsWith(key));
        const { income, expense } = sums(monthTx);
        return { key, label: MONTHS_SHORT[Number(key.slice(5, 7)) - 1], income, expense, balance: income - expense };
      });

      res.json({ months: series });
    } catch (err) { next(err); }
  });

  /**
   * GET /bills — boletos do perfil com dias para o vencimento calculados na hora
   * ("Vencido há 2 dias", "Vence hoje", "Vence em 5 dias").
   */
  router.get('/bills', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const user = await users.findById(userId);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }

      const items = user.profile.fixedBills
        .map((b) => ({ ...b, ...billStatus(b.dueDay) }))
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      res.json({ items });
    } catch (err) { next(err); }
  });

  /** GET /subscriptions — assinaturas com custo mensal e projeção anual. */
  router.get('/subscriptions', async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = userIdOf(req);
      if (!userId) { res.status(401).json({ error: 'Sessão inválida.' }); return; }
      const user = await users.findById(userId);
      if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }

      const items = user.profile.subscriptions.map((s) => ({ ...s, ...billStatus(s.dueDay) }));
      const monthlyTotal = items.reduce((s, i) => s + i.price, 0);

      res.json({ items, count: items.length, monthlyTotal, yearlyTotal: monthlyTotal * 12 });
    } catch (err) { next(err); }
  });

  return router;
}
