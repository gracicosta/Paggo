import type { CategoryBudgetItem } from '../types/auth';
import type { Transaction } from '../types/transactions';
import { MONTHS_SHORT, monthKeys, parseIsoMonth, parseMonthLabel, toIsoMonth } from '../utils/dates';

export const sumAmounts = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);

/** Soma das despesas de cada categoria. */
export function spentByCategory(expenses: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of expenses) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return map;
}

/** Um ponto por mês (do mais antigo ao escolhido) para o gráfico de evolução. */
export interface MonthPoint {
  key: string;
  /** "Nov" */
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

/**
 * Últimos `count` meses até `endKey` ("aaaa-mm"). Começa no primeiro mês que tem alguma transação,
 * para o gráfico não mostrar meses vazios de antes da conta existir (sempre pelo menos 2 pontos).
 */
export function monthSeries(transactions: Transaction[], endKey: string, count: number): MonthPoint[] {
  const { y, m } = parseIsoMonth(endKey);
  const keys = Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - (count - 1 - i), 1);
    return toIsoMonth(d.getFullYear(), d.getMonth());
  });
  const firstWithData = transactions.reduce<string | null>((min, t) => {
    const k = t.date.slice(0, 7);
    return min === null || k < min ? k : min;
  }, null);
  // Nenhuma transação até o mês escolhido: mostra só os 2 últimos meses
  let start = firstWithData ? keys.findIndex((k) => k >= firstWithData) : -1;
  if (start === -1) start = count - 2;
  start = Math.min(start, count - 2);

  return keys.slice(start).map((key) => {
    const list = transactions.filter((t) => t.date.startsWith(key));
    const receitas = sumAmounts(list.filter((t) => t.kind === 'receita'));
    const despesas = sumAmounts(list.filter((t) => t.kind === 'despesa'));
    return { key, label: MONTHS_SHORT[parseIsoMonth(key).m], receitas, despesas, saldo: receitas - despesas };
  });
}

/**
 * Todos os números de um mês, calculados a partir das transações.
 * É a ÚNICA conta de totais do app: o Dashboard e a tela de Transações usam esta função,
 * então o que é lançado em uma tela aparece na outra na hora.
 *
 * @param month texto do seletor do topo ("Novembro 2026")
 * @param budgets limites por categoria do perfil (o `spent` é recalculado aqui)
 */
export function summarizeMonth(transactions: Transaction[], budgets: CategoryBudgetItem[], month: string, seriesLength = 3) {
  const keys = monthKeys(month);
  const monthTx = transactions.filter((t) => t.date.startsWith(keys.current));
  // Mês em andamento: compara com o MESMO trecho do mês anterior (dia 1 até hoje),
  // senão um mês pela metade sempre parece "pior" que um mês inteiro.
  const today = new Date();
  const inProgress = keys.current === toIsoMonth(today.getFullYear(), today.getMonth());
  const prevUntil = `${keys.previous}-${String(today.getDate()).padStart(2, '0')}`;
  const prevTx = transactions.filter(
    (t) => t.date.startsWith(keys.previous) && (!inProgress || t.date <= prevUntil),
  );

  const incomes = monthTx.filter((t) => t.kind === 'receita');
  const expenses = monthTx.filter((t) => t.kind === 'despesa');
  const impulses = expenses.filter((t) => t.impulse);

  const totalIn = sumAmounts(incomes);
  const totalOut = sumAmounts(expenses);
  const balance = totalIn - totalOut;
  const prevIn = sumAmounts(prevTx.filter((t) => t.kind === 'receita'));
  const prevOut = sumAmounts(prevTx.filter((t) => t.kind === 'despesa'));

  const byCategory = spentByCategory(expenses);
  // Limites com o gasto real do mês (antes o painel mostrava um valor fixo do perfil)
  const categoryBudgets = budgets.map((b) => ({ ...b, spent: byCategory.get(b.id) ?? 0 }));

  const { y, m } = parseMonthLabel(month);

  return {
    keys,
    /** true quando o mês escolhido é o atual (a comparação usa só até o mesmo dia do mês anterior). */
    inProgress,
    /** Explicação da comparação, para o title/tooltip dos selos. */
    vsPrevHint: inProgress
      ? `Comparado com ${keys.prevName} do dia 1 ao dia ${today.getDate()}, o mesmo período deste mês`
      : `Comparado com ${keys.prevName} inteiro`,
    monthTx,
    incomes,
    expenses,
    impulses,
    totalIn,
    totalOut,
    balance,
    prevIn,
    prevOut,
    impulseTotal: sumAmounts(impulses),
    /** Parte da renda que sobrou (0 a 1). */
    savingsRate: totalIn > 0 ? Math.max(0, balance / totalIn) : 0,
    byCategory,
    categoryBudgets,
    series: monthSeries(transactions, toIsoMonth(y, m), seriesLength),
  };
}

export type MonthSummary = ReturnType<typeof summarizeMonth>;
