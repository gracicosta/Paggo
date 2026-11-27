import type {
  AiPlanAction,
  CategoryBudgetItem,
  FixedBillItem,
  PiggyBankItemModel,
  SubscriptionItem,
  UserFinancialProfile,
} from '../../types/auth';
import { brl as brlDigits, brlInt } from '../../utils/format';
import { MONTH_NAMES, monthName, toIsoDate, toIsoMonth } from '../../utils/dates';
import { GOAL_TYPES, type GoalTypeInfo } from '../../data/goalTypes';
import { deadlineIn } from '../../data/goalSummary';

export { brlInt, monthName };

/* =========================================================
   Regras do plano grátis
   ========================================================= */

import { FREE_CATEGORY_LIMITS, FREE_SUBSCRIPTIONS, PREMIUM_PRICE } from '../../data/plans';

export { FREE_CATEGORY_LIMITS, FREE_SUBSCRIPTIONS, PREMIUM_PRICE };

/* =========================================================
   Passos
   ========================================================= */

export const TOTAL_STEPS = 7;

export const STEPS = [
  { n: 1, name: 'Boas-vindas', optional: false },
  { n: 2, name: 'Acessibilidade', optional: true },
  { n: 3, name: 'Renda mensal', optional: false },
  { n: 4, name: 'Contas fixas', optional: true },
  { n: 5, name: 'Limites', optional: true },
  { n: 6, name: 'Primeira meta', optional: true },
  { n: 7, name: 'Seu plano', optional: false },
] as const;

/** Passo 3 é o único obrigatório. */
export const REQUIRED_STEP = 3;

/* =========================================================
   Cores de fundo dos ícones (emoji) — claro / escuro
   ========================================================= */

export type Tone = 'p' | 'g' | 'y' | 'b' | 'r' | 'o' | 't';

export const TONES: Record<Tone, { light: string; dark: string }> = {
  p: { light: '#ede9fe', dark: 'rgba(139,92,246,.2)' },
  g: { light: '#dcfce7', dark: 'rgba(34,197,94,.16)' },
  y: { light: '#fef3c7', dark: 'rgba(251,191,36,.16)' },
  b: { light: '#dbeafe', dark: 'rgba(59,130,246,.18)' },
  r: { light: '#ffe4e6', dark: 'rgba(244,63,94,.16)' },
  o: { light: '#ffedd5', dark: 'rgba(249,115,22,.16)' },
  t: { light: '#ccfbf1', dark: 'rgba(20,184,166,.16)' },
};

/* =========================================================
   Catálogos
   ========================================================= */

export const INCOME_SOURCES = [
  { id: 'salario', label: 'Salário', emoji: '💼', tone: 'p' },
  { id: 'extras', label: 'Bicos / extras', emoji: '🛠️', tone: 'o' },
  { id: 'mei', label: 'MEI / negócio', emoji: '🏪', tone: 'b' },
  { id: 'aposentadoria', label: 'Aposentadoria', emoji: '👵', tone: 'g' },
  { id: 'pensao', label: 'Pensão / ajuda', emoji: '🤝', tone: 'y' },
  { id: 'outro', label: 'Outro', emoji: '➕', tone: 't' },
] as const satisfies ReadonlyArray<{ id: string; label: string; emoji: string; tone: Tone }>;

/** null = "Varia" */
export const PAYDAYS: Array<number | null> = [1, 5, 10, 15, 20, null];

export interface CatalogItem {
  id: string;
  label: string;
  emoji: string;
  tone: Tone;
  /** Valor sugerido quando a pessoa marca o item. */
  value: number;
  /** Categoria do painel (bills) ou serviço (assinaturas). */
  category?: string;
  service?: SubscriptionItem['service'];
  color?: string;
}

export const HOUSE_BILLS: CatalogItem[] = [
  { id: 'aluguel', label: 'Aluguel', emoji: '🏠', tone: 'p', value: 900, category: 'casa' },
  { id: 'luz', label: 'Luz', emoji: '💡', tone: 'y', value: 120, category: 'casa' },
  { id: 'agua', label: 'Água', emoji: '🚿', tone: 'b', value: 60, category: 'casa' },
  { id: 'internet', label: 'Internet', emoji: '📶', tone: 't', value: 100, category: 'casa' },
  { id: 'celular', label: 'Celular', emoji: '📱', tone: 'g', value: 50, category: 'outros' },
  { id: 'gas', label: 'Gás', emoji: '🔥', tone: 'o', value: 110, category: 'casa' },
  { id: 'escola', label: 'Escola', emoji: '🏫', tone: 'r', value: 400, category: 'educacao' },
];

