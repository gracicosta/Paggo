/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { AuthUser, SignupDetails, UserFinancialProfile } from '../types/auth';
import * as authService from '../services/authService';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Estado de quem está logado. Ler e gravar contas fica em services/authService.ts
 * (hoje no navegador, amanhã na API Node).
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.readActiveUser);
  const [isLoading] = useState(false);

  const persistUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    authService.writeActiveUser(newUser);
  };

  const loginAsDemo = () => persistUser(authService.buildDemoUser());

  const login = (email: string, _pass: string): boolean => {
    void _pass;
    const found = authService.findAccountByEmail(email);
    if (found) {
      persistUser(found);
      return true;
    }
    if (authService.isDemoEmail(email)) {
      loginAsDemo();
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, _pass: string, details?: SignupDetails): AuthUser => {
    void _pass; // a senha não é guardada no navegador (veja authService)
    const newUser = authService.createAccount(name, email, details);
    persistUser(newUser);
    return newUser;
  };

  const saveFinancialProfile = (profile: UserFinancialProfile) => {
    if (!user) return;
    persistUser(authService.saveProfile(user, profile));
  };

  const logout = () => persistUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        isEmailRegistered: authService.isEmailRegistered,
        isCpfRegistered: authService.isCpfRegistered,
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
