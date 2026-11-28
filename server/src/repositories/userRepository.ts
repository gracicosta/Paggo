import { Prisma, PrismaClient } from '@prisma/client';
import { DEMO_EMAIL, DEMO_PROFILE, DEMO_USER_ID } from '../data/demoSeed.js';
import type { PublicAuthUser, StoredUserRecord, UserFinancialProfile } from '../types/domain.js';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string | null;
  provider: 'email' | 'google';
  googleSub?: string | null;
  cpfEncrypted?: string | null;
  cpfHash?: string | null;
  birthDateEncrypted?: string | null;
  termsAcceptedAt?: Date | null;
}

export interface UserStore {
  checkHealth(): Promise<'connected' | 'disconnected'>;
  findById(id: string): Promise<StoredUserRecord | null>;
  findByEmail(email: string): Promise<StoredUserRecord | null>;
  findByCpfHash(cpfHash: string): Promise<StoredUserRecord | null>;
  createUser(input: CreateUserInput): Promise<StoredUserRecord>;
  saveOnboardingProfile(userId: string, profile: UserFinancialProfile): Promise<StoredUserRecord>;
  upsertDemoUser(): Promise<StoredUserRecord>;
}

export function toPublicUser(record: StoredUserRecord): PublicAuthUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    isConfigured: record.isConfigured,
    provider: record.provider,
    plan: record.plan,
    termsAcceptedAt: record.termsAcceptedAt,
    profile: record.profile,
  };
}

function emptyProfile(): UserFinancialProfile {
  return {
    salary: 0,
    extraIncome: 0,
    fixedBills: [],
    subscriptions: [],
    categoryBudgets: [],
    piggyBanks: [],
  };
}

type PrismaUserRow = Prisma.UserGetPayload<{ include: { categories: true } }>;

function mapPrismaUser(row: PrismaUserRow): StoredUserRecord {
  const categoryBudgets = row.categories.map((cat) => ({
    id: cat.slug,
    name: cat.name,
    limit: Number(cat.monthlyLimit),
    spent: 0,
    color: cat.color,
    background: cat.background,
  }));

  const onboardingAnswers = row.onboardingAnswers
    ? (row.onboardingAnswers as unknown as UserFinancialProfile['onboarding'])
    : undefined;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    provider: row.provider,
    googleSub: row.googleSub,
    cpfEncrypted: row.cpfEncrypted,
    cpfHash: row.cpfHash,
    birthDateEncrypted: row.birthDateEncrypted,
    termsAcceptedAt: row.termsAcceptedAt ? row.termsAcceptedAt.toISOString() : undefined,
    isConfigured: row.isConfigured,
    plan: row.plan,
    profile: {
      salary: Number(row.salary),
      extraIncome: Number(row.extraIncome),
      fixedBills: (row.fixedBills as unknown as UserFinancialProfile['fixedBills']) ?? [],
      subscriptions: (row.subscriptions as unknown as UserFinancialProfile['subscriptions']) ?? [],
      categoryBudgets,
      piggyBanks: (row.piggyBanks as unknown as UserFinancialProfile['piggyBanks']) ?? [],
      ...(onboardingAnswers ? { onboarding: onboardingAnswers } : {}),
    },
  };
}

export class PrismaUserStore implements UserStore {
  constructor(private readonly prisma: PrismaClient) {}

