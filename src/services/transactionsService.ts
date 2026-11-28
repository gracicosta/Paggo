import { buildSeed, withDemoHistory } from '../data/transactionSeed';
import type { Transaction } from '../types/transactions';
import type { AuthUser, UserFinancialProfile } from '../types/auth';
import { ApiUnavailableError, apiRequest, readAuthToken } from './apiClient';
import { STORAGE_KEYS, readText, writeJson } from './storage';

/**
 * Transações da pessoa logada. O localStorage é o cache imediato (a tela abre sem esperar);
 * com sessão da API ativa, a lista é lida de GET /transactions e cada mudança é
 * espelhada com PUT /transactions — assim as somas do banco batem com a tela.
 */

function readLocal(user: AuthUser, profile: UserFinancialProfile): Transaction[] {
  try {
    const raw = readText(STORAGE_KEYS.transactions(user.id));
    if (raw) return withDemoHistory(user, profile, JSON.parse(raw));
  } catch {
    /* cai para as transações iniciais */
  }
  return buildSeed(user, profile);
}

export function loadTransactions(user: AuthUser, profile: UserFinancialProfile): Transaction[] {
  return readLocal(user, profile);
}

/**
 * Versão remota: sem token (ou API fora), devolve o cache local.
 * Servidor vazio = primeira sincronização da conta: sobe a lista local (ou o seed) para o banco.
 */
export async function loadTransactionsRemote(user: AuthUser, profile: UserFinancialProfile): Promise<Transaction[]> {
  if (!readAuthToken()) return readLocal(user, profile);
  try {
    const res = await apiRequest<{ items: Transaction[] }>('/transactions');
    if (res.items.length) {
      writeJson(STORAGE_KEYS.transactions(user.id), res.items);
      return res.items;
    }
    const local = readLocal(user, profile);
    await apiRequest('/transactions', { method: 'PUT', body: JSON.stringify({ items: local }) });
    return local;
  } catch (err) {
    if (err instanceof ApiUnavailableError) return readLocal(user, profile);
    return readLocal(user, profile);
  }
}

/** Salva a lista inteira: cache local sempre; espelho na API quando houver token. */
export function saveTransactions(userId: string, items: Transaction[]) {
  writeJson(STORAGE_KEYS.transactions(userId), items);
  if (!readAuthToken()) return;
  apiRequest('/transactions', { method: 'PUT', body: JSON.stringify({ items }) }).catch(() => {
    /* API fora do ar: o cache local segue como fonte até a próxima gravação */
  });
}
