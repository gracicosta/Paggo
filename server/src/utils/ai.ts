import { env } from '../config/env.js';

/**
 * Motor de IA do Paggo: chama o Gemini (REST, sem SDK) quando GEMINI_API_KEY existe;
 * sem chave ou em caso de falha, cai para respostas determinísticas montadas com os
 * mesmos números — a demo nunca depende de internet nem de cota da API.
 *
 * LGPD: os prompts só recebem sanitizeForAi + totais do mês — nunca nome, e-mail, CPF ou IDs.
 */

export interface AiPlanActionApi {
  text: string;
  detail: string;
  tag: 'Meta' | 'Economia' | 'Dica' | 'Atenção';
}

export interface AiContext {
  plan: 'free' | 'premium';
  monthlyIncome: number;
  fixedBillsTotal: number;
  subscriptionsTotal: number;
  categories: Array<{ category: string; monthlyLimit: number; spent: number }>;
  piggyBanks: Array<{ goalAmount: number; savedAmount: number; progressPct: number; title?: string }>;
  /** Totais do mês atual, vindos das transações. */
  month: { income: number; expense: number; balance: number };
}

export const ASSISTANT_SYSTEM_PROMPT = `Você é o Paggo, o assistente financeiro do app de mesmo nome.
Regras de personalidade:
- Fale português brasileiro, curto e direto: no máximo 3 frases por resposta.
- Linguagem coloquial, como uma amiga que entende de dinheiro. Empatia primeiro.
- É PROIBIDO usar jargões: "CDI", "EBITDA", "amortização", "fluxo de caixa", "rentabilidade", "ativo", "passivo".
- Diga "dinheiro que entrou", "dinheiro que saiu", "quanto sobrou", "teto de gastos".
- Use os números do contexto quando existirem (limites, metas, boletos). Nunca peça dados pessoais.
- Não invente números: se faltar informação, diga o que a pessoa pode conferir no app.`;

const PLAN_SYSTEM_PROMPT = `${ASSISTANT_SYSTEM_PROMPT}

Você monta um plano de ação mensal. Responda APENAS um array JSON (sem markdown, sem texto fora do array)
com 3 objetos no formato:
[{"text":"ação com **valor** em negrito","detail":"uma linha explicando o porquê","tag":"Meta|Economia|Dica|Atenção"}]
Regras: sempre uma ação de Meta (cofrinho ou reserva), uma de Economia (categoria com limite) e a terceira
livre (Dica ou Atenção). Valores em reais do contexto, prazos concretos.`;

const PLAN_TAG = new Set(['Meta', 'Economia', 'Dica', 'Atenção']);

async function gemini(prompt: string, system: string, maxTokens = 512): Promise<string | null> {
  if (!env.geminiApiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

const ctxJson = (ctx: AiContext) => JSON.stringify(ctx, null, 0);

/* ----------------------------- Plano com IA ----------------------------- */

function parsePlan(raw: string): AiPlanActionApi[] | null {
  const cleaned = raw.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1)) as unknown[];
    const actions = arr
      .map((a) => a as Partial<AiPlanActionApi>)
      .filter((a): a is AiPlanActionApi =>
        Boolean(a?.text && a.detail && a.tag && PLAN_TAG.has(a.tag)),
      );
    return actions.length ? actions.slice(0, 4) : null;
  } catch {
    return null;
  }
}

/** Plano determinístico com os mesmos dados da IA (fallback sem chave/cota). */
export function buildLocalPlan(ctx: AiContext): AiPlanActionApi[] {
  const actions: AiPlanActionApi[] = [];
  const brl = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  const goal = ctx.piggyBanks.filter((g) => g.goalAmount > g.savedAmount)[0];
  const leftover = ctx.month.income - ctx.month.expense;

  // 1. Meta
  if (goal) {
    const left = goal.goalAmount - goal.savedAmount;
    const perMonth = Math.ceil(left / 4);
    actions.push({
      text: `Guarde **${brl(Math.min(perMonth, Math.max(leftover, perMonth)))} por mês** no cofrinho.`,
      detail: `Faltam ${brl(left)} para a meta (${goal.progressPct}% completa).`,
      tag: 'Meta',
    });
  } else {
    actions.push({
      text: `Sobrou ${brl(Math.max(leftover, 0))} no mês: mande uma parte para uma reserva.`,
      detail: 'Uma reserva evita aperto quando aparece gasto inesperado.',
      tag: 'Meta',
    });
  }

  // 2. Economia: categoria mais apertada com teto
  const tight = ctx.categories
    .filter((c) => c.monthlyLimit > 0)
    .sort((a, b) => b.spent / b.monthlyLimit - a.spent / a.monthlyLimit)[0];
  if (tight) {
    const weekly = Math.max(10, Math.round((tight.monthlyLimit - tight.spent) / 4));
    actions.push({
      text: `Tente gastar até **${brl(weekly)} por semana** em ${tight.category.toLowerCase()}.`,
      detail: `Já saiu ${brl(tight.spent)} do teto de ${brl(tight.monthlyLimit)}.`,
      tag: 'Economia',
    });
  } else {
    actions.push({
      text: 'Defina um teto para a categoria que mais pesa no mês.',
      detail: 'Limites mostram quando chegar perto de 80% do combinado.',
      tag: 'Economia',
    });
  }

  // 3. Atenção ou Dica
  if (ctx.month.balance < 0) {
    actions.push({
      text: `O mês fechou **${brl(-ctx.month.balance)} no vermelho**.`,
      detail: 'Corte o maior gasto por impulso primeiro — é o ajuste mais rápido.',
      tag: 'Atenção',
    });
  } else if (ctx.subscriptionsTotal > 0) {
    actions.push({
      text: `Suas assinaturas somam **${brl(ctx.subscriptionsTotal)}/mês** (${brl(ctx.subscriptionsTotal * 12)}/ano).`,
      detail: 'Cancelar a que você menos usa já libera dinheiro para a meta.',
      tag: 'Dica',
    });
  } else {
    actions.push({
      text: `Ainda sobram **${brl(Math.max(leftover, 0))}** no plano do mês.`,
      detail: 'Anote os gastos do dia a dia para ver para onde esse valor vai.',
      tag: 'Dica',
    });
  }

  return actions;
}

