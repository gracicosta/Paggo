import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { InMemoryUserStore } from '../src/repositories/userRepository.js';
import { InMemoryTransactionStore } from '../src/repositories/transactionRepository.js';
import { resetAiUsage } from '../src/routes/ai.js';

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

async function registerAndOnboard(baseUrl: string, email: string, cpf: string) {
  const reg = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Júlia', email, password: 'SenhaForte123', cpf, birthDate: '2003-04-12', provider: 'email' }),
  });
  const { token } = (await reg.json()) as { token: string };
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const post = (path: string, body: unknown) =>
    fetch(`${baseUrl}${path}`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  await post('/onboarding', { salary: 1800, extraIncome: 0, fixedBills: [], subscriptions: [], categoryBudgets: [], piggyBanks: [] });
  return post;
}

test('Bloco 4: cota do plano grátis — 1 plano e 10 perguntas de IA por mês', async () => {
  resetAiUsage();
  const srv = await startTestServer();
  try {
    const post = await registerAndOnboard(srv.baseUrl, 'julia.bloco4@paggo.com', '529.982.247-25');

    // 1º plano passa; o 2º já sugere o Premium
    const first = await post('/ai/plan', {});
    assert.equal(first.status, 200);
    const second = await post('/ai/plan', {});
    assert.equal(second.status, 403);
    assert.equal(((await second.json()) as { upgrade?: boolean }).upgrade, true);

    // 10 perguntas passam; a 11ª bloqueia com a mesma mensagem de upgrade
    for (let i = 0; i < 10; i++) {
      const ok = await post('/assistant/chat', { message: `Pergunta ${i + 1}: posso pedir pizza?` });
      assert.equal(ok.status, 200, `pergunta ${i + 1} deveria passar`);
    }
    const blocked = await post('/assistant/chat', { message: 'E agora?' });
    assert.equal(blocked.status, 403);
    const body = (await blocked.json()) as { error: string; upgrade?: boolean };
    assert.equal(body.upgrade, true);
    assert.match(body.error, /Premium/i);
  } finally {
    await srv.close();
    resetAiUsage();
  }
});

test('Bloco 4: cofrinho no grátis continua travado em 3 metas em andamento', async () => {
  const srv = await startTestServer();
  try {
    const post = await registerAndOnboard(srv.baseUrl, 'julia.bloco4b@paggo.com', '153.509.460-56');
    for (let i = 1; i <= 3; i++) {
      const res = await post('/piggy-banks', { title: `Meta ${i}`, goalAmount: 1000 });
      assert.equal(res.status, 201, `meta ${i} deveria ser criada`);
    }
    const fourth = await post('/piggy-banks', { title: 'Meta 4', goalAmount: 1000 });
    assert.equal(fourth.status, 403);
    assert.match(((await fourth.json()) as { error: string }).error, /Premium/i);
  } finally {
    await srv.close();
  }
});
