import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { InMemoryUserStore } from '../src/repositories/userRepository.js';
import { decryptSensitive, encryptSensitive, hashIdentifier, sanitizeForAi } from '../src/utils/lgpd.js';

async function startTestServer() {
  const store = new InMemoryUserStore();
  const app = createApp(store);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  return {
    store,
    baseUrl,
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

test('LGPD: criptografa CPF/data de nascimento com AES-256-GCM e gera hash determinístico', () => {
  const cpf = '12345678909';
  const encrypted = encryptSensitive(cpf);

  assert.notEqual(encrypted, cpf);
  assert.ok(!encrypted.includes(cpf));
  assert.equal(decryptSensitive(encrypted), cpf);

  const h1 = hashIdentifier('123.456.789-09');
  const h2 = hashIdentifier('12345678909');
  assert.equal(h1, h2);
  assert.equal(h1.length, 64);
});

test('LGPD: sanitizeForAi remove CPF, nome, e-mail e IDs antes de enviar para IA', () => {
  const sanitized = sanitizeForAi({
    plan: 'free',
    profile: {
      salary: 3500,
      extraIncome: 500,
      fixedBills: [
        { id: '1', title: 'Aluguel', value: 1200, dueDay: 10, category: 'casa', status: 'Pendente' },
      ],
      subscriptions: [
        { id: '1', name: 'Netflix', price: 39.9, dueDay: 15, service: 'netflix' },
      ],
      categoryBudgets: [
        { id: 'alimentacao', name: 'Alimentação', limit: 800, spent: 400, color: '#22c55e', background: '#DCFCE7' },
      ],
      piggyBanks: [
        {
          id: 1,
          title: 'Viagem',
          description: 'Meta da Júlia',
          savedAmount: 500,
          goalAmount: 2000,
          progress: 25,
          progressColor: '#7c3aed',
        },
      ],
    },
  });

  const serialized = JSON.stringify(sanitized);
  assert.equal(sanitized.monthlyIncome, 4000);
  assert.equal(sanitized.fixedBillsTotal, 1200);
  assert.equal(sanitized.subscriptionsTotal, 39.9);
  assert.equal(sanitized.categories[0]?.category, 'Alimentação');
  assert.equal(sanitized.piggyBanks[0]?.progressPct, 25);
  assert.ok(!serialized.includes('Júlia'));
  assert.ok(!('cpf' in sanitized));
  assert.ok(!('email' in sanitized));
  assert.ok(!('name' in sanitized));
});

test('Fluxo ponta a ponta Bloco 1: cadastro -> login -> Google mock -> demo -> POST /api/onboarding', async () => {
  const srv = await startTestServer();
  try {
    // 1. Health
    const healthRes = await fetch(`${srv.baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthBody = (await healthRes.json()) as { status: string; database: string };
    assert.equal(healthBody.status, 'ok');
    assert.equal(healthBody.database, 'connected');

    // 2. Cadastro com CPF protegido por LGPD
    const regRes = await fetch(`${srv.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Júlia Mendes',
        email: 'julia@paggo.com',
        password: 'SenhaForte123',
        cpf: '529.982.247-25',
        birthDate: '2003-04-12',
        provider: 'email',
      }),
    });
    assert.equal(regRes.status, 201);
    const regBody = (await regRes.json()) as { token: string; user: { id: string; isConfigured: boolean } };
    assert.ok(regBody.token);
    assert.equal(regBody.user.isConfigured, false);

    // Garante que CPF foi criptografado no armazenamento
    const stored = await srv.store.findById(regBody.user.id);
    assert.ok(stored?.cpfEncrypted);
    assert.ok(!stored.cpfEncrypted.includes('52998224725'));
    assert.equal(decryptSensitive(stored.cpfEncrypted), '52998224725');

    // 3. Check CPF duplicado via blind index
    const cpfRes = await fetch(`${srv.baseUrl}/auth/check-cpf?cpf=52998224725`);
    const cpfBody = (await cpfRes.json()) as { registered: boolean };
    assert.equal(cpfBody.registered, true);

    // 4. POST /api/onboarding com JWT
    const onbRes = await fetch(`${srv.baseUrl}/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regBody.token}`,
      },
      body: JSON.stringify({
        salary: 2200,
        extraIncome: 300,
        fixedBills: [
          { id: 'aluguel', title: 'Aluguel', value: 900, dueDay: 10, category: 'casa', status: 'Pendente' },
        ],
        subscriptions: [],
        categoryBudgets: [
          { id: 'alimentacao', name: 'Alimentação', limit: 700, spent: 0, color: '#22c55e', background: '#DCFCE7' },
        ],
        piggyBanks: [
          {
            id: 1,
            title: 'Viagem',
            description: 'Outubro',
            savedAmount: 0,
            goalAmount: 1500,
            progress: 0,
            progressColor: '#7c3aed',
          },
        ],
      }),
    });
    assert.equal(onbRes.status, 200);
    const onbBody = (await onbRes.json()) as {
      user: { isConfigured: boolean; profile: { salary: number } };
      aiContextPreview: { monthlyIncome: number };
    };
    assert.equal(onbBody.user.isConfigured, true);
    assert.equal(onbBody.user.profile.salary, 2200);
    assert.equal(onbBody.aiContextPreview.monthlyIncome, 2500);

    // 5. Login com senha
    const loginRes = await fetch(`${srv.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'julia@paggo.com', password: 'SenhaForte123' }),
    });
    assert.equal(loginRes.status, 200);

    // 6. Google OAuth mock (novo usuário retorna needsSignup: true)
    const googleRes = await fetch(`${srv.baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mockProfile: { name: 'Dona Lúcia', email: 'lucia.google@gmail.com' },
      }),
    });
    assert.equal(googleRes.status, 200);
    const googleBody = (await googleRes.json()) as { needsSignup: boolean; profile: { email: string } };
    assert.equal(googleBody.needsSignup, true);
    assert.equal(googleBody.profile.email, 'lucia.google@gmail.com');

    // 7. Modo Demonstração 1 clique
    const demoRes = await fetch(`${srv.baseUrl}/auth/demo`, { method: 'POST' });
    assert.equal(demoRes.status, 200);
    const demoBody = (await demoRes.json()) as { token: string; user: { isConfigured: boolean; name: string } };
    assert.ok(demoBody.token);
    assert.equal(demoBody.user.isConfigured, true);
    assert.equal(demoBody.user.name, 'Carlos Oliveira');
  } finally {
    await srv.close();
  }
});