export async function generatePlan(ctx: AiContext): Promise<{ actions: AiPlanActionApi[]; source: 'gemini' | 'local' }> {
  const raw = await gemini(`Contexto financeiro do mês (JSON): ${ctxJson(ctx)}\nMonte o plano de ação.`, PLAN_SYSTEM_PROMPT);
  const parsed = raw ? parsePlan(raw) : null;
  return parsed ? { actions: parsed, source: 'gemini' } : { actions: buildLocalPlan(ctx), source: 'local' };
}

/* ---------------------------- Assistente (chat) ---------------------------- */

const norm = (s: string) => s.toLowerCase();

/** Respostas determinísticas do assistente (fallback): cobrem as perguntas da demo e casos comuns. */
export function buildLocalChatReply(message: string, ctx: AiContext): string {
  const m = norm(message);
  const brl = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  const food = ctx.categories.find((c) => /aliment|mercado|delivery|comida/i.test(c.category));

  if (/pizza|ifood|delivery|lanche|hamburg|restaurante|comer fora|pedir/.test(m)) {
    if (food && food.monthlyLimit > 0) {
      const left = food.monthlyLimit - food.spent;
      if (left <= 0) return `Melhor deixar para amanhã: o teto de ${food.category.toLowerCase()} já estourou. Se pedir, passa do combinado do mês.`;
      if (left <= 100) return `Dá, mas com cuidado: só restam ${brl(left)} no teto de ${food.category.toLowerCase()}. Que tal dividir a conta?`;
      return `Pode pedir! Ainda restam ${brl(left)} no teto de ${food.category.toLowerCase()} este mês.`;
    }
    return 'Pode pedir com tranquilidade — você ainda não definiu teto para comida. Se quiser, crie um limite na aba Limites para o Paggo te avisar antes de apertar.';
  }

  if (/meta|viagem|cofrinho|guardar|juntar|falta/.test(m)) {
    const goal = ctx.piggyBanks.filter((g) => g.goalAmount > g.savedAmount)[0];
    if (goal) {
      const left = goal.goalAmount - goal.savedAmount;
      const title = goal.title ? ` para "${goal.title}"` : '';
      return `Faltam ${brl(left)}${title}. Você já guardou ${goal.progressPct}% — cada depósito, mesmo pequeno, encurta o caminho.`;
    }
    return 'Você ainda não tem uma meta em andamento. Que tal criar um cofrinho na aba Metas? Pode ser viagem, reserva ou o que quiser.';
  }

  if (/boleto|atrasar|vencer|luz|conta|multa/.test(m)) {
    return 'Boletos atrasados costumam ter multa e juros por dia — quanto antes pagar, menos pesa. Se estiver apertado, veja na aba Boletos qual vence primeiro e pague esse.';
  }

  if (/assinatura|netflix|spotify|streaming|prime/.test(m)) {
    if (ctx.subscriptionsTotal > 0) {
      return `Suas assinaturas somam ${brl(ctx.subscriptionsTotal)} por mês — ${brl(ctx.subscriptionsTotal * 12)} por ano. Usa todas? Cancelar uma já libera dinheiro para o cofrinho.`;
    }
    return 'Você não cadastrou assinaturas no onboarding. Se tiver alguma, vale anotar para o Paggo somar no mês.';
  }

  if (/saldo|quanto tenho|quanto sobrou|sobrou/.test(m)) {
    const { income, expense, balance } = ctx.month;
    return `Este mês entraram ${brl(income)} e saíram ${brl(expense)}. ${balance >= 0 ? `Sobraram ${brl(balance)} até agora.` : `Faltam ${brl(-balance)} para fechar no azul.`}`;
  }

  if (/economizar|guardar mais|sobrar mais|cortar/.test(m)) {
    const tight = ctx.categories.filter((c) => c.monthlyLimit > 0).sort((a, b) => b.spent / b.monthlyLimit - a.spent / a.monthlyLimit)[0];
    if (tight) return `O primeiro corte mais fácil é ${tight.category.toLowerCase()}: já saiu ${brl(tight.spent)} do teto de ${brl(tight.monthlyLimit)}. Segurar essa categoria até o fim do mês já ajuda bastante.`;
    return 'Comece olhando os gastos por impulso na aba Transações — cortar um por semana já faz diferença no fim do mês.';
  }

  return 'Posso ajudar com limites, boletos, assinaturas e metas. Tente perguntar: "Posso pedir pizza hoje?" ou "Quanto falta para minha meta?".';
}

export async function chat(message: string, ctx: AiContext, history: { role: string; text: string }[] = []): Promise<{ reply: string; source: 'gemini' | 'local' }> {
  const hist = history.slice(-6).map((h) => `${h.role === 'user' ? 'Pessoa' : 'Paggo'}: ${h.text}`).join('\n');
  const prompt = `${hist ? `${hist}\n` : ''}Pessoa: ${message}\n\nContexto financeiro (JSON, use os números quando útil): ${ctxJson(ctx)}`;
  const raw = await gemini(prompt, ASSISTANT_SYSTEM_PROMPT, 256);
  return raw ? { reply: raw.trim(), source: 'gemini' } : { reply: buildLocalChatReply(message, ctx), source: 'local' };
}
