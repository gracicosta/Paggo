import type { AiPlanAction } from '../types/auth';
import { ApiError, apiRequest, readAuthToken } from './apiClient';

/**
 * Plano com IA e Assistente do Paggo.
 * Com sessão ativa chama POST /ai/plan e POST /assistant/chat (Gemini no servidor,
 * com fallback local lá). Sem API, usa os mesmos fallbacks aqui com os números
 * que a tela já tem — o chat e o plano respondem em qualquer modo.
 */

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

/** Recorte dos dados da tela usado nos fallbacks locais (espelha o AiContext do servidor). */
export interface AiUiContext {
  /** R$ que ainda cabe no teto de alimentação (null = sem teto). */
  foodLeft?: number | null;
  foodLabel?: string;
  /** Meta em andamento mais próxima do fim. */
  goalTitle?: string;
  goalLeft?: number | null;
  goalPct?: number;
  subsTotal?: number;
  monthIncome?: number;
  monthExpense?: number;
  /** Categoria com teto mais apertada. */
  topCatLabel?: string;
  topCatLimit?: number;
  topCatSpent?: number;
}

const brl = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

/**
 * Monta o recorte da tela usado nos fallbacks locais (Dashboard e chat chamam daqui,
 * com os mesmos dados que alimentam os cards).
 */
export function buildAiUiContext(input: {
  income: number;
  expense: number;
  budgets: Array<{ id: string; name: string; limit: number; spent: number }>;
  subscriptionsTotal: number;
  goal?: { title: string; left: number; progress: number } | null;
}): AiUiContext {
  const food = input.budgets.find((b) => b.id === 'alimentacao');
  const top = input.budgets.filter((b) => b.limit > 0).sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
  return {
    foodLeft: food && food.limit > 0 ? food.limit - food.spent : null,
    foodLabel: food?.name ?? 'alimentação',
    goalTitle: input.goal?.title,
    goalLeft: input.goal ? input.goal.left : null,
    goalPct: input.goal ? Math.round(input.goal.progress * 100) : 0,
    subsTotal: input.subscriptionsTotal,
    monthIncome: input.income,
    monthExpense: input.expense,
    topCatLabel: top?.name,
    topCatLimit: top?.limit,
    topCatSpent: top?.spent,
  };
}

/* ------------------------------- Plano ------------------------------- */

/** Plano local: mesma lógica do fallback do servidor (Meta + Economia + terceira). */
export function localPlan(ui: AiUiContext): AiPlanAction[] {
  const actions: AiPlanAction[] = [];
  const balance = (ui.monthIncome ?? 0) - (ui.monthExpense ?? 0);

  if (ui.goalLeft != null && ui.goalLeft > 0) {
    actions.push({
      text: `Guarde **${brl(Math.ceil(ui.goalLeft / 4))} por mês** no cofrinho${ui.goalTitle ? ` "${ui.goalTitle}"` : ''}.`,
      detail: `Faltam ${brl(ui.goalLeft)} para a meta${ui.goalPct ? ` (${ui.goalPct}% completa)` : ''}.`,
      tag: 'Meta',
    });
  } else {
    actions.push({
      text: 'Crie um cofrinho e guarde um valor fixo por mês.',
      detail: 'Uma reserva evita aperto quando aparece gasto inesperado.',
      tag: 'Meta',
    });
  }

  if (ui.topCatLabel && ui.topCatLimit) {
    const weekly = Math.max(10, Math.round(((ui.topCatLimit - (ui.topCatSpent ?? 0)) / 4)));
    actions.push({
      text: `Tente gastar até **${brl(weekly)} por semana** em ${ui.topCatLabel.toLowerCase()}.`,
      detail: `Já saiu ${brl(ui.topCatSpent ?? 0)} do teto de ${brl(ui.topCatLimit)}.`,
      tag: 'Economia',
    });
  } else {
    actions.push({
      text: 'Defina um teto para a categoria que mais pesa no mês.',
      detail: 'O Paggo avisa quando chegar perto de 80% do combinado.',
      tag: 'Economia',
    });
  }

  if (balance < 0) {
    actions.push({
      text: `O mês fechou **${brl(-balance)} no vermelho**.`,
      detail: 'Corte o maior gasto por impulso primeiro — é o ajuste mais rápido.',
      tag: 'Atenção',
    });
  } else if (ui.subsTotal) {
    actions.push({
      text: `Suas assinaturas somam **${brl(ui.subsTotal)}/mês** (${brl(ui.subsTotal * 12)}/ano).`,
      detail: 'Cancelar a que você menos usa já libera dinheiro para a meta.',
      tag: 'Dica',
    });
  } else {
    actions.push({
      text: `Ainda sobram **${brl(Math.max(balance, 0))}** no plano do mês.`,
      detail: 'Anote os gastos do dia a dia para ver para onde esse valor vai.',
      tag: 'Dica',
    });
  }

  return actions;
}

