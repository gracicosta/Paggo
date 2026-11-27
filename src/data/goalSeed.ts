import type { GoalMove, PiggyBankItemModel } from '../types/auth';
import { toIsoDate, toIsoMonth } from '../utils/dates';

/** "aaaa-mm-dd" do dia `day` (ou hoje, se ainda não chegou) do mês `back` meses atrás. */
function dayMonthsAgo(back: number, day: number, today: Date) {
  const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const wanted = Math.min(day, last, back === 0 ? today.getDate() : last);
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), wanted));
}

/** "aaaa-mm" de `n` meses à frente. */
function monthAhead(n: number, today: Date) {
  const d = new Date(today.getFullYear(), today.getMonth() + n, 1);
  return toIsoMonth(d.getFullYear(), d.getMonth());
}

/** Depósitos mensais (do mais antigo para o mais novo), terminando `endBack` meses atrás. 0 = mês sem depósito. */
function monthly(prefix: string, values: number[], today: Date, endBack = 0): GoalMove[] {
  return values
    .map((amount, i) => {
      const back = endBack + values.length - 1 - i;
      return { id: `${prefix}-${back}`, date: dayMonthsAgo(back, 5, today), amount };
    })
    .filter((m) => m.amount !== 0);
}

const sum = (moves: GoalMove[]) => moves.reduce((s, m) => s + m.amount, 0);

function goal(base: Omit<PiggyBankItemModel, 'savedAmount' | 'progress'>): PiggyBankItemModel {
  const savedAmount = sum(base.moves ?? []);
  return { ...base, savedAmount, progress: Math.round((savedAmount / base.goalAmount) * 100) };
}

/**
 * Metas da conta de teste (demo), com depósitos dos últimos meses calculados a partir de hoje,
 * para a aba Metas sempre mostrar o histórico, uma meta "um pouco atrás" e uma já conquistada.
 */
export function demoPiggyBanks(today = new Date()): PiggyBankItemModel[] {
  return [
    goal({
      id: 1,
      title: 'Reserva de emergência',
      description: 'Para imprevistos',
      goalAmount: 10000,
      iconType: 'reserva',
      progressColor: '#0EA5E9',
      deadline: monthAhead(13, today),
      createdAt: dayMonthsAgo(7, 1, today),
      moves: monthly('res', [130, 400, 500, 500, 550, 600, 520], today),
    }),
    goal({
      id: 2,
      title: 'Viagem para Salvador',
      description: 'Férias em família',
      goalAmount: 4000,
      iconType: 'viagem',
      progressColor: '#F97316',
      deadline: monthAhead(8, today),
      createdAt: dayMonthsAgo(6, 1, today),
      moves: monthly('via', [300, 300, 350, 300, 0, 250], today),
    }),
    goal({
      id: 3,
      title: 'Entrada do apê',
      description: 'Meu primeiro imóvel',
      goalAmount: 30000,
      iconType: 'casa',
      progressColor: '#8B5CF6',
      deadline: monthAhead(37, today),
      createdAt: dayMonthsAgo(6, 1, today),
      moves: monthly('ape', [300, 400, 400, 450, 450, 400], today),
    }),
    goal({
      id: 4,
      title: 'Celular novo',
      description: 'Trocar o celular quebrado',
      goalAmount: 1800,
      iconType: 'guardar',
      progressColor: '#10B981',
      createdAt: dayMonthsAgo(9, 1, today),
      completedAt: dayMonthsAgo(3, 5, today),
      moves: monthly('cel', [300, 300, 300, 300, 300, 300], today, 3),
    }),
  ];
}
