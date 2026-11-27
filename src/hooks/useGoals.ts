import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { FREE_GOALS, userPlan } from '../data/plans';
import { buildGoalView, createGoal, goalTotals, withMove, type NewGoalInput } from '../data/goalSummary';
import { monthKeys, monthLabel } from '../utils/dates';

/**
 * Metas (cofrinhos) da pessoa logada, já com as contas feitas, e as ações de mexer nelas.
 * Fonte única para a aba Metas e o cartão "Cofrinhos" do Dashboard: um depósito aparece nas duas na hora.
 *
 * @param month mês escolhido no topo ("Novembro 2026"): histórico e "guardado no mês" seguem ele.
 */
export function useGoals(month = monthLabel()) {
  const { user } = useAuth();
  const { piggyBanks, savePiggyBanks } = useFinance();
  const plan = userPlan(user);
  const keys = monthKeys(month);
  const monthKey = keys.current;

  const views = useMemo(() => piggyBanks.map((g) => buildGoalView(g, monthKey)), [piggyBanks, monthKey]);
  const totals = useMemo(() => goalTotals(views), [views]);

  /** No grátis cabem FREE_GOALS metas em andamento; as concluídas não contam. */
  const canCreate = plan === 'premium' || totals.active.length < FREE_GOALS;

  const move = (id: number, amount: number) => savePiggyBanks(withMove(piggyBanks, id, amount));

  return {
    plan,
    keys,
    views,
    totals,
    canCreate,
    freeLimit: FREE_GOALS,
    /** Guarda `amount` reais no cofrinho. */
    deposit: (id: number, amount: number) => move(id, Math.abs(amount)),
    /** Tira `amount` reais do cofrinho (nunca fica negativo). */
    withdraw: (id: number, amount: number) => move(id, -Math.abs(amount)),
    /** Cria a meta e devolve o id dela, ou null se o plano grátis já está cheio. */
    create: (input: NewGoalInput): number | null => {
      if (!canCreate) return null;
      const goal = createGoal(piggyBanks, input);
      savePiggyBanks([...piggyBanks, goal]);
      return goal.id;
    },
    remove: (id: number) => savePiggyBanks(piggyBanks.filter((g) => g.id !== id)),
  };
}
