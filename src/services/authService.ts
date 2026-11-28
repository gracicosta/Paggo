import { DEMO_PROFILE } from '../data/defaultFinancialProfile';
import { DEMO_EMAIL, DEMO_USER_ID } from '../constants/demo';
import type { AuthUser, SignupDetails, UserFinancialProfile } from '../types/auth';
import {
  ApiError,
  ApiUnavailableError,
  apiRequest,
  readAuthToken,
  writeAuthToken,
} from './apiClient';
import { STORAGE_KEYS, readJson, removeItem, writeJson } from './storage';

/**
 * Camada de autenticação e perfil do Paggo.
 * Usa a API Node.js + PostgreSQL quando disponível e mantém fallback em localStorage
 * caso o protótipo seja aberto sem servidor rodando.
 */

const sameEmail = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

interface AuthApiResponse {
  token: string;
  user: AuthUser;
}

interface GoogleApiResponse {
  needsSignup?: boolean;
  profile?: { name: string; email: string; sub?: string };
  token?: string;
  user?: AuthUser;
}

// ---------- Sessão (quem está logado) ----------

export const readActiveUser = (): AuthUser | null => readJson<AuthUser | null>(STORAGE_KEYS.activeUser, null);

export function writeActiveUser(user: AuthUser | null) {
  if (user) {
    writeJson(STORAGE_KEYS.activeUser, user);
  } else {
    removeItem(STORAGE_KEYS.activeUser);
    writeAuthToken(null);
  }
}

export const hasBackendToken = (): boolean => Boolean(readAuthToken());

// ---------- Contas cadastradas (fallback local) ----------

export const readAccounts = (): AuthUser[] => readJson<AuthUser[]>(STORAGE_KEYS.accounts, []);

function writeAccounts(accounts: AuthUser[]) {
  if (!writeJson(STORAGE_KEYS.accounts, accounts)) console.error('Erro ao salvar contas no navegador.');
}

function cacheAccount(user: AuthUser) {
  writeAccounts([...readAccounts().filter((a) => a.id !== user.id && !sameEmail(a.email, user.email)), user]);
}

export const findAccountByEmail = (email: string) => readAccounts().find((acc) => sameEmail(acc.email, email));

export const isDemoEmail = (email: string) => sameEmail(email, DEMO_EMAIL);

export const isEmailRegistered = (email: string) =>
  isDemoEmail(email) || readAccounts().some((acc) => sameEmail(acc.email, email.trim()));

export const isCpfRegistered = (cpf: string) => readAccounts().some((acc) => acc.cpf === cpf);

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

export function saveProfile(user: AuthUser, profile: UserFinancialProfile): AuthUser {
  const updatedUser: AuthUser = { ...user, isConfigured: true, profile };
  writeAccounts(readAccounts().map((acc) => (acc.id === user.id ? updatedUser : acc)));
  return updatedUser;
}

export const buildDemoUser = (): AuthUser => ({
  id: DEMO_USER_ID,
  name: 'Carlos Oliveira',
  email: DEMO_EMAIL,
  isConfigured: true,
  profile: DEMO_PROFILE,
});

// ---------- Operações integradas à API Node.js + PostgreSQL ----------

export async function fetchCurrentSessionUser(): Promise<AuthUser | null> {
  if (!readAuthToken()) return null;
  try {
    const res = await apiRequest<{ user: AuthUser }>('/auth/me');
    cacheAccount(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      writeAuthToken(null);
      return null;
    }
    if (err instanceof ApiUnavailableError) {
      return readActiveUser();
    }
    return readActiveUser();
  }
}

export async function checkEmailRegisteredRemote(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  try {
    const res = await apiRequest<{ registered: boolean }>(`/auth/check-email?email=${encodeURIComponent(clean)}`, {
      skipAuth: true,
    });
    return res.registered;
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return isEmailRegistered(clean);
    }
    return isEmailRegistered(clean);
  }
}

export async function checkCpfRegisteredRemote(cpf: string): Promise<boolean> {
  const digits = cpf.replace(/\D/g, '');
  try {
    const res = await apiRequest<{ registered: boolean }>(`/auth/check-cpf?cpf=${encodeURIComponent(digits)}`, {
      skipAuth: true,
    });
    return res.registered;
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return isCpfRegistered(digits);
    }
    return isCpfRegistered(digits);
  }
}

export async function loginRemote(email: string, password: string): Promise<AuthUser | null> {
  try {
    const res = await apiRequest<AuthApiResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
    writeAuthToken(res.token);
    cacheAccount(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
      return null;
    }
    if (err instanceof ApiUnavailableError) {
      const found = findAccountByEmail(email);
      if (found) return found;
      if (isDemoEmail(email)) return buildDemoUser();
      return null;
    }
    throw err;
  }
}

export async function loginAsDemoRemote(): Promise<AuthUser> {
  try {
    const res = await apiRequest<AuthApiResponse>('/auth/demo', {
      method: 'POST',
      skipAuth: true,
    });
    writeAuthToken(res.token);
    cacheAccount(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      writeAuthToken(null);
      return buildDemoUser();
    }
    throw err;
  }
}

export async function registerRemote(
  name: string,
  email: string,
  password: string,
  details?: SignupDetails,
): Promise<AuthUser> {
  try {
    const res = await apiRequest<AuthApiResponse>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        name,
        email,
        password,
        cpf: details?.cpf ?? '',
        birthDate: details?.birthDate ?? '',
        termsAcceptedAt: details?.termsAcceptedAt,
        provider: details?.provider ?? 'email',
      }),
    });
    writeAuthToken(res.token);
    cacheAccount(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return createAccount(name, email, details);
    }
    throw err;
  }
}

export async function loginWithGoogleRemote(payload: {
  accessToken?: string;
  mockProfile?: { name: string; email: string };
}): Promise<
  | { status: 'logged_in'; user: AuthUser }
  | { status: 'needs_signup'; profile: { name: string; email: string } }
> {
  try {
    const res = await apiRequest<GoogleApiResponse>('/auth/google', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    });
    if (res.token && res.user) {
      writeAuthToken(res.token);
      cacheAccount(res.user);
      return { status: 'logged_in', user: res.user };
    }
    if (res.needsSignup && res.profile) {
      return { status: 'needs_signup', profile: res.profile };
    }
    throw new Error('Resposta inesperada do login com Google.');
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      const email = payload.mockProfile?.email;
      if (email) {
        const existing = findAccountByEmail(email);
        if (existing) return { status: 'logged_in', user: existing };
        return {
          status: 'needs_signup',
          profile: { name: payload.mockProfile!.name, email },
        };
      }
    }
    throw err;
  }
}

export async function saveProfileRemote(user: AuthUser, profile: UserFinancialProfile): Promise<AuthUser> {
  const localUpdated = saveProfile(user, profile);
  if (!readAuthToken()) return localUpdated;

  try {
    const res = await apiRequest<{ user: AuthUser }>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    cacheAccount(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return localUpdated;
    }
    return localUpdated;
  }
}
