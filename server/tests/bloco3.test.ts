import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { InMemoryUserStore } from '../src/repositories/userRepository.js';
import { InMemoryTransactionStore } from '../src/repositories/transactionRepository.js';
import { buildLocalChatReply, buildLocalPlan, type AiContext } from '../src/utils/ai.js';

async function startTestServer() {
  const store = new InMemoryUserStore();
  const transactions = new InMemoryTransactionStore();
  const app = createApp(store, transactions);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}/api`,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

const thisMonth = () => new Date().toISOString().slice(0, 7);


const BASE_CTX: AiContext = {
  plan: 'free',
  monthlyIncome: 1800,
  fixedBillsTotal: 600,
  subscriptionsTotal: 55.9,
  categories: [
    { category: 'Alimentação', monthlyLimit: 700, spent: 640 },
    { category: 'Lazer', monthlyLimit: 300, spent: 60 },
  ],
  piggyBanks: [{ goalAmount: 1500, savedAmount: 450, progressPct: 30 }],
  month: { income: 1800, expense: 1100, balance: 700 },
};

test('plano local (fallback sem chave Gemini): Meta + Economia + terceira ação', () => {
  const actions = buildLocalPlan(BASE_CTX);
  assert.equal(actions.length, 3);
  assert.equal(actions[0]?.tag, 'Meta');
  assert.equal(actions[1]?.tag, 'Economia');
  assert.ok(['Dica', 'Atenção'].includes(actions[2]?.tag ?? ''));
  assert.match(actions[0]!.text, /cofrinho|reserva/i);
});

test('assistente local: responde as perguntas da demo em linguagem simples', () => {
  const pizza = buildLocalChatReply('Posso pedir pizza hoje?', BASE_CTX);
  assert.match(pizza, /Dá, mas com cuidado/i);
  assert.match(pizza, /60/); // restam R$ 60 no teto de alimentação

  const meta = buildLocalChatReply('Quanto falta para minha meta da viagem?', BASE_CTX);
  assert.match(meta, /1\.?050/); // faltam R$ 1.050

  const boleto = buildLocalChatReply('O que acontece se eu atrasar meu boleto de luz?', BASE_CTX);
  assert.match(boleto, /multa|juros/i);

  // Guardrail de linguagem: nada de jargão nas respostas
  for (const reply of [pizza, meta, boleto]) {
    assert.doesNotMatch(reply, /CDI|EBITDA|amortiza|fluxo de caixa|rentabilidade/i);
  }
});

test('Bloco 3: cofrinho com aporte que deduz do saldo -> plano IA -> assistente', async () => {
  const srv = await startTestServer();
  try {
    // Cadastro + onboarding com meta e teto de alimentação
    const reg = await fetch(`${srv.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Júlia Mendes',
        email: 'julia.bloco3@paggo.com',
        password: 'SenhaForte123',
        cpf: '406.303.168-92',
        birthDate: '2003-04-12',
        provider: 'email',
      }),
    });
    const { token } = (await reg.json()) as { token: string };
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const post = (path: string, body: unknown, method = 'POST') =>
      fetch(`${srv.baseUrl}${path}`, { method, headers: auth, body: body === undefined ? undefined : JSON.stringify(body) });

    const onb = await post('/onboarding', {
      salary: 1800,
      extraIncome: 0,
      fixedBills: [],
      subscriptions: [{ id: 'n1', name: 'Netflix', price: 55.9, dueDay: 15, service: 'netflix' }],
      categoryBudgets: [
        { id: 'alimentacao', name: 'Alimentação', limit: 700, spent: 0, color: '#f97316', background: '#FFEDD5' },
      ],
      piggyBanks: [
        { id: 1, title: 'Viagem em outubro', description: '', savedAmount: 450, goalAmount: 1500, progress: 30, progressColor: '#7c3aed', moves: [] },
      ],
    });
    assert.equal(onb.status, 200);

    // Cofrinhos com progresso
    const banks = await (await fetch(`${srv.baseUrl}/piggy-banks`, { headers: auth })).json() as {
      items: { id: number; left: number; done: boolean }[];
    };
    assert.equal(banks.items.length, 1);
    assert.equal(banks.items[0]?.left, 1050);
    assert.equal(banks.items[0]?.done, false);

    // Aporte: enche o cofrinho E lança a despesa (deduz do saldo)
    const dep = await post('/piggy-banks/1/deposit', { amount: 200 });
    assert.equal(dep.status, 200);
    const depBody = (await dep.json()) as {
      item: { savedAmount: number; progress: number; moves: { amount: number }[] };
      transaction: { kind: string; category: string; amount: number };
    };
    assert.equal(depBody.item.savedAmount, 650);
    assert.equal(depBody.item.progress, 43);
    assert.equal(depBody.item.moves.length, 1);
    assert.equal(depBody.transaction.kind, 'despesa');
    assert.equal(depBody.transaction.amount, 200);

    // O resumo do mês agora desconta o aporte do saldo
    const summary = await (await fetch(`${srv.baseUrl}/dashboard/summary?month=${thisMonth()}`, { headers: auth })).json() as { expense: number };
    assert.equal(summary.expense, 200);

    // Nova meta no plano grátis e limite de 3 em andamento
    for (let i = 0; i < 2; i++) {
      const created = await post('/piggy-banks', { title: `Meta ${i}`, goalAmount: 100 });
      assert.equal(created.status, 201);
    }
    const overflow = await post('/piggy-banks', { title: 'Quarta meta', goalAmount: 100 });
    assert.equal(overflow.status, 403);

    // Plano com IA (sem chave → fallback local coerente)
    const plan = await post('/ai/plan', {});
    assert.equal(plan.status, 200);
    const planBody = (await plan.json()) as { actions: { text: string; tag: string }[]; source: string };
    assert.equal(planBody.source, 'local');
    assert.equal(planBody.actions.length, 3);
    assert.match(planBody.actions[0]!.text, /\*\*R\$/);

    // Assistente: respostas das perguntas prontas da demo
    const chat = await post('/assistant/chat', { message: 'Posso pedir pizza hoje?' });
    assert.equal(chat.status, 200);
    const chatBody = (await chat.json()) as { reply: string; source: string };
    assert.equal(chatBody.source, 'local');
    assert.match(chatBody.reply, /Pode pedir|Melhor deixar|Dá, mas/i);
    assert.doesNotMatch(chatBody.reply, /CDI|EBITDA|amortiza|fluxo de caixa/i);

    // Sem mensagem → 400
    const empty = await post('/assistant/chat', { message: '  ' });
    assert.equal(empty.status, 400);
  } finally {
    await srv.close();
  }
});
