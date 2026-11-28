export interface FixedBillItem {
  id: string;
  title: string;
  value: number;
  dueDay: number;
  category: string;
  status: 'Pendente' | 'Vence hoje' | 'Vencido';
}

export interface SubscriptionItem {
  id: string;
  name: string;
  price: number;
  dueDay: number;
  service: 'netflix' | 'spotify' | 'amazon' | 'other';
  color?: string;
}

export interface CategoryBudgetItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  color: string;
  background: string;
}

export interface GoalMove {
  id: string;
  date: string;
  amount: number;
}

export interface PiggyBankItemModel {
  id: number;
  title: string;
  description: string;
  savedAmount: number;
  goalAmount: number;
  progress: number;
  iconType?: string;
  progressColor: string;
  deadline?: string;
  createdAt?: string;
  moves?: GoalMove[];
  completedAt?: string;
}

export interface AiPlanAction {
  text: string;
  detail: string;
  tag: 'Meta' | 'Economia' | 'Dica' | 'Atenção';
}

export interface OnboardingAnswers {
  incomeSources: string[];
  payday: number | null;
  goalMonths: number | null;
  skippedSteps: number[];
  plan: AiPlanAction[];
  completedAt: string;
}

export interface UserFinancialProfile {
  salary: number;
  extraIncome: number;
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  categoryBudgets: CategoryBudgetItem[];
  piggyBanks: PiggyBankItemModel[];
  onboarding?: OnboardingAnswers;
}

export interface PublicAuthUser {
  id: string;
  name: string;
  email: string;
  isConfigured: boolean;
  provider: 'email' | 'google';
  plan: 'free' | 'premium';
  termsAcceptedAt?: string;
  profile: UserFinancialProfile;
}

export interface StoredUserRecord extends PublicAuthUser {
  passwordHash?: string | null;
  googleSub?: string | null;
  cpfEncrypted?: string | null;
  cpfHash?: string | null;
  birthDateEncrypted?: string | null;
}

export interface AnonymizedAiFinancialContext {
  plan: 'free' | 'premium';
  monthlyIncome: number;
  fixedBillsTotal: number;
  subscriptionsTotal: number;
  categories: Array<{
    category: string;
    monthlyLimit: number;
    spent: number;
  }>;
  piggyBanks: Array<{
    goalAmount: number;
    savedAmount: number;
    progressPct: number;
  }>;
}