export const SUBSCRIPTIONS: CatalogItem[] = [
  { id: 'netflix', label: 'Netflix', emoji: '🎬', tone: 'r', value: 39.9, service: 'netflix', color: '#E50914' },
  { id: 'spotify', label: 'Spotify', emoji: '🎵', tone: 'g', value: 21.9, service: 'spotify', color: '#1DB954' },
  { id: 'academia', label: 'Academia', emoji: '🏋️', tone: 'o', value: 99, service: 'other', color: '#f97316' },
  { id: 'prime', label: 'Prime', emoji: '📦', tone: 'b', value: 19.9, service: 'amazon', color: '#FF9900' },
];

export interface LimitCategory {
  id: string;
  label: string;
  emoji: string;
  tone: Tone;
  /** Parte da renda sugerida para essa categoria. */
  share: number;
  /** Categoria correspondente no painel (dados de defaultFinancialProfile). */
  dashboardId: string;
  color: string;
  background: string;
}

export const LIMIT_CATEGORIES: LimitCategory[] = [
  { id: 'mercado', label: 'Mercado', emoji: '🛒', tone: 'g', share: 0.22, dashboardId: 'alimentacao', color: '#22c55e', background: '#DCFCE7' },
  { id: 'transporte', label: 'Transporte', emoji: '🚌', tone: 'b', share: 0.08, dashboardId: 'transporte', color: '#eab308', background: '#FEF9C3' },
  { id: 'lazer', label: 'Lazer e restaurantes', emoji: '🍔', tone: 'o', share: 0.09, dashboardId: 'lazer', color: '#a855f7', background: '#F3E8FF' },
  { id: 'saude', label: 'Saúde', emoji: '💊', tone: 'r', share: 0.06, dashboardId: 'saude', color: '#ef4444', background: '#FEE2E2' },
];

/** Tipo de meta do passo 6: o de data/goalTypes.ts com a cor do emoji usada no onboarding. */
export interface GoalType extends GoalTypeInfo {
  tone: Tone;
}

const GOAL_TONES: Record<string, Tone> = {
  viagem: 'b',
  reserva: 'g',
  casa: 'p',
  carro: 'o',
  estudos: 'y',
  casamento: 'r',
  guardar: 't',
  outra: 'p',
};

export const GOALS: GoalType[] = GOAL_TYPES.map((g) => ({ ...g, tone: GOAL_TONES[g.id] ?? 'p' }));

/** Prazos rápidos; "Escolher data" calcula os meses a partir do mês escolhido. */
export const GOAL_MONTHS = [
  { months: 6, label: '6 meses' },
  { months: 12, label: '12 meses' },
  { months: 18, label: '18 meses' },
  { months: 24, label: '2 anos' },
];

/* =========================================================
   Estado do onboarding (guardado como rascunho no navegador)
   ========================================================= */

export interface PickedItem {
  id: string;
  label: string;
  emoji: string;
  tone: Tone;
  value: number;
  custom?: boolean;
}

export interface OnboardingState {
  step: number;
  /* passo 3 */
  income: number;
  incomeSources: string[];
  payday: number | null | undefined;
  /* passo 4 */
  bills: PickedItem[];
  subscriptions: PickedItem[];
  /* passo 5 */
  limits: Array<{ id: string; value: number }>;
  limitsTouched: boolean;
  /* passo 6 */
  goalId: string | null;
  goalName: string;
  goalAmount: number;
  goalMonths: number;
  goalDate: string | null;
  skipped: number[];
}

export const initialState = (): OnboardingState => ({
  step: 1,
  income: 0,
  incomeSources: [],
  payday: undefined,
  bills: [],
  subscriptions: [],
  limits: [],
  limitsTouched: false,
  goalId: null,
  goalName: '',
  goalAmount: 0,
  goalMonths: 12,
  goalDate: null,
  skipped: [],
});

export const draftKey = (userId: string) => `paggo_onboarding_draft_${userId}`;

/* =========================================================
   Contas e formatação
   ========================================================= */

const roundTo = (v: number, step: number) => Math.max(0, Math.round(v / step) * step);

/** Valor sugerido para o limite de uma categoria, pela renda. */
export const suggestedLimit = (cat: LimitCategory, income: number) => roundTo(cat.share * income, 50);

