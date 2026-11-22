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

export interface PiggyBankItemModel {
  id: number;
  title: string;
  description: string;
  savedAmount: number;
  goalAmount: number;
  progress: number;
  iconType?: string;
  progressColor: string;
}

export interface UserFinancialProfile {
  salary: number;
  extraIncome: number;
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  categoryBudgets: CategoryBudgetItem[];
  piggyBanks: PiggyBankItemModel[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isConfigured: boolean;
  profile: UserFinancialProfile;
}
