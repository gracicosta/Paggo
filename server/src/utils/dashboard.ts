/**
 * Contas do painel compartilhadas pelas rotas: limites (alerta 80%),
 * séries mensais e datas de vencimento de boletos/assinaturas.
 */

export const WARN_AT = 0.8;
export type LimitStatus = 'ok' | 'warn' | 'bad';
export const limitStatus = (used: number): LimitStatus => (used > 1 ? 'bad' : used >= WARN_AT ? 'warn' : 'ok');

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

/** R$ 420,00 — formato amigável das mensagens de alerta. */
export const brl = (v: number) =>
  `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export interface LimitAlert {
  categoryId: string;
  name: string;
  limit: number;
  spent: number;
  used: number;
  left: number;
  status: LimitStatus;
  /** "Alimentação passou de 80% do limite (Sobrou R$ 420)" / "estourou o limite (Passou R$ 50)". */
  message: string;
}

/** Monta o alerta quando a categoria chega a 80% do teto; null quando ainda está tranquila. */
export function buildLimitAlert(budget: { id: string; name: string; limit: number }, spent: number): LimitAlert | null {
  if (budget.limit <= 0) return null;
  const used = spent / budget.limit;
  const status = limitStatus(used);
  if (status === 'ok') return null;
  const left = budget.limit - spent;
  const message =
    status === 'bad'
      ? `${budget.name} estourou o limite do mês (Passou ${brl(-left)})`
      : `${budget.name} passou de 80% do limite (Sobrou ${brl(left)})`;
  return { categoryId: budget.id, name: budget.name, limit: budget.limit, spent, used, left, status, message };
}

/** Status do boleto a partir do dia de vencimento (contas mensais, mês corrente). */
export function billStatus(dueDay: number, today = new Date()) {
  const daysUntilDue = dueDay - today.getDate();
  if (daysUntilDue < 0) {
    const days = -daysUntilDue;
    return { daysUntilDue, code: 'overdue' as const, label: `Vencido há ${days} ${days === 1 ? 'dia' : 'dias'}` };
  }
  if (daysUntilDue === 0) return { daysUntilDue, code: 'today' as const, label: 'Vence hoje' };
  return { daysUntilDue, code: 'pending' as const, label: `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}` };
}
