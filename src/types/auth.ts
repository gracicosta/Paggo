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

/** Um depósito (valor positivo) ou uma retirada (valor negativo) num cofrinho. */
export interface GoalMove {
  id: string;
  /** Data no formato aaaa-mm-dd. */
  date: string;
  amount: number;
}

/** Cofrinho de uma meta (aba Metas e cartão "Cofrinhos" do Dashboard). */
export interface PiggyBankItemModel {
  id: number;
  title: string;
  description: string;
  savedAmount: number;
  goalAmount: number;
  /** Porcentagem guardada (0 a 100). Mantida para quem já tinha dados salvos; as telas calculam de novo. */
  progress: number;
  /** Tipo da meta (viagem, reserva, casa…; veja data/goalTypes.ts). */
  iconType?: string;
  progressColor: string;
  /** Mês em que a meta deve estar completa, "aaaa-mm" (sem o campo = sem prazo). */
  deadline?: string;
  /** Dia em que a meta foi criada, "aaaa-mm-dd". */
  createdAt?: string;
  /** Depósitos e retiradas, do mais antigo para o mais novo. */
  moves?: GoalMove[];
  /** Dia em que o valor da meta foi alcançado, "aaaa-mm-dd". */
  completedAt?: string;
}

/** Um passo do plano que a IA monta no fim do onboarding. */
export interface AiPlanAction {
  /** Texto principal; o trecho entre ** ** aparece em negrito. */
  text: string;
  detail: string;
  tag: 'Meta' | 'Economia' | 'Dica' | 'Atenção';
}

/** Respostas do onboarding que não cabem nos campos do painel. */
export interface OnboardingAnswers {
  /** De onde vem a renda (salario, extras, mei, aposentadoria, pensao, outro). */
  incomeSources: string[];
  /** Dia em que a renda costuma cair (null = varia ou não informado). */
  payday: number | null;
  /** Prazo da primeira meta, em meses (null = pulou a meta). */
  goalMonths: number | null;
  /** Passos que a pessoa pulou (2, 4, 5 ou 6). */
  skippedSteps: number[];
  /** Plano gerado no passo 7. */
  plan: AiPlanAction[];
  /** Data e hora (ISO) em que terminou o onboarding. */
  completedAt: string;
}

export interface UserFinancialProfile {
  salary: number;
  extraIncome: number;
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  categoryBudgets: CategoryBudgetItem[];
  piggyBanks: PiggyBankItemModel[];
  /** Preenchido pelo onboarding (a conta demo não tem). */
  onboarding?: OnboardingAnswers;
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
  /** Plano da conta (sem o campo = grátis; veja data/plans.ts). */
  plan?: 'free' | 'premium';
}
