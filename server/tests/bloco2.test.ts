import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { InMemoryUserStore } from '../src/repositories/userRepository.js';
import { InMemoryTransactionStore } from '../src/repositories/transactionRepository.js';
import { suggestCategory } from '../src/utils/categorize.js';
import { billStatus } from '../src/utils/dashboard.js';

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
const thisDay = (day: number) => `${thisMonth()}-${String(day).padStart(2, '0')}`;

async function registerUser(baseUrl: string) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Júlia Mendes',
      email: 'julia.bloco2@paggo.com',
      password: 'SenhaForte123',
      cpf: '390.533.447-05',
      birthDate: '2003-04-12',
      provider: 'email',
    }),
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { token: string };
  return { Authorization: `Bearer ${body.token}` };
}

test('categorização automática: descrição decide a categoria', () => {
  assert.equal(suggestCategory('iFood · Pizza', 'despesa'), 'alimentacao');
  assert.equal(suggestCategory('Uber para o trabalho', 'despesa'), 'transporte');
  assert.equal(suggestCategory('Netflix Premium', 'despesa'), 'assinaturas');
  assert.equal(suggestCategory('Farmácia São João', 'despesa'), 'saude');
  assert.equal(suggestCategory('Salário mensal', 'receita'), 'salario');
  assert.equal(suggestCategory('Freela de design', 'receita'), 'extra');
  assert.equal(suggestCategory('xyz sem sentido', 'despesa'), 'outros');
});

test('status de boleto calculado pelo dia de vencimento', () => {
  const today = new Date();
  assert.equal(billStatus(today.getDate(), today).label, 'Vence hoje');
  assert.equal(billStatus(today.getDate() - 2, today).label, 'Vencido há 2 dias');
  assert.equal(billStatus(today.getDate() + 5, today).label, 'Vence em 5 dias');
});