/** Limites iniciais: as 3 primeiras categorias, com o valor sugerido. */
export const defaultLimits = (income: number) =>
  LIMIT_CATEGORIES.slice(0, FREE_CATEGORY_LIMITS).map((c) => ({ id: c.id, value: suggestedLimit(c, income) }));

export const sum = (items: Array<{ value: number }>) => items.reduce((acc, i) => acc + (i.value || 0), 0);

/** R$ 1.340,80 (sem centavos quando o valor é redondo, se compact = true). */
export function brl(value: number, compact = false) {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  const digits = compact && !hasCents ? 0 : 2;
  return brlDigits(value, digits);
}

/** "3.200" → 3200 ; "39,90" → 39.9 */
export function parseMoney(text: string): number {
  const clean = text.replace(/[^\d,]/g, '').replace(',', '.');
  const n = Number.parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

/** Mostra o valor no campo enquanto a pessoa digita: 3200 → "3.200" */
export function maskMoneyInt(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
  return digits ? Number(digits).toLocaleString('pt-BR') : '';
}

/** Mês atual por extenso, com inicial maiúscula ("Novembro"). */
export const currentMonthLabel = (d = new Date()) => MONTH_NAMES[d.getMonth()];

/**
 * A pessoa guarda uma parcela por mês a partir do mês que vem.
 * Com N parcelas, o dinheiro fica completo no fim do mês (hoje + N) e a meta
 * acontece no mês seguinte. Ex.: novembro/2026 + 12 parcelas → dezembro/2027.
 */
export function goalEndDate(months: number, today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth() + months + 1, 1);
}

/** Quantas parcelas cabem até um mês "aaaa-mm" escolhido (mínimo 1). */
export function monthsUntil(isoMonth: string, today = new Date()): number {
  const [y, m] = isoMonth.split('-').map(Number);
  if (!y || !m) return 0;
  return Math.max(1, (y - today.getFullYear()) * 12 + (m - 1 - today.getMonth()) - 1);
}

/** "aaaa-mm" de N meses à frente (valor mínimo do campo "Escolher data"). */
export function isoMonthAhead(n: number, today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() + n, 1);
  return toIsoMonth(d.getFullYear(), d.getMonth());
}

/** Resumo do mês (usado nos passos 5, 6 e 7). */
export function monthSummary(s: OnboardingState) {
  const fixed = sum(s.bills) + sum(s.subscriptions);
  const limits = sum(s.limits);
  const leftover = s.income - fixed - limits;
  const goalMonthly = s.goalId && s.goalAmount > 0 && s.goalMonths > 0 ? Math.ceil(s.goalAmount / s.goalMonths) : 0;
  return { fixed, limits, leftover, goalMonthly, committed: fixed + limits };
}

/* =========================================================
   Plano da IA (gerado no próprio navegador: o protótipo não tem back-end)
   Quando a API da IA existir, só esta função muda: ela passa a chamar o servidor.
   ========================================================= */

