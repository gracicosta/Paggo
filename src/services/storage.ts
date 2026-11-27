/**
 * Único ponto do app que fala com o armazenamento do navegador (localStorage).
 * Quando o back-end Node.js existir, os services que usam este arquivo passam a chamar a API,
 * e as telas não precisam mudar.
 *
 * Todas as funções engolem erros (modo anônimo, cota cheia, JSON quebrado):
 * guardar dados no navegador é sempre opcional no protótipo.
 */

/**
 * Chaves usadas hoje. NÃO renomear (ex.: tirar o "consumiq"): quem já testou o app
 * perderia contas e transações salvas.
 */
export const STORAGE_KEYS = {
  activeUser: 'consumiq_active_user',
  accounts: 'consumiq_registered_accounts',
  prefs: 'paggo_login_prefs',
  rememberEmail: 'paggo_remember_email',
  dashboardTheme: 'paggo_theme',
  activePage: 'paggo_page',
  /** Dentro de Transações: "lancamentos" ou "limites". */
  transactionsView: 'paggo_transactions_view',
  onboardingDraft: (userId: string) => `paggo_onboarding_draft_${userId}`,
  transactions: (userId: string) => `paggo_transactions_${userId}`,
} as const;

/** Texto salvo na chave, ou null se não existir / não der para ler. */
export function readText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Salva um texto. Devolve false se o navegador recusar. */
export function writeText(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Lê e converte JSON. Devolve `fallback` se não existir ou estiver quebrado. */
export function readJson<T>(key: string, fallback: T): T {
  const raw = readText(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Salva um valor como JSON. Devolve false se o navegador recusar. */
export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Apaga a chave (sem erro se ela não existir). */
export function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* opcional */
  }
}
