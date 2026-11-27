/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { activeProfile } from '../data/defaultFinancialProfile';
import type { Transaction, TransactionInput } from '../types/transactions';
import { newId } from '../data/transactionSeed';
import { loadTransactions, saveTransactions } from '../services/transactionsService';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, input: TransactionInput) => void;
  removeTransaction: (id: string) => void;
  /** Coloca de volta uma transação excluída (botão "Desfazer"). */
  restoreTransaction: (t: Transaction) => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

/**
 * Estado das transações da pessoa logada (adicionar, editar, excluir, desfazer).
 * Ler e gravar fica em services/transactionsService.ts; os dados de exemplo, em data/transactionSeed.ts.
 */
export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? 'visitante';
  const profile = activeProfile(user);

  const [state, setState] = useState(() => ({ userId, items: user ? loadTransactions(user, profile) : [] }));

  // Trocou de conta sem desmontar a tela: carrega as transações da conta nova
  let items = state.items;
  if (state.userId !== userId) {
    items = user ? loadTransactions(user, profile) : [];
    setState({ userId, items });
  }

  useEffect(() => {
    if (!user) return;
    saveTransactions(state.userId, state.items);
  }, [state, user]);

  const setItems = useCallback(
    (fn: (prev: Transaction[]) => Transaction[]) => setState((s) => ({ ...s, items: fn(s.items) })),
    [],
  );

  const addTransaction = useCallback(
    (input: TransactionInput) => {
      const t = { ...input, id: newId() };
      setItems((prev) => [t, ...prev]);
      return t;
    },
    [setItems],
  );

  const updateTransaction = useCallback(
    (id: string, input: TransactionInput) => setItems((prev) => prev.map((t) => (t.id === id ? { ...input, id } : t))),
    [setItems],
  );

  const removeTransaction = useCallback((id: string) => setItems((prev) => prev.filter((t) => t.id !== id)), [setItems]);

  const restoreTransaction = useCallback(
    (t: Transaction) => setItems((prev) => (prev.some((p) => p.id === t.id) ? prev : [t, ...prev])),
    [setItems],
  );

  const value = useMemo(
    () => ({ transactions: items, addTransaction, updateTransaction, removeTransaction, restoreTransaction }),
    [items, addTransaction, updateTransaction, removeTransaction, restoreTransaction],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
};

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions deve ser usado dentro de um TransactionsProvider');
  }
  return context;
}