export function buildAiPlan(s: OnboardingState): AiPlanAction[] {
  const { leftover, goalMonthly } = monthSummary(s);
  const goal = GOALS.find((g) => g.id === s.goalId);
  const goalName = s.goalName.trim() || goal?.label || 'sua meta';
  const payday = s.payday ? `no dia ${s.payday}` : 'no dia em que o dinheiro cair';
  const actions: AiPlanAction[] = [];

  // 1. Meta (ou reserva, se não escolheu meta)
  if (goal && goalMonthly > 0) {
    actions.push({
      text: `Separe **${brlInt(goalMonthly)}** ${payday}, assim que o salário cair.`,
      detail: `Vai direto para o cofrinho "${goalName}".`,
      tag: 'Meta',
    });
  } else {
    const reserve = roundTo(Math.max(leftover, 0) * 0.3, 10) || roundTo(s.income * 0.05, 10);
    actions.push({
      text: `Comece uma reserva: guarde **${brlInt(reserve)}** ${payday}.`,
      detail: 'Uma reserva evita aperto quando aparece um gasto inesperado.',
      tag: 'Meta',
    });
  }

  // 2. Limite semanal da categoria com o maior limite
  const topLimit = [...s.limits].sort((a, b) => b.value - a.value)[0];
  const topCat = topLimit && LIMIT_CATEGORIES.find((c) => c.id === topLimit.id);
  if (topLimit && topCat && topLimit.value > 0) {
    const where = topCat.id === 'mercado' ? 'no mercado' : `em ${topCat.label.toLowerCase()}`;
    actions.push({
      text: `Tente gastar até **${brlInt(topLimit.value / 4)} por semana** ${where}.`,
      detail: `Assim você fica dentro do limite de ${brlInt(topLimit.value)}.`,
      tag: 'Economia',
    });
  } else {
    actions.push({
      text: `Defina um limite para o **mercado**: cerca de ${brlInt(suggestedLimit(LIMIT_CATEGORIES[0], s.income))} por mês.`,
      detail: 'Você pode criar limites a qualquer momento no painel.',
      tag: 'Economia',
    });
  }

  // 3. Alerta (gastando mais do que ganha) ou dica de assinaturas
  const subsTotal = sum(s.subscriptions);
  if (leftover - goalMonthly < 0) {
    actions.push({
      text: `Suas contas e limites passam da renda em **${brlInt(Math.abs(leftover - goalMonthly))}**.`,
      detail: 'Revise os limites ou aumente o prazo da meta para fechar o mês no azul.',
      tag: 'Atenção',
    });
  } else if (subsTotal > 0) {
    const priciest = [...s.subscriptions].sort((a, b) => b.value - a.value)[0];
    let detail = `Cancelar ${priciest.label} libera ${brl(priciest.value)} por mês.`;
    if (goal && goalMonthly > 0) {
      const faster = Math.ceil(s.goalAmount / (goalMonthly + priciest.value));
      const saved = s.goalMonths - faster;
      if (saved >= 1) detail = `Cancelar ${priciest.label} ajuda a chegar na meta ${saved} ${saved === 1 ? 'mês' : 'meses'} antes.`;
    }
    actions.push({ text: `Suas assinaturas somam **${brl(subsTotal)}**. Usa todas?`, detail, tag: 'Dica' });
  } else {
    const free = Math.max(leftover - goalMonthly, 0);
    actions.push({
      text: `Ainda sobram **${brlInt(free)}** por mês no seu plano.`,
      detail: 'Anote os gastos do dia a dia no Paggo para ver para onde esse valor vai.',
      tag: 'Dica',
    });
  }

  return actions;
}

/* =========================================================
   Conversão final para o perfil financeiro do painel
   ========================================================= */

export function toFinancialProfile(s: OnboardingState, plan: AiPlanAction[]): UserFinancialProfile {
  const dueDay = s.payday ?? 10;
  const allBills = [...HOUSE_BILLS];

  const fixedBills: FixedBillItem[] = s.bills.map((b, i) => ({
    id: `bill_${i + 1}`,
    title: b.label,
    value: b.value,
    dueDay,
    category: allBills.find((c) => c.id === b.id)?.category ?? 'outros',
    status: 'Pendente',
  }));

  const subscriptions: SubscriptionItem[] = s.subscriptions.map((sub, i) => {
    const cat = SUBSCRIPTIONS.find((c) => c.id === sub.id);
    return {
      id: `sub_${i + 1}`,
      name: sub.label,
      price: sub.value,
      dueDay,
      service: cat?.service ?? 'other',
      color: cat?.color ?? '#7c3aed',
    };
  });

  const categoryBudgets: CategoryBudgetItem[] = s.limits
    .map((l) => {
      const cat = LIMIT_CATEGORIES.find((c) => c.id === l.id);
      return cat
        ? { id: cat.dashboardId, name: cat.label, limit: l.value, spent: 0, color: cat.color, background: cat.background }
        : null;
    })
    .filter((c): c is CategoryBudgetItem => c !== null);

  const goal = GOALS.find((g) => g.id === s.goalId);
  const { goalMonthly } = monthSummary(s);
  const piggyBanks: PiggyBankItemModel[] =
    goal && s.goalAmount > 0
      ? [
          {
            id: 1,
            title: s.goalName.trim() || goal.label,
            description: `${brlInt(goalMonthly)} por mês até ${monthName(goalEndDate(s.goalMonths))} ${goal.emoji}`,
            savedAmount: 0,
            goalAmount: s.goalAmount,
            progress: 0,
            iconType: goal.id,
            progressColor: goal.color,
            deadline: deadlineIn(s.goalMonths),
            createdAt: toIsoDate(new Date()),
            moves: [],
          },
        ]
      : [];

  return {
    salary: s.income,
    extraIncome: 0,
    fixedBills,
    subscriptions,
    categoryBudgets,
    piggyBanks,
    onboarding: {
      incomeSources: s.incomeSources,
      payday: s.payday ?? null,
      goalMonths: goal ? s.goalMonths : null,
      skippedSteps: s.skipped,
      plan,
      completedAt: new Date().toISOString(),
    },
  };
}
