import type { GoalMove, PiggyBankItemModel } from '../types/auth';
import { goalTypeById, goalTypeOf, type GoalTypeInfo } from './goalTypes';
import { MONTHS_LOWER, MONTHS_SHORT_LOWER, parseIsoMonth, toIsoDate, toIsoMonth } from '../utils/dates';

/**
 * Contas das metas (cofrinhos): quanto falta, quanto guardar por mês, se está no ritmo e o histórico.
 * Funções puras: a aba Metas e o Dashboard leem tudo pelo hook useGoals.
 */

/** done = alcançou o valor · onTrack = guardando todo mês · behind = o mês passado ficou sem depósito
 *  · starting = ainda sem depósitos · noDeadline = meta sem prazo. */
export type GoalStatus = 'done' | 'onTrack' | 'behind' | 'starting' | 'noDeadline';

export interface GoalMonth {
  /** "aaaa-mm" */
  key: string;
  /** "jun", "jul"… */
  label: string;
  /** Total depositado no mês (retiradas não entram na barra). */
  amount: number;
  /** Mês que já passou, com a meta já criada, e sem nenhum depósito. */
  missed: boolean;
}

export interface GoalView {
  id: number;
  title: string;
  description: string;
  type: GoalTypeInfo;
  color: string;
  saved: number;
  target: number;
  /** Quanto falta (0 quando completa). */
  left: number;
  /** 0 a 1 (pode passar de 1 se guardou além do valor). */
  progress: number;
  deadline?: string;
  /** Meses até o prazo, contando a partir do mês que vem (null = sem prazo). */
  monthsLeft: number | null;
  /** Quanto guardar por mês para chegar no prazo (0 = sem prazo ou completa). */
  perMonth: number;
  status: GoalStatus;
  /** Últimos 6 meses, terminando no mês escolhido no topo. */
  history: GoalMonth[];
  /** Depositado no mês escolhido, já descontadas as retiradas. */
  inMonth: number;
  /** Nome do mês passado, quando ele ficou sem depósito ("outubro"). */
  missedMonth?: string;
  done: boolean;
  completedAt?: string;
}

export const HISTORY_MONTHS = 6;

const monthKeyOf = (isoDate: string) => isoDate.slice(0, 7);

/** "aaaa-mm" do mês `n` meses depois (ou antes, com n negativo) de `key`. */
export function shiftMonth(key: string, n: number) {
  const { y, m } = parseIsoMonth(key);
  const d = new Date(y, m + n, 1);
  return toIsoMonth(d.getFullYear(), d.getMonth());
}

/** Quantos meses de `from` até `to` ("2026-11" → "2027-12" = 13). Negativo se `to` já passou. */
export function monthsBetween(from: string, to: string) {
  const a = parseIsoMonth(from);
  const b = parseIsoMonth(to);
  return (b.y - a.y) * 12 + (b.m - a.m);
}

/** Prazo "aaaa-mm" para juntar o dinheiro em `months` parcelas, a primeira no mês que vem. */
export function deadlineIn(months: number, today = new Date()) {
  return shiftMonth(toIsoMonth(today.getFullYear(), today.getMonth()), months);
}

/** "dez/2027" */
export function shortMonth(key: string) {
  const { y, m } = parseIsoMonth(key);
  return `${MONTHS_SHORT_LOWER[m]}/${y}`;
}

/** "outubro" */
export const monthNameOf = (key: string) => MONTHS_LOWER[parseIsoMonth(key).m];

const sumIn = (moves: GoalMove[], key: string, onlyDeposits = false) =>
  moves
    .filter((mv) => monthKeyOf(mv.date) === key && (!onlyDeposits || mv.amount > 0))
    .reduce((s, mv) => s + mv.amount, 0);

/**
 * Tudo o que as telas mostram de um cofrinho.
 * @param monthKey mês escolhido no topo ("aaaa-mm"): define o histórico e o "depositado no mês".
 * @param today o prazo e o ritmo contam sempre a partir de hoje.
 */
