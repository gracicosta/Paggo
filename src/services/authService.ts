import { DEMO_PROFILE } from '../data/defaultFinancialProfile';
import { DEMO_EMAIL, DEMO_USER_ID } from '../constants/demo';
import type { AuthUser, SignupDetails, UserFinancialProfile } from '../types/auth';
import { STORAGE_KEYS, readJson, removeItem, writeJson } from './storage';

/**
 * Contas do protótipo. Hoje ficam no navegador; quando a API Node existir, estas funções viram
 * POST /auth/login, POST /auth/register, GET /auth/check-email, PUT /profile… e o AuthContext não muda.
 *
 * Protótipo sem back-end: a senha NÃO é guardada no navegador.
 * Com o Node.js, ela vai para o servidor e é salva com hash (bcrypt).
 */

const sameEmail = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// ---------- Sessão (quem está logado) ----------

export const readActiveUser = (): AuthUser | null => readJson<AuthUser | null>(STORAGE_KEYS.activeUser, null);

export function writeActiveUser(user: AuthUser | null) {
  if (user) writeJson(STORAGE_KEYS.activeUser, user);
  else removeItem(STORAGE_KEYS.activeUser);
}

// ---------- Contas cadastradas ----------

export const readAccounts = (): AuthUser[] => readJson<AuthUser[]>(STORAGE_KEYS.accounts, []);

function writeAccounts(accounts: AuthUser[]) {
  if (!writeJson(STORAGE_KEYS.accounts, accounts)) console.error('Erro ao salvar contas no navegador.');
}

/** Conta com esse e-mail (sem diferença de maiúsculas), ou undefined. */
export const findAccountByEmail = (email: string) => readAccounts().find((acc) => sameEmail(acc.email, email));

export const isDemoEmail = (email: string) => sameEmail(email, DEMO_EMAIL);

/** Usado no passo 1 do cadastro para avisar "já existe uma conta com esse e-mail". */
export const isEmailRegistered = (email: string) =>
  isDemoEmail(email) || readAccounts().some((acc) => sameEmail(acc.email, email.trim()));

/** Usado no passo 2 do cadastro: um CPF só pode ter uma conta. */
export const isCpfRegistered = (cpf: string) => readAccounts().some((acc) => acc.cpf === cpf);

/** Cria a conta (ainda sem onboarding) e guarda na lista. Um e-mail igual substitui o anterior. */
export function createAccount(name: string, email: string, details?: SignupDetails): AuthUser {
  const newUser: AuthUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    isConfigured: false,
    ...(details ?? {}),
    profile: {
      salary: 0,
      extraIncome: 0,
      fixedBills: [],
      subscriptions: [],
      categoryBudgets: [],
      piggyBanks: [],
    },
  };
  writeAccounts([...readAccounts().filter((a) => a.email !== email), newUser]);
  return newUser;
}

/** Salva o perfil financeiro do onboarding e marca a conta como configurada. */
export function saveProfile(user: AuthUser, profile: UserFinancialProfile): AuthUser {
  const updatedUser: AuthUser = { ...user, isConfigured: true, profile };
  writeAccounts(readAccounts().map((acc) => (acc.id === user.id ? updatedUser : acc)));
  return updatedUser;
}

/** Usuário da conta demonstrativa, já configurado com o perfil de exemplo. */
export const buildDemoUser = (): AuthUser => ({
  id: DEMO_USER_ID,
  name: 'Carlos Oliveira',
  email: DEMO_EMAIL,
  isConfigured: true,
  profile: DEMO_PROFILE,
});