  async checkHealth(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  async findById(id: string): Promise<StoredUserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: { categories: true },
    });
    return row ? mapPrismaUser(row) : null;
  }

  async findByEmail(email: string): Promise<StoredUserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { categories: true },
    });
    return row ? mapPrismaUser(row) : null;
  }

  async findByCpfHash(cpfHash: string): Promise<StoredUserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { cpfHash },
      include: { categories: true },
    });
    return row ? mapPrismaUser(row) : null;
  }

  async createUser(input: CreateUserInput): Promise<StoredUserRecord> {
    const row = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash ?? null,
        provider: input.provider,
        googleSub: input.googleSub ?? null,
        cpfEncrypted: input.cpfEncrypted ?? null,
        cpfHash: input.cpfHash ?? null,
        birthDateEncrypted: input.birthDateEncrypted ?? null,
        termsAcceptedAt: input.termsAcceptedAt ?? null,
        accounts: {
          create: {
            name: 'Conta principal',
            type: 'checking',
            balance: 0,
          },
        },
      },
      include: { categories: true },
    });
    return mapPrismaUser(row);
  }

  async saveOnboardingProfile(userId: string, profile: UserFinancialProfile): Promise<StoredUserRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.category.deleteMany({ where: { userId } });

      if (profile.categoryBudgets.length > 0) {
        await tx.category.createMany({
          data: profile.categoryBudgets.map((cat) => ({
            userId,
            slug: cat.id,
            name: cat.name,
            monthlyLimit: cat.limit,
            color: cat.color,
            background: cat.background,
          })),
        });
      }

      const initialBalance = Number(profile.salary || 0) + Number(profile.extraIncome || 0);
      const primaryAccount = await tx.account.findFirst({ where: { userId } });
      if (primaryAccount) {
        await tx.account.update({
          where: { id: primaryAccount.id },
          data: { balance: initialBalance },
        });
      } else {
        await tx.account.create({
          data: {
            userId,
            name: 'Conta principal',
            type: 'checking',
            balance: initialBalance,
          },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          isConfigured: true,
          salary: profile.salary,
          extraIncome: profile.extraIncome,
          fixedBills: profile.fixedBills as unknown as Prisma.InputJsonValue,
          subscriptions: profile.subscriptions as unknown as Prisma.InputJsonValue,
          piggyBanks: profile.piggyBanks as unknown as Prisma.InputJsonValue,
          onboardingAnswers: profile.onboarding
            ? (profile.onboarding as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        include: { categories: true },
      });
    });

    return mapPrismaUser(row);
  }

  async upsertDemoUser(): Promise<StoredUserRecord> {
    const existing = await this.findById(DEMO_USER_ID);
    if (existing) return existing;

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: DEMO_USER_ID },
        update: {
          name: 'Carlos Oliveira',
          email: DEMO_EMAIL,
          isConfigured: true,
          salary: DEMO_PROFILE.salary,
          extraIncome: DEMO_PROFILE.extraIncome,
          fixedBills: DEMO_PROFILE.fixedBills as unknown as Prisma.InputJsonValue,
          subscriptions: DEMO_PROFILE.subscriptions as unknown as Prisma.InputJsonValue,
          piggyBanks: DEMO_PROFILE.piggyBanks as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: DEMO_USER_ID,
          name: 'Carlos Oliveira',
          email: DEMO_EMAIL,
          provider: 'email',
          isConfigured: true,
          salary: DEMO_PROFILE.salary,
          extraIncome: DEMO_PROFILE.extraIncome,
          fixedBills: DEMO_PROFILE.fixedBills as unknown as Prisma.InputJsonValue,
          subscriptions: DEMO_PROFILE.subscriptions as unknown as Prisma.InputJsonValue,
          piggyBanks: DEMO_PROFILE.piggyBanks as unknown as Prisma.InputJsonValue,
          accounts: {
            create: {
              name: 'Conta principal',
              type: 'checking',
              balance: DEMO_PROFILE.salary + DEMO_PROFILE.extraIncome,
            },
          },
        },
      });

      await tx.category.deleteMany({ where: { userId: DEMO_USER_ID } });
      await tx.category.createMany({
        data: DEMO_PROFILE.categoryBudgets.map((cat) => ({
          userId: DEMO_USER_ID,
          slug: cat.id,
          name: cat.name,
          monthlyLimit: cat.limit,
          color: cat.color,
          background: cat.background,
        })),
      });

      return tx.user.findUniqueOrThrow({
        where: { id: DEMO_USER_ID },
        include: { categories: true },
      });
    });

    return mapPrismaUser(row);
  }
}

/**
 * Repositório em memória exclusivo para testes automatizados e execução sem PostgreSQL ativo.
 */
export class InMemoryUserStore implements UserStore {
  private readonly users = new Map<string, StoredUserRecord>();
  private seq = 1;

  async checkHealth(): Promise<'connected' | 'disconnected'> {
    return 'connected';
  }

  async findById(id: string): Promise<StoredUserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<StoredUserRecord | null> {
    const clean = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === clean) return user;
    }
    return null;
  }

  async findByCpfHash(cpfHash: string): Promise<StoredUserRecord | null> {
    for (const user of this.users.values()) {
      if (user.cpfHash === cpfHash) return user;
    }
    return null;
  }

  async createUser(input: CreateUserInput): Promise<StoredUserRecord> {
    const record: StoredUserRecord = {
      id: `usr_mem_${this.seq++}`,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash ?? null,
      provider: input.provider,
      googleSub: input.googleSub ?? null,
      cpfEncrypted: input.cpfEncrypted ?? null,
      cpfHash: input.cpfHash ?? null,
      birthDateEncrypted: input.birthDateEncrypted ?? null,
      termsAcceptedAt: input.termsAcceptedAt ? input.termsAcceptedAt.toISOString() : undefined,
      isConfigured: false,
      plan: 'free',
      profile: emptyProfile(),
    };
    this.users.set(record.id, record);
    return record;
  }

  async saveOnboardingProfile(userId: string, profile: UserFinancialProfile): Promise<StoredUserRecord> {
    const current = this.users.get(userId);
    if (!current) {
      throw new Error('Usuário não encontrado.');
    }
    const updated: StoredUserRecord = {
      ...current,
      isConfigured: true,
      profile,
    };
    this.users.set(userId, updated);
    return updated;
  }

  async upsertDemoUser(): Promise<StoredUserRecord> {
    const existing = this.users.get(DEMO_USER_ID);
    if (existing) return existing;

    const demo: StoredUserRecord = {
      id: DEMO_USER_ID,
      name: 'Carlos Oliveira',
      email: DEMO_EMAIL,
      provider: 'email',
      isConfigured: true,
      plan: 'free',
      profile: structuredClone(DEMO_PROFILE),
    };
    this.users.set(DEMO_USER_ID, demo);
    return demo;
  }
}