test('Bloco 2: transações -> summary com alerta 80% -> evolução -> boletos -> assinaturas', async () => {
  const srv = await startTestServer();
  try {
    const auth = await registerUser(srv.baseUrl);
    const post = (path: string, body: unknown, method = 'POST') =>
      fetch(`${srv.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...auth },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

    // Onboarding: teto de R$ 700 em alimentação + boleto + assinatura
    const day = new Date().getDate();
    const onb = await post('/onboarding', {
      salary: 1800,
      extraIncome: 0,
      fixedBills: [
        { id: 'luz', title: 'Conta de Energia', value: 238.45, dueDay: Math.max(1, day - 2), category: 'casa', status: 'Pendente' },
        { id: 'net', title: 'Internet Fibra', value: 119.9, dueDay: Math.min(28, day + 5), category: 'casa', status: 'Pendente' },
      ],
      subscriptions: [
        { id: 'n1', name: 'Netflix', price: 55.9, dueDay: 15, service: 'netflix' },
        { id: 's1', name: 'Spotify', price: 27.9, dueDay: 5, service: 'spotify' },
      ],
      categoryBudgets: [
        { id: 'alimentacao', name: 'Alimentação', limit: 700, spent: 0, color: '#f97316', background: '#FFEDD5' },
        { id: 'lazer', name: 'Lazer', limit: 300, spent: 0, color: '#8b5cf6', background: '#F3E8FF' },
      ],
      piggyBanks: [],
    });
    assert.equal(onb.status, 200);

    // Endpoints protegidos exigem token
    const noAuth = await fetch(`${srv.baseUrl}/transactions`);
    assert.equal(noAuth.status, 401);

    // PUT em lote: espelha a lista do cliente (salário + gastos do mês)
    const seed = [
      { kind: 'receita', amount: 1800, date: thisDay(5), description: 'Salário', category: 'salario', method: 'deposito', impulse: false },
      { kind: 'despesa', amount: 342.45, date: thisDay(2), description: 'Supermercado', category: 'alimentacao', method: 'debito', impulse: false },
      { kind: 'despesa', amount: 180, date: thisDay(11), description: 'Posto de gasolina', category: 'transporte', method: 'debito', impulse: false },
      { kind: 'despesa', amount: 58.9, date: thisDay(9), description: 'iFood · Pizza', category: 'alimentacao', method: 'credito', impulse: true },
    ];
    const put = await post('/transactions', { items: seed }, 'PUT');
    assert.equal(put.status, 200);

    const list = await (await fetch(`${srv.baseUrl}/transactions`, { headers: auth })).json() as { items: { id: string }[] };
    assert.equal(list.items.length, 4);

    // Summary: entradas, saídas e saldo batem com a soma
    const summary = await (
      await fetch(`${srv.baseUrl}/dashboard/summary?month=${thisMonth()}`, { headers: auth })
    ).json() as {
      income: number; expense: number; balance: number; savingsRate: number;
      categories: { id: string; used: number; status: string }[];
      alerts: { categoryId: string; status: string; message: string }[];
    };
    assert.equal(summary.income, 1800);
    assert.ok(Math.abs(summary.expense - 581.35) < 0.01);
    assert.ok(Math.abs(summary.balance - 1218.65) < 0.01);
    const food = summary.categories.find((c) => c.id === 'alimentacao');
    assert.ok(food);
    assert.ok(Math.abs(food.used - 401.35 / 700) < 0.01);
    assert.equal(food.status, 'ok');
    assert.equal(summary.alerts.length, 0);

    // POST sem categoria: auto-categoriza "iFood" como alimentação e dispara o alerta de 80%
    const auto = await post('/transactions', {
      kind: 'despesa', amount: 200, date: thisDay(12), description: 'iFood · Hambúrguer', method: 'credito', impulse: true,
    });
    assert.equal(auto.status, 201);
    const autoBody = (await auto.json()) as {
      item: { category: string };
      autoCategorized: boolean;
      limitAlert: { status: string; message: string; used: number } | null;
    };
    assert.equal(autoBody.item.category, 'alimentacao');
    assert.equal(autoBody.autoCategorized, true);
    assert.ok(autoBody.limitAlert);
    assert.equal(autoBody.limitAlert.status, 'warn');
    assert.match(autoBody.limitAlert.message, /Alimentação passou de 80% do limite/);
    assert.match(autoBody.limitAlert.message, /Sobrou R\$ 98/);

    // Summary agora tem o alerta de 80% na categoria
    const summary2 = await (
      await fetch(`${srv.baseUrl}/dashboard/summary?month=${thisMonth()}`, { headers: auth })
    ).json() as { alerts: { categoryId: string; status: string }[] };
    assert.equal(summary2.alerts.length, 1);
    assert.equal(summary2.alerts[0]?.categoryId, 'alimentacao');

    // Evolução mensal
    const evo = await (
      await fetch(`${srv.baseUrl}/dashboard/evolution?months=3`, { headers: auth })
    ).json() as { months: { key: string; income: number; expense: number; balance: number }[] };
    assert.equal(evo.months.length, 3);
    const last = evo.months[evo.months.length - 1];
    assert.equal(last.key, thisMonth());
    assert.equal(last.income, 1800);

    // Boletos com dias para vencimento calculados
    const bills = await (await fetch(`${srv.baseUrl}/bills`, { headers: auth })).json() as {
      items: { title: string; daysUntilDue: number; label: string; code: string }[];
    };
    assert.equal(bills.items.length, 2);
    const energy = bills.items.find((b) => b.title === 'Conta de Energia');
    assert.ok(energy);
    const expDue1 = Math.max(1, day - 2) - day;
    assert.equal(energy.daysUntilDue, expDue1);
    assert.equal(energy.code, expDue1 < 0 ? 'overdue' : expDue1 === 0 ? 'today' : 'pending');
    const fiber = bills.items.find((b) => b.title === 'Internet Fibra');
    assert.ok(fiber);
    const expDue2 = Math.min(28, day + 5) - day;
    assert.equal(fiber.daysUntilDue, expDue2);
    assert.equal(fiber.code, expDue2 < 0 ? 'overdue' : expDue2 === 0 ? 'today' : 'pending');

    // Assinaturas: custo mensal e projeção anual
    const subs = await (await fetch(`${srv.baseUrl}/subscriptions`, { headers: auth })).json() as {
      monthlyTotal: number; yearlyTotal: number; count: number;
    };
    assert.equal(subs.count, 2);
    assert.ok(Math.abs(subs.monthlyTotal - 83.8) < 0.01);
    assert.ok(Math.abs(subs.yearlyTotal - 1005.6) < 0.01);

    // Editar e excluir uma transação
    const toEdit = list.items[0];
    const edited = await post(`/transactions/${toEdit.id}`, {
      kind: 'despesa', amount: 400, date: thisDay(2), description: 'Supermercado atacarejo', category: 'alimentacao', method: 'debito', impulse: false,
    }, 'PUT');
    assert.equal(edited.status, 200);
    const del = await fetch(`${srv.baseUrl}/transactions/${toEdit.id}`, { method: 'DELETE', headers: auth });
    assert.equal(del.status, 204);
    const after = await (await fetch(`${srv.baseUrl}/transactions`, { headers: auth })).json() as { items: unknown[] };
    assert.equal(after.items.length, 4);
  } finally {
    await srv.close();
  }
});
