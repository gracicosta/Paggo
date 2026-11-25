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

/** Dados pessoais pedidos no passo 2 do cadastro ("Sobre você"). */
export interface SignupDetails {
  /** CPF só com números (11 dígitos). */
  cpf: string;
  /** Data de nascimento no formato aaaa-mm-dd. */
  birthDate: string;
  /** Data e hora (ISO) em que a pessoa aceitou os Termos de Uso e a Política de Privacidade. */
  termsAcceptedAt: string;
  /** Como a conta foi criada. */
  provider: 'email' | 'google';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isConfigured: boolean;
  profile: UserFinancialProfile;
  /** Preenchido pela tela de cadastro (contas antigas e a demo não têm). */
  cpf?: string;
  birthDate?: string;
  termsAcceptedAt?: string;
  provider?: 'email' | 'google';
}
