/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser, SignupDetails, UserFinancialProfile } from '../types/auth';
import * as authService from '../services/authService';

export type GoogleLoginOutcome =
  | { status: 'logged_in'; user: AuthUser }
  | { status: 'needs_signup'; profile: { name: string; email: string } };

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: (payload: {
    accessToken?: string;
    mockProfile?: { name: string; email: string };
  }) => Promise<GoogleLoginOutcome>;
  register: (name: string, email: string, pass: string, details?: SignupDetails) => Promise<AuthUser>;
  isEmailRegistered: (email: string) => Promise<boolean>;
  isCpfRegistered: (cpf: string) => Promise<boolean>;
  saveFinancialProfile: (profile: UserFinancialProfile) => Promise<void>;
  logout: () => void;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Estado de quem está logado. Ler e gravar contas fica em services/authService.ts
 * (integrado à API Node.js + PostgreSQL, com fallback em localStorage).
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.readActiveUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => authService.hasBackendToken());

  const persistUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    authService.writeActiveUser(newUser);
  };

  useEffect(() => {
    if (!authService.hasBackendToken()) return;
    let active = true;
    authService
      .fetchCurrentSessionUser()
      .then((sessionUser) => {
        if (!active) return;
        persistUser(sessionUser);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loginAsDemo = async () => {
    const demoUser = await authService.loginAsDemoRemote();
    persistUser(demoUser);
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    const loggedUser = await authService.loginRemote(email, pass);
    if (loggedUser) {
      persistUser(loggedUser);
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (payload: {
    accessToken?: string;
    mockProfile?: { name: string; email: string };
  }): Promise<GoogleLoginOutcome> => {
    const outcome = await authService.loginWithGoogleRemote(payload);
    if (outcome.status === 'logged_in') {
      persistUser(outcome.user);
    }
    return outcome;
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    details?: SignupDetails,
  ): Promise<AuthUser> => {
    const newUser = await authService.registerRemote(name, email, pass, details);
    persistUser(newUser);
    return newUser;
  };

  const saveFinancialProfile = async (profile: UserFinancialProfile) => {
    if (!user) return;
    const optimistic = authService.saveProfile(user, profile);
    persistUser(optimistic);
    const synced = await authService.saveProfileRemote(user, profile);
    persistUser(synced);
  };

  const logout = () => persistUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        isEmailRegistered: authService.checkEmailRegisteredRemote,
        isCpfRegistered: authService.checkCpfRegisteredRemote,
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
