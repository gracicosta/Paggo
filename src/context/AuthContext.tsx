/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { AuthUser, SignupDetails, UserFinancialProfile } from '../types/auth';
import { DEMO_PROFILE } from '../data/defaultFinancialProfile';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, pass: string) => boolean;
  register: (name: string, email: string, pass: string, details?: SignupDetails) => AuthUser;
  isEmailRegistered: (email: string) => boolean;
  isCpfRegistered: (cpf: string) => boolean;
  saveFinancialProfile: (profile: UserFinancialProfile) => void;
  logout: () => void;
  loginAsDemo: () => void;
}

const STORAGE_KEY_USER = 'consumiq_active_user';
const STORAGE_KEY_ACCOUNTS = 'consumiq_registered_accounts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);

  const persistUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  };

  const login = (email: string, _pass: string): boolean => {
    void _pass;
    try {
      const accountsRaw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      const accounts: AuthUser[] = accountsRaw ? JSON.parse(accountsRaw) : [];
      const found = accounts.find((acc) => acc.email.toLowerCase() === email.toLowerCase());

      if (found) {
        persistUser(found);
        return true;
      }

      // Se for a conta demo
      if (email.toLowerCase() === 'demo@consumiq.com') {
        loginAsDemo();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const readAccounts = (): AuthUser[] => {
    try {
      const accountsRaw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return accountsRaw ? JSON.parse(accountsRaw) : [];
    } catch {
      return [];
    }
  };

  /** Usado no passo 1 do cadastro para avisar "já existe uma conta com esse e-mail". */
  const isEmailRegistered = (email: string) =>
    email.toLowerCase() === 'demo@consumiq.com' ||
    readAccounts().some((acc) => acc.email.toLowerCase() === email.trim().toLowerCase());

  /** Usado no passo 2 do cadastro: um CPF só pode ter uma conta. */
  const isCpfRegistered = (cpf: string) => readAccounts().some((acc) => acc.cpf === cpf);

  const register = (name: string, email: string, _pass: string, details?: SignupDetails): AuthUser => {
    // Protótipo sem back-end: a senha NÃO é guardada no navegador.
    // Com o Node.js, ela vai para o servidor e é salva com hash (bcrypt).
    void _pass;
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

    try {
      const accountsRaw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      const accounts: AuthUser[] = accountsRaw ? JSON.parse(accountsRaw) : [];
      const updatedAccounts = [...accounts.filter((a) => a.email !== email), newUser];
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error('Erro ao salvar conta:', e);
    }

    persistUser(newUser);
    return newUser;
  };

  const saveFinancialProfile = (profile: UserFinancialProfile) => {
    if (!user) return;
    const updatedUser: AuthUser = {
      ...user,
      isConfigured: true,
      profile,
    };

    try {
      const accountsRaw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      const accounts: AuthUser[] = accountsRaw ? JSON.parse(accountsRaw) : [];
      const updatedAccounts = accounts.map((acc) => (acc.id === user.id ? updatedUser : acc));
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error('Erro ao atualizar dados do perfil:', e);
    }

    persistUser(updatedUser);
  };

  const logout = () => {
    persistUser(null);
  };

  const loginAsDemo = () => {
    const demoUser: AuthUser = {
      id: 'demo_user_01',
      name: 'Carlos Oliveira',
      email: 'demo@consumiq.com',
      isConfigured: true,
      profile: DEMO_PROFILE,
    };
    persistUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        isEmailRegistered,
        isCpfRegistered,
        saveFinancialProfile,
        logout,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
