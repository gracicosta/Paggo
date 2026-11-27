import { toIsoDate } from '../utils/dates';
import { DEMO_USER_ID } from '../constants/demo';
import type { Transaction } from '../types/transactions';
import type { AuthUser, UserFinancialProfile } from '../types/auth';

/**
 * Transações iniciais (seed) de cada conta: dados de exemplo para a tela não começar vazia.
 * Só cálculo, sem salvar nada: quem grava é services/transactionsService.ts.
 */

/**
 * Meses de histórico criados no começo: a conta demo ganha 12 (o gráfico do ano todo, no Premium);
 * as outras, o mês atual e o anterior. Fator = quanto o dia a dia da demo custou naquele mês
 * (posição 0 = mês atual, 1 = mês anterior…).
 */
const DEMO_FACTORS = [1, 1.08, 0.96, 1.03, 0.92, 1.1, 0.98, 1.05, 0.9, 1.12, 0.95, 1.02];
const historyMonths = (user: AuthUser) => (user.id === DEMO_USER_ID ? DEMO_FACTORS.length : 2);

/** Id único de transação (no back-end, o banco gera). */
export const newId = () => `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Gastos do dia a dia que só a conta demo recebe, para a tela não começar vazia na apresentação. */
const DEMO_DAILY: Array<[number, string, string, Transaction['method'], number, boolean]> = [
  [2, 'Supermercado Dia', 'alimentacao', 'debito', 342.45, false],
  [3, 'Uber para o trabalho', 'transporte', 'pix', 27.5, false],
  [6, 'Farmácia São João', 'saude', 'debito', 48.7, false],
  [8, 'Cinema com amigos', 'lazer', 'pix', 14, false],
  [9, 'iFood · Pizza', 'alimentacao', 'credito', 58.9, true],
  [11, 'Posto de gasolina', 'transporte', 'debito', 180, false],
  [13, 'Camiseta na promoção', 'despesasPessoais', 'credito', 87.2, true],
  [14, 'Padaria', 'alimentacao', 'dinheiro', 22.4, false],
  [16, 'Feira da semana', 'alimentacao', 'pix', 96.3, false],
  [18, 'Fone de ouvido', 'despesasPessoais', 'credito', 129.9, true],
  [21, 'Show no fim de semana', 'lazer', 'credito', 160, false],
  [23, 'iFood · Hambúrguer', 'alimentacao', 'credito', 44.9, true],
  [25, 'Consulta no dentista', 'saude', 'pix', 150, false],
  [27, 'Uber para casa', 'transporte', 'pix', 31.8, false],
];

/**
 * Primeiras transações da conta, montadas a partir do que a pessoa contou no onboarding
 * (renda, boletos e assinaturas) no mês atual e no anterior. Só entram datas até hoje.
 */
export function buildSeed(user: AuthUser, profile: UserFinancialProfile, months = historyMonths(user)): Transaction[] {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const items: Transaction[] = [];
  const payday = profile.onboarding?.payday ?? 5;

  for (let back = months - 1; back >= 0; back--) {
    const year = today.getFullYear();
    const month = today.getMonth() - back;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const on = (day: number) => toIsoDate(new Date(year, month, Math.min(Math.max(day, 1), lastDay)));
    const add = (t: Omit<Transaction, 'id' | 'impulse'> & { impulse?: boolean }) =>
      items.push({ impulse: false, ...t, id: newId() });

    if (profile.salary > 0) {
      add({
        kind: 'receita',
        amount: profile.salary,
        date: on(payday),
        description: 'Salário',
        category: 'salario',
        method: 'deposito',
      });
    }
    if (profile.extraIncome > 0) {
      add({
        kind: 'receita',
        amount: profile.extraIncome,
        date: on(18),
        description: 'Renda extra',
        category: 'extra',
        method: 'pix',
      });
    }
    for (const bill of profile.fixedBills ?? []) {
      add({
        kind: 'despesa',
        amount: bill.value,
        date: on(bill.dueDay),
        description: bill.title,
        category: bill.category || 'casa',
        method: 'boleto',
      });
    }
    for (const sub of profile.subscriptions ?? []) {
      add({
        kind: 'despesa',
        amount: sub.price,
        date: on(sub.dueDay),
        description: sub.name,
        category: 'assinaturas',
        method: 'credito',
      });
    }
    if (user.id === DEMO_USER_ID) {
      // O mês anterior fica um pouco mais caro, para a comparação "vs mês anterior" ter graça.
      const factor = DEMO_FACTORS[back] ?? 1;
      for (const [day, description, category, method, amount, impulse] of DEMO_DAILY) {
        add({
          kind: 'despesa',
          amount: Math.round(amount * factor * 100) / 100,
          date: on(day),
          description,
          category,
          method,
          impulse,
        });
      }
    }
  }

  return items.filter((t) => t.date <= todayIso);
}

/**
 * A conta demo salva antes de existir o gráfico com transações só tinha 2 meses.
 * Completa os meses mais antigos que faltam, sem mexer em nada que já foi lançado.
 */
export function withDemoHistory(user: AuthUser, profile: UserFinancialProfile, saved: Transaction[]): Transaction[] {
  if (user.id !== DEMO_USER_ID || !saved.length) return saved;
  const oldest = saved.reduce((min, t) => (t.date < min ? t.date : min), saved[0].date).slice(0, 7);
  const older = buildSeed(user, profile).filter((t) => t.date.slice(0, 7) < oldest);
  return older.length ? [...saved, ...older] : saved;
}
