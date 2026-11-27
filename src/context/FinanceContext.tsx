/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionsContext';
import { activeProfile } from '../data/defaultFinancialProfile';
import { summarizeMonth } from '../data/financeSummary';
import type { FixedBillItem, SubscriptionItem, CategoryBudgetItem, PiggyBankItemModel } from '../types/auth';

/**
 * Compromissos e metas do perfil (onboarding): boletos, assinaturas, limites e cofrinhos.
 * Os valores de entrada, saída e saldo NÃO ficam aqui: eles vêm das transações (veja useMonthFinance).
 */
interface FinanceContextType {
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  categoryBudgets: CategoryBudgetItem[];
  piggyBanks: PiggyBankItemModel[];
  /** Troca a lista de limites por categoria (criar, editar ou remover) e salva no perfil. */
  saveCategoryBudgets: (budgets: CategoryBudgetItem[]) => void;
  /** Troca a lista de cofrinhos (depositar, retirar, criar ou excluir meta) e salva no perfil. Use pelo hook useGoals. */
  savePiggyBanks: (piggyBanks: PiggyBankItemModel[]) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, saveFinancialProfile } = useAuth();
  const profile = activeProfile(user);

  const saveCategoryBudgets = useCallback(
    (categoryBudgets: CategoryBudgetItem[]) => saveFinancialProfile({ ...profile, categoryBudgets }),
    [profile, saveFinancialProfile],
  );

  const savePiggyBanks = useCallback(
    (piggyBanks: PiggyBankItemModel[]) => saveFinancialProfile({ ...profile, piggyBanks }),
    [profile, saveFinancialProfile],
  );

  const value = useMemo(
    () => ({
      fixedBills: profile.fixedBills || [],
      subscriptions: profile.subscriptions || [],
      categoryBudgets: profile.categoryBudgets || [],
      piggyBanks: profile.piggyBanks || [],
      saveCategoryBudgets,
      savePiggyBanks,
    }),
    [profile, saveCategoryBudgets, savePiggyBanks],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}

/**
 * Números do mês escolhido no topo ("Novembro 2026"), sempre calculados das transações salvas.
 * Dashboard e Transações leem daqui: uma transação nova, editada ou excluída atualiza as duas telas na hora.
 */
export function useMonthFinance(month: string, chartMonths = 3) {
  const { transactions } = useTransactions();
  const { categoryBudgets } = useFinance();
  return useMemo(
    () => summarizeMonth(transactions, categoryBudgets, month, chartMonths),
    [transactions, categoryBudgets, month, chartMonths],
  );
}
