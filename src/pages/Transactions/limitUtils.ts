import { EXPENSE_CATEGORIES, categoryById } from '../../data/transactionCategories';
import type { CategoryBudgetItem } from '../../types/auth';
import type { Transaction } from '../../types/transactions';
import { parseIsoMonth, toIsoMonth } from '../../utils/dates';

/**
 * Contas da aba "Limites do mês" (doc 5.5, LIM-RF01 a RF04).
 * A tela só mostra; tudo que é número sai daqui.
 */

/** Faixas do limite: até 79% tranquilo, de 80% a 100% atenção, passou de 100% estourou. */
export type LimitStatus = 'ok' | 'warn' | 'bad';

export const WARN_AT = 0.8;

export const limitStatus = (used: number): LimitStatus => (used > 1 ? 'bad' : used >= WARN_AT ? 'warn' : 'ok');

export const STATUS_LABEL: Record<LimitStatus, string> = { ok: 'Tranquilo', warn: 'Atenção', bad: 'Estourou' };

/** Símbolo junto da cor, para quem não distingue as cores. */
export const STATUS_SYMBOL: Record<LimitStatus, string> = { ok: '✓', warn: '!', bad: '✕' };

export interface LimitRowData {
  id: string;
  label: string;
  limit: number;
  spent: number;
  /** Fração usada (1 = 100%). */
  used: number;
  /** Quanto ainda dá para gastar (negativo = passou do limite). */
  left: number;
  status: LimitStatus;
}

/** Limites com o gasto do mês, do mais apertado para o mais folgado. */
export function buildLimitRows(budgets: CategoryBudgetItem[]): LimitRowData[] {
  return budgets
    .filter((b) => b.limit > 0)
    .map((b) => {
      const used = b.spent / b.limit;
      return {
        id: b.id,
        label: categoryById(b.id).label,
        limit: b.limit,
        spent: b.spent,
        used,
        left: b.limit - b.spent,
        status: limitStatus(used),
      };
    })
    .sort((a, b) => b.used - a.used);
}

/** Soma de tudo: limite total, gasto dentro das categorias com limite e quanto sobra. */
export function limitTotals(rows: LimitRowData[]) {
  const limit = rows.reduce((s, r) => s + r.limit, 0);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  return {
    limit,
    spent,
    used: limit ? spent / limit : 0,
    /** Sobra só do que ainda não estourou (o que passou não "devolve" espaço para os outros). */
    left: rows.reduce((s, r) => s + Math.max(0, r.left), 0),
    warn: rows.filter((r) => r.status === 'warn'),
    over: rows.filter((r) => r.status === 'bad'),
  };
}

/**
 * Dias que faltam no mês escolhido, contando hoje.
 * Mês que já passou: 0. Mês que ainda vai chegar: o mês inteiro.
 */
export function daysLeft(monthKey: string) {
  const { y, m } = parseIsoMonth(monthKey);
  const total = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const nowKey = toIsoMonth(today.getFullYear(), today.getMonth());
  if (monthKey < nowKey) return 0;
  if (monthKey > nowKey) return total;
  return total - today.getDate() + 1;
}

/** Média gasta na categoria nos `months` meses antes do mês escolhido (só meses que tiveram transação). */
export function categoryAverage(transactions: Transaction[], categoryId: string, monthKey: string, months = 3) {
  const { y, m } = parseIsoMonth(monthKey);
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 - i, 1);
    return toIsoMonth(d.getFullYear(), d.getMonth());
  });
  // Mês sem nenhuma transação (conta ainda não existia) não entra na média
  const active = keys.filter((k) => transactions.some((t) => t.date.startsWith(k)));
  if (!active.length) return 0;
  const total = transactions
    .filter((t) => t.kind === 'despesa' && t.category === categoryId && active.some((k) => t.date.startsWith(k)))
    .reduce((s, t) => s + t.amount, 0);
  return total / active.length;
}

const round50 = (v: number) => Math.max(50, Math.round(v / 50) * 50);

/** Limite que dá para cumprir: a média arredondada para cima, de 50 em 50. */
export const suggestedLimit = (average: number) => (average > 0 ? Math.max(50, Math.ceil(average / 50) * 50) : 0);

/** Botões de "Valores rápidos": em volta da sugestão (ou do limite atual), sem repetir. */
export function quickValues(average: number, current: number) {
  const base = suggestedLimit(average) || current || 500;
  const values = [0.85, 1, 1.1, 1.25].map((f) => round50(base * f));
  // O limite de hoje também aparece, para dar para voltar a ele com um toque
  if (current > 0) values.push(Math.round(current));
  return [...new Set(values)].sort((a, b) => a - b);
}

/** Categorias de despesa que ainda não têm limite. */
export const categoriesWithoutLimit = (budgets: CategoryBudgetItem[]) =>
  EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.id === c.id && b.limit > 0));

/** Item de limite novo ou editado, já com o nome e as cores da categoria. */
export function budgetItem(id: string, limit: number, previous?: CategoryBudgetItem): CategoryBudgetItem {
  const cat = categoryById(id);
  return {
    id,
    name: previous?.name ?? cat.label,
    limit,
    spent: previous?.spent ?? 0,
    color: previous?.color ?? cat.color,
    background: previous?.background ?? `${cat.color}22`,
  };
}

/** Lista nova com o limite da categoria criado/trocado (limit > 0) ou removido (limit = 0). */
export function withLimit(budgets: CategoryBudgetItem[], id: string, limit: number) {
  const previous = budgets.find((b) => b.id === id);
  if (limit <= 0) return budgets.filter((b) => b.id !== id);
  return previous ? budgets.map((b) => (b.id === id ? budgetItem(id, limit, b) : b)) : [...budgets, budgetItem(id, limit)];
}

/** Dica do Paggo, sempre em linguagem simples. */
export type LimitTip =
  /** Estourou e outra categoria tem sobra suficiente: dá para mover o valor. */
  | { kind: 'move'; over: LimitRowData; from: LimitRowData; amount: number }
  /** Estourou e ninguém tem sobra. */
  | { kind: 'over'; over: LimitRowData }
  /** Perto do limite: quanto dá por dia. */
  | { kind: 'warn'; row: LimitRowData; perDay: number }
  | { kind: 'ok' }
  | { kind: 'empty' };

export function limitTip(rows: LimitRowData[], days: number): LimitTip {
  if (!rows.length) return { kind: 'empty' };
  const over = rows.find((r) => r.status === 'bad' && r.left < -0.5);
  if (over) {
    const amount = Math.ceil(-over.left);
    // Quem mais sobra, desde que continue "tranquilo" depois de ceder o valor
    const from = [...rows]
      .filter((r) => r.id !== over.id && r.left - amount >= 0 && (r.spent / (r.limit - amount) || 0) < WARN_AT)
      .sort((a, b) => b.left - a.left)[0];
    return from ? { kind: 'move', over, from, amount } : { kind: 'over', over };
  }
  const warn = rows.find((r) => r.status === 'warn' || r.status === 'bad');
  if (warn) return { kind: 'warn', row: warn, perDay: days ? Math.max(0, warn.left) / days : 0 };
  return { kind: 'ok' };
}
