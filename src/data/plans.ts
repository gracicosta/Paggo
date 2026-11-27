import type { AuthUser } from '../types/auth';
import { DEMO_USER_ID } from '../constants/demo';

/** Plano da conta. Toda conta nova começa no grátis; o pagamento do Premium ainda não existe no protótipo. */
export type PlanId = 'free' | 'premium';

export const PREMIUM_PRICE = 'R$ 23,90';

/* Regras do plano grátis */
export const FREE_SUBSCRIPTIONS = 3;
export const FREE_CATEGORY_LIMITS = 3;

/** Meses no gráfico de evolução do saldo do Dashboard: 3 no grátis, o ano todo (12) no Premium. */
export const CHART_MONTHS: Record<PlanId, number> = { free: 3, premium: 12 };

/**
 * Plano da pessoa logada. A conta de teste (demo) é Premium para a apresentação mostrar o gráfico do ano;
 * as outras são grátis até o pagamento existir.
 */
export const userPlan = (user: AuthUser | null | undefined): PlanId =>
  user?.plan ?? (user?.id === DEMO_USER_ID ? 'premium' : 'free');