/**
 * Plano do mês. Quando a cota do grátis estoura no servidor (403), `blocked` traz
 * a mensagem de upgrade — a tela mostra o convite do Premium em vez das ações.
 */
export async function fetchAiPlan(ui: AiUiContext): Promise<{ actions: AiPlanAction[]; blocked?: string }> {
  if (readAuthToken()) {
    try {
      const res = await apiRequest<{ actions: AiPlanAction[] }>('/ai/plan', { method: 'POST' });
      if (res.actions?.length) return { actions: res.actions };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) return { actions: [], blocked: err.message };
      /* API fora do ar → plano local */
    }
  }
  return { actions: localPlan(ui) };
}

/* ---------------------------- Assistente ---------------------------- */

/** Respostas locais do assistente: espelha o fallback do servidor com os números da tela. */
export function localChat(message: string, ui: AiUiContext): string {
  const m = message.toLowerCase();

  if (/pizza|ifood|delivery|lanche|hamburg|restaurante|comer fora|pedir/.test(m)) {
    if (ui.foodLeft == null) {
      return 'Pode pedir com tranquilidade — você ainda não definiu teto para comida. Se quiser, crie um limite na aba Limites para o Paggo te avisar antes de apertar.';
    }
    if (ui.foodLeft <= 0) return `Melhor deixar para amanhã: o teto de ${ui.foodLabel ?? 'comida'} já estourou. Se pedir, passa do combinado do mês.`;
    if (ui.foodLeft <= 100) return `Dá, mas com cuidado: só restam ${brl(ui.foodLeft)} no teto de ${ui.foodLabel ?? 'comida'}. Que tal dividir a conta?`;
    return `Pode pedir! Ainda restam ${brl(ui.foodLeft)} no teto de ${ui.foodLabel ?? 'comida'} este mês.`;
  }

  if (/meta|viagem|cofrinho|guardar|juntar|falta/.test(m)) {
    if (ui.goalLeft != null && ui.goalLeft > 0) {
      return `Faltam ${brl(ui.goalLeft)}${ui.goalTitle ? ` para "${ui.goalTitle}"` : ' para a meta'}. Você já guardou ${ui.goalPct ?? 0}% — cada depósito, mesmo pequeno, encurta o caminho.`;
    }
    return 'Você ainda não tem uma meta em andamento. Que tal criar um cofrinho na aba Metas? Pode ser viagem, reserva ou o que quiser.';
  }

  if (/boleto|atrasar|vencer|luz|conta|multa/.test(m)) {
    return 'Boletos atrasados costumam ter multa e juros por dia — quanto antes pagar, menos pesa. Se estiver apertado, veja no Dashboard qual vence primeiro e pague esse.';
  }

  if (/assinatura|netflix|spotify|streaming|prime/.test(m)) {
    if (ui.subsTotal) return `Suas assinaturas somam ${brl(ui.subsTotal)} por mês — ${brl(ui.subsTotal * 12)} por ano. Usa todas? Cancelar uma já libera dinheiro para o cofrinho.`;
    return 'Você não cadastrou assinaturas no onboarding. Se tiver alguma, vale anotar para o Paggo somar no mês.';
  }

  if (/saldo|quanto tenho|quanto sobrou|sobrou/.test(m)) {
    const balance = (ui.monthIncome ?? 0) - (ui.monthExpense ?? 0);
    return `Este mês entraram ${brl(ui.monthIncome ?? 0)} e saíram ${brl(ui.monthExpense ?? 0)}. ${balance >= 0 ? `Sobraram ${brl(balance)} até agora.` : `Faltam ${brl(-balance)} para fechar no azul.`}`;
  }

  return 'Posso ajudar com limites, boletos, assinaturas e metas. Tente perguntar: "Posso pedir pizza hoje?" ou "Quanto falta para minha meta?".';
}

export async function sendChat(message: string, history: ChatMsg[], ui: AiUiContext): Promise<string> {
  if (readAuthToken()) {
    try {
      const res = await apiRequest<{ reply: string }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      });
      if (res.reply) return res.reply;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) return err.message;
      /* API fora do ar → resposta local */
    }
  }
  return localChat(message, ui);
}
