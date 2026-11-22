/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DEMO_PROFILE } from '../data/defaultFinancialProfile';
import type { FixedBillItem, SubscriptionItem, CategoryBudgetItem, PiggyBankItemModel } from '../types/auth';

interface FinanceContextType {
  salary: number;
  extraIncome: number;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  categoryBudgets: CategoryBudgetItem[];
  piggyBanks: PiggyBankItemModel[];
  monthlyChartData: Array<{ month: string; receitas: number; despesas: number }>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const profile = useMemo(() => {
    if (user?.profile && user.isConfigured) {
      return user.profile;
    }
    return DEMO_PROFILE;
  }, [user]);

  const value = useMemo(() => {
    const salary = profile.salary || 0;
    const extraIncome = profile.extraIncome || 0;
    const totalIncome = salary + extraIncome;

    // Calcular despesas totais do período
    const billsTotal = (profile.fixedBills || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
    const subsTotal = (profile.subscriptions || []).reduce((acc, curr) => acc + (curr.price || 0), 0);
    const categorySpentTotal = (profile.categoryBudgets || []).reduce((acc, curr) => acc + (curr.spent || 0), 0);
    
    // Total de despesas consolidado
    const totalExpenses = billsTotal + subsTotal + categorySpentTotal;
    const currentBalance = totalIncome - totalExpenses;

    // Projeção dos últimos meses baseada na realidade atual
    const monthlyChartData = [
      {
        month: 'Janeiro',
        receitas: Math.round(totalIncome * 0.92),
        despesas: Math.round(totalExpenses * 0.88),
      },
      {
        month: 'Fevereiro',
        receitas: Math.round(totalIncome * 0.95),
        despesas: Math.round(totalExpenses * 0.93),
      },
      {
        month: 'Março',
        receitas: Math.round(totalIncome * 0.98),
        despesas: Math.round(totalExpenses * 0.96),
      },
      {
        month: 'Abril',
        receitas: Math.round(totalIncome * 0.94),
        despesas: Math.round(totalExpenses * 1.02),
      },
      {
        month: 'Maio',
        receitas: totalIncome,
        despesas: totalExpenses,
      },
    ];

    return {
      salary,
      extraIncome,
      totalIncome,
      totalExpenses,
      currentBalance,
      fixedBills: profile.fixedBills || [],
      subscriptions: profile.subscriptions || [],
      categoryBudgets: profile.categoryBudgets || [],
      piggyBanks: profile.piggyBanks || [],
      monthlyChartData,
    };
  }, [profile]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}
