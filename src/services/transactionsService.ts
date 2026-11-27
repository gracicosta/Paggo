import { buildSeed, withDemoHistory } from '../data/transactionSeed';
import type { Transaction } from '../types/transactions';
import type { AuthUser, UserFinancialProfile } from '../types/auth';
import { STORAGE_KEYS, readText, writeJson } from './storage';

/**
 * Transações da pessoa logada. Por enquanto ficam no navegador (localStorage);
 * quando a API Node existir, estas funções viram GET /transactions e PUT /transactions,
 * e o TransactionsContext não precisa mudar.
 */
export function loadTransactions(user: AuthUser, profile: UserFinancialProfile): Transaction[] {
  try {
    const raw = readText(STORAGE_KEYS.transactions(user.id));
    if (raw) return withDemoHistory(user, profile, JSON.parse(raw));
  } catch {
    /* cai para as transações iniciais */
  }
  return buildSeed(user, profile);
}

/** Salva a lista inteira. Sem espaço no navegador, a tela continua funcionando nesta sessão. */
export function saveTransactions(userId: string, items: Transaction[]) {
  writeJson(STORAGE_KEYS.transactions(userId), items);
}
