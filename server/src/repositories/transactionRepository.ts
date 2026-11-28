import { Prisma, PrismaClient } from '@prisma/client';
import { CATEGORY_NAMES, resolveCategorySlug, type TransactionKindApi } from '../utils/categorize.js';

/**
 * Transação no formato da API (o mesmo do front: src/types/transactions.ts).
 * `category` é o slug ('alimentacao', 'transporte'…), não o id do banco.
 */
export interface StoredTransaction {
  id: string;
  kind: TransactionKindApi;
  /** Valor sempre positivo, em reais. O sinal vem de `kind`. */
  amount: number;
  /** Data no formato aaaa-mm-dd. */
  date: string;
  description: string;
  category: string;
  method: 'pix' | 'debito' | 'credito' | 'dinheiro' | 'boleto' | 'deposito';
  impulse: boolean;
}

export type TransactionInput = Omit<StoredTransaction, 'id'>;

export interface TransactionStore {
  list(userId: string, month?: string): Promise<StoredTransaction[]>;
  /** Substitui a lista inteira (espelho da lista do cliente — mesmo papel do saveTransactions local). */
  replaceAll(userId: string, items: Array<TransactionInput & { id?: string }>): Promise<StoredTransaction[]>;
  create(userId: string, input: TransactionInput): Promise<StoredTransaction>;
  update(userId: string, id: string, input: TransactionInput): Promise<StoredTransaction | null>;
  remove(userId: string, id: string): Promise<boolean>;
}

const DEFAULT_COLORS: Record<string, string> = {
  alimentacao: '#f97316', transporte: '#eab308', casa: '#ef4444', saude: '#ec4899',
  lazer: '#8b5cf6', educacao: '#3b82f6', despesasPessoais: '#d946ef', assinaturas: '#e11d48',
  outros: '#0f766e', salario: '#10b981', extra: '#14b8a6', outrasEntradas: '#0ea5e9',
};

/**
 * Datas são gravadas ao meio-dia UTC para a leitura por toISOString().slice(0,10)
 * devolver sempre o mesmo dia, em qualquer fuso do servidor.
 */
const toDbDate = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
const toApiDate = (date: Date) => date.toISOString().slice(0, 10);

type PrismaTransactionRow = Prisma.TransactionGetPayload<{ include: { category: true } }>;

function mapRow(row: PrismaTransactionRow): StoredTransaction {
  return {
    id: row.id,
    kind: row.kind,
    amount: Number(row.amount),
    date: toApiDate(row.date),
    description: row.description,
    category: row.category?.slug ?? 'outros',
    method: row.method,
    impulse: row.impulse,
  };
}

export class PrismaTransactionStore implements TransactionStore {
  constructor(private readonly prisma: PrismaClient) {}

  /** Garante uma linha em Category para o slug (limite 0 quando criada pelo lançamento). */
  private async categoryId(userId: string, slug: string): Promise<string | null> {
    if (!CATEGORY_NAMES[slug]) return null;
    const cat = await this.prisma.category.upsert({
      where: { userId_slug: { userId, slug } },
      update: {},
      create: {
        userId,
        slug,
        name: CATEGORY_NAMES[slug],
        monthlyLimit: 0,
        color: DEFAULT_COLORS[slug] ?? '#7c3aed',
        background: `${DEFAULT_COLORS[slug] ?? '#7c3aed'}22`,
      },
    });
    return cat.id;
  }

  private async primaryAccountId(userId: string): Promise<string | null> {
    const account = await this.prisma.account.findFirst({ where: { userId } });
    return account?.id ?? null;
  }

  async list(userId: string, month?: string): Promise<StoredTransaction[]> {
    const where: Prisma.TransactionWhereInput = { userId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
    }
    const rows = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async replaceAll(userId: string, items: Array<TransactionInput & { id?: string }>): Promise<StoredTransaction[]> {
    const accountId = await this.primaryAccountId(userId);
    const slugs = [...new Set(items.map((t) => t.category))];
    const ids = new Map<string, string | null>();
    for (const slug of slugs) ids.set(slug, await this.categoryId(userId, slug));

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } });
      if (items.length) {
        await tx.transaction.createMany({
          data: items.map((t) => ({
            userId,
            accountId,
            categoryId: ids.get(t.category) ?? null,
            kind: t.kind,
            amount: t.amount,
            date: toDbDate(t.date),
            description: t.description,
            method: t.method,
            impulse: t.impulse,
          })),
        });
      }
    });
    return this.list(userId);
  }

  async create(userId: string, input: TransactionInput): Promise<StoredTransaction> {
    const row = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: await this.primaryAccountId(userId),
        categoryId: await this.categoryId(userId, input.category),
        kind: input.kind,
        amount: input.amount,
        date: toDbDate(input.date),
        description: input.description,
        method: input.method,
        impulse: input.impulse,
      },
      include: { category: true },
    });
    return mapRow(row);
  }

  async update(userId: string, id: string, input: TransactionInput): Promise<StoredTransaction | null> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return null;
    const row = await this.prisma.transaction.update({
      where: { id: existing.id },
      data: {
        categoryId: await this.categoryId(userId, input.category),
        kind: input.kind,
        amount: input.amount,
        date: toDbDate(input.date),
        description: input.description,
        method: input.method,
        impulse: input.impulse,
      },
      include: { category: true },
    });
    return mapRow(row);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }
}

/** Repositório em memória para testes automatizados e execução sem PostgreSQL. */
export class InMemoryTransactionStore implements TransactionStore {
  private readonly byUser = new Map<string, StoredTransaction[]>();
  private seq = 1;

  async list(userId: string, month?: string): Promise<StoredTransaction[]> {
    const items = this.byUser.get(userId) ?? [];
    const filtered = month ? items.filter((t) => t.date.startsWith(month)) : items;
    return [...filtered].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  }

  async replaceAll(userId: string, items: Array<TransactionInput & { id?: string }>): Promise<StoredTransaction[]> {
    const stamped = items.map((t, i) => ({ ...t, id: t.id || `tx_mem_${this.seq++}_${i}` }));
    this.byUser.set(userId, stamped);
    return this.list(userId);
  }

  async create(userId: string, input: TransactionInput): Promise<StoredTransaction> {
    const item: StoredTransaction = {
      ...input,
      category: resolveCategorySlug(input.category, input.description, input.kind),
      id: `tx_mem_${this.seq++}`,
    };
    this.byUser.set(userId, [item, ...(this.byUser.get(userId) ?? [])]);
    return item;
  }

  async update(userId: string, id: string, input: TransactionInput): Promise<StoredTransaction | null> {
    const items = this.byUser.get(userId) ?? [];
    const idx = items.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const updated: StoredTransaction = {
      ...input,
      category: resolveCategorySlug(input.category, input.description, input.kind),
      id,
    };
    items[idx] = updated;
    return updated;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const items = this.byUser.get(userId) ?? [];
    const next = items.filter((t) => t.id !== id);
    if (next.length === items.length) return false;
    this.byUser.set(userId, next);
    return true;
  }
}
