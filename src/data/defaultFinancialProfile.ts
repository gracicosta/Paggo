import { demoPiggyBanks } from './goalSeed';
import type { AuthUser, UserFinancialProfile } from '../types/auth';

export const DEFAULT_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', limit: 1400, spent: 850, color: '#22c55e', background: '#DCFCE7' },
  { id: 'lazer', name: 'Lazer', limit: 600, spent: 420, color: '#a855f7', background: '#F3E8FF' },
  { id: 'transporte', name: 'Transporte', limit: 800, spent: 540, color: '#eab308', background: '#FEF9C3' },
  { id: 'saude', name: 'Saúde', limit: 500, spent: 230, color: '#ef4444', background: '#FEE2E2' },
  { id: 'educacao', name: 'Educação', limit: 850, spent: 700, color: '#3b82f6', background: '#DBEAFE' },
  { id: 'casa', name: 'Casa & Moradia', limit: 1200, spent: 780, color: '#f97316', background: '#FFEDD5' },
  { id: 'despesasPessoais', name: 'Despesas Pessoais', limit: 400, spent: 260, color: '#ec4899', background: '#FCE7F3' },
  { id: 'outros', name: 'Outros', limit: 300, spent: 80, color: '#0f766e', background: '#CCFBF1' },
];

export const DEMO_PROFILE: UserFinancialProfile = {
  salary: 7500,
  extraIncome: 950,
  fixedBills: [
    { id: '1', title: 'Faculdade / Especialização', value: 850, dueDay: 7, category: 'educacao', status: 'Vence hoje' },
    { id: '2', title: 'Plano de Internet Fibra', value: 119.90, dueDay: 20, category: 'casa', status: 'Pendente' },
    { id: '3', title: 'Conta de Energia (Enel)', value: 238.45, dueDay: 5, category: 'casa', status: 'Vencido' },
    { id: '4', title: 'Conta de Água e Saneamento', value: 67.20, dueDay: 10, category: 'casa', status: 'Pendente' },
  ],
  subscriptions: [
    { id: '1', name: 'Netflix Premium', price: 55.90, dueDay: 15, service: 'netflix', color: '#E50914' },
    { id: '2', name: 'Amazon Prime', price: 19.90, dueDay: 20, service: 'amazon', color: '#FF9900' },
    { id: '3', name: 'Spotify Duo', price: 27.90, dueDay: 5, service: 'spotify', color: '#1DB954' },
  ],
  categoryBudgets: DEFAULT_CATEGORIES,
  piggyBanks: demoPiggyBanks(),
};

/** Perfil usado nas telas: o que a pessoa preencheu no onboarding ou, sem ele, o da conta demo. */
export const activeProfile = (user: AuthUser | null | undefined): UserFinancialProfile =>
  user?.profile && user.isConfigured ? user.profile : DEMO_PROFILE;
