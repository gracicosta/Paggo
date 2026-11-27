import { categoryById, categoryIndex } from '../../data/transactionCategories';
import { seriesColor } from '../../utils/palette';
import type { PaletteId } from '../../types/prefs';
import { MONTHS_LOWER, WEEKDAYS, addDays, toIsoDate } from '../../utils/dates';
import type { Transaction } from '../../types/transactions';
import type { FixedBillItem } from '../../types/auth';

/** Cor da categoria: a própria na paleta padrão, ou a da paleta de daltonismo escolhida. */
export const catColor = (id: string, palette: PaletteId, dark: boolean) =>
  seriesColor(palette, dark, categoryIndex(id), categoryById(id).color);

/** "Hoje · 27 de novembro", "Ontem · 26 de novembro", "Terça · 25 de novembro" */
export function dayLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const rest = `${d} de ${MONTHS_LOWER[m - 1]}`;
  if (iso === toIsoDate(today)) return `Hoje · ${rest}`;
  if (iso === toIsoDate(addDays(today, -1))) return `Ontem · ${rest}`;
  return `${WEEKDAYS[date.getDay()]} · ${rest}`;
}

export const signed = (t: Transaction) => (t.kind === 'receita' ? t.amount : -t.amount);

/** Agrupa por dia, do mais recente para o mais antigo. */
export function groupByDay(list: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const t of [...list].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1))) {
    map.set(t.date, [...(map.get(t.date) ?? []), t]);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items, total: items.reduce((s, t) => s + signed(t), 0) }));
}

/** Id da fatia "Outras" da rosca (soma das categorias depois das 5 maiores). */
export const OTHER_SLICE_ID = 'outros_resto';

/** As 5 categorias que mais gastaram + "Outras" com o resto, da maior para a menor. */
export function topCategories(spent: Map<string, number>, max = 5): [string, number][] {
  const list = [...spent.entries()].sort((a, b) => b[1] - a[1]);
  const top = list.slice(0, max);
  const rest = list.slice(max).reduce((s, [, v]) => s + v, 0);
  return rest > 0 ? [...top, [OTHER_SLICE_ID, rest]] : top;
}

/**
 * "Dava para pagar 2 meses de internet": compara o gasto por impulso com a conta fixa
 * mais cara que ainda caiba no valor. null quando não há comparação possível.
 */
export function impulseComparison(impulseTotal: number, fixedBills: FixedBillItem[]): string | null {
  if (!impulseTotal) return null;
  const bill = [...fixedBills].filter((b) => b.value > 0 && b.value <= impulseTotal).sort((a, b) => b.value - a.value)[0];
  if (!bill) return null;
  const times = Math.floor(impulseTotal / bill.value);
  const name = bill.title
    .replace(/^(Conta de|Plano de)\s+/i, '')
    .split(/[/(]/)[0]
    .trim()
    .toLowerCase();
  return `Dava para pagar ${times} ${times === 1 ? 'mês' : 'meses'} de ${name}.`;
}

export interface LimitAlert {
  id: string;
  label: string;
  /** Fração do limite já usada (1 = 100%). */
  used: number;
  /** Quanto ainda falta (negativo = passou do limite). */
  left: number;
}

/** Categoria mais perto de estourar o limite (LIM-RF02/RF03), ou undefined se não houver limites. */
export function closestLimit(budgets: Array<{ id: string; limit: number; spent: number }>): LimitAlert | undefined {
  return budgets
    .filter((b) => b.limit > 0)
    .map((b) => ({
      id: b.id,
      label: categoryById(b.id).label,
      used: b.spent / b.limit,
      left: b.limit - b.spent,
    }))
    .sort((a, b) => b.used - a.used)[0];
}