export function buildGoalView(goal: PiggyBankItemModel, monthKey: string, today = new Date()): GoalView {
  const type = goalTypeOf(goal);
  const moves = goal.moves ?? [];
  const saved = goal.savedAmount;
  const target = goal.goalAmount;
  const left = Math.max(0, target - saved);
  const done = target > 0 && saved >= target;
  const nowKey = toIsoMonth(today.getFullYear(), today.getMonth());
  const createdKey = goal.createdAt ? monthKeyOf(goal.createdAt) : moves[0] ? monthKeyOf(moves[0].date) : nowKey;

  const monthsLeft = goal.deadline ? monthsBetween(nowKey, goal.deadline) : null;
  const perMonth = done || monthsLeft === null ? 0 : Math.ceil(left / Math.max(1, monthsLeft));

  const history: GoalMonth[] = Array.from({ length: HISTORY_MONTHS }, (_, i) => {
    const key = shiftMonth(monthKey, i - HISTORY_MONTHS + 1);
    const amount = sumIn(moves, key, true);
    return {
      key,
      label: MONTHS_SHORT_LOWER[parseIsoMonth(key).m],
      amount,
      missed: amount === 0 && key >= createdKey && key < nowKey && (!goal.completedAt || key <= monthKeyOf(goal.completedAt)),
    };
  });

  const prevKey = shiftMonth(nowKey, -1);
  const missedLast = !done && prevKey >= createdKey && sumIn(moves, prevKey, true) === 0;

  let status: GoalStatus;
  if (done) status = 'done';
  else if (!moves.length && saved === 0) status = 'starting';
  else if (missedLast || (monthsLeft !== null && monthsLeft < 0)) status = 'behind';
  else if (monthsLeft === null) status = 'noDeadline';
  else status = 'onTrack';

  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    type,
    color: goal.progressColor || type.color,
    saved,
    target,
    left,
    progress: target ? saved / target : 0,
    deadline: goal.deadline,
    monthsLeft,
    perMonth,
    status,
    history,
    inMonth: sumIn(moves, monthKey),
    missedMonth: missedLast ? monthNameOf(prevKey) : undefined,
    done,
    completedAt: goal.completedAt,
  };
}

/** Números do resumo da aba Metas (só metas em andamento, menos "Já conquistou"). */
export function goalTotals(views: GoalView[]) {
  const active = views.filter((v) => !v.done);
  const done = views.filter((v) => v.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const saved = active.reduce((s, v) => s + v.saved, 0);
  const target = active.reduce((s, v) => s + v.target, 0);
  const planned = active.reduce((s, v) => s + v.perMonth, 0);
  const inMonth = active.reduce((s, v) => s + Math.max(0, v.inMonth), 0);
  const behind = active.filter((v) => v.status === 'behind');
  return {
    active,
    done,
    saved,
    target,
    progress: target ? saved / target : 0,
    /** Soma do "guardar por mês" de todas as metas com prazo. */
    planned,
    inMonth,
    behind,
    onTrack: active.length - behind.length,
  };
}

export type GoalTotals = ReturnType<typeof goalTotals>;

/** Deposita (valor positivo) ou retira (negativo) e devolve a lista nova de cofrinhos. */
export function withMove(goals: PiggyBankItemModel[], id: number, amount: number, today = new Date()): PiggyBankItemModel[] {
  const date = toIsoDate(today);
  return goals.map((g) => {
    if (g.id !== id) return g;
    const savedAmount = Math.max(0, Math.round((g.savedAmount + amount) * 100) / 100);
    const reached = g.goalAmount > 0 && savedAmount >= g.goalAmount;
    const moves = [...(g.moves ?? []), { id: `mv_${Date.now()}`, date, amount: savedAmount - g.savedAmount }];
    return {
      ...g,
      savedAmount,
      progress: g.goalAmount ? Math.round((savedAmount / g.goalAmount) * 100) : 0,
      moves,
      completedAt: reached ? (g.completedAt ?? date) : undefined,
    };
  });
}

export interface NewGoalInput {
  typeId: string;
  title: string;
  amount: number;
  /** Prazo em meses (a primeira parcela no mês que vem). */
  months: number;
}

/** Cofrinho novo, vazio, no fim da lista. */
export function createGoal(goals: PiggyBankItemModel[], input: NewGoalInput, today = new Date()): PiggyBankItemModel {
  const type = goalTypeById(input.typeId) ?? goalTypeOf({ title: input.title });
  const deadline = deadlineIn(input.months, today);
  return {
    id: goals.reduce((max, g) => Math.max(max, g.id), 0) + 1,
    title: input.title.trim() || type.label,
    description: `Até ${shortMonth(deadline)}`,
    savedAmount: 0,
    goalAmount: input.amount,
    progress: 0,
    iconType: type.id,
    progressColor: type.color,
    deadline,
    createdAt: toIsoDate(today),
    moves: [],
  };
}

/** Quanto guardar por mês para juntar `amount` em `months` meses. */
export const monthlyFor = (amount: number, months: number) => (months > 0 ? Math.ceil(amount / months) : amount);
