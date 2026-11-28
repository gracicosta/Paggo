import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import type { AnonymizedAiFinancialContext, StoredUserRecord, UserFinancialProfile } from '../types/domain.js';

const AES_ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const BCRYPT_ROUNDS = 10;

function deriveAesKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Criptografa dados pessoais sensíveis (ex.: CPF, data de nascimento) em repouso
 * usando AES-256-GCM autenticado (LGPD).
 */
export function encryptSensitive(plaintext: string, secret = env.lgpdEncryptionKey): string {
  const key = deriveAesKey(secret);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(AES_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitive(payload: string, secret = env.lgpdEncryptionKey): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Payload criptografado inválido.');
  }
  const [ivHex, tagHex, dataHex] = parts;
  const key = deriveAesKey(secret);
  const decipher = crypto.createDecipheriv(AES_ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Índice cego determinístico (HMAC-SHA256) para checar unicidade de CPF sem
 * armazenar nem consultar o número em texto puro.
 */
export function hashIdentifier(value: string, secret = env.lgpdHashSecret): string {
  const normalized = value.replace(/\D/g, '');
  return crypto.createHmac('sha256', secret).update(normalized, 'utf8').digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Regra estrita de LGPD: remove qualquer dado identificável (nome, e-mail, CPF,
 * data de nascimento, IDs internos) antes de enviar contexto financeiro para a IA.
 */
export function sanitizeForAi(
  user: Pick<StoredUserRecord, 'plan' | 'profile'>,
  overrideProfile?: UserFinancialProfile,
): AnonymizedAiFinancialContext {
  const profile = overrideProfile ?? user.profile;
  const monthlyIncome = Number(profile.salary || 0) + Number(profile.extraIncome || 0);
  const fixedBillsTotal = (profile.fixedBills ?? []).reduce((sum, bill) => sum + Number(bill.value || 0), 0);
  const subscriptionsTotal = (profile.subscriptions ?? []).reduce((sum, sub) => sum + Number(sub.price || 0), 0);

  return {
    plan: user.plan,
    monthlyIncome,
    fixedBillsTotal,
    subscriptionsTotal,
    categories: (profile.categoryBudgets ?? []).map((cat) => ({
      category: cat.name,
      monthlyLimit: Number(cat.limit || 0),
      spent: Number(cat.spent || 0),
    })),
    piggyBanks: (profile.piggyBanks ?? []).map((pb) => {
      const goal = Number(pb.goalAmount || 0);
      const saved = Number(pb.savedAmount || 0);
      return {
        goalAmount: goal,
        savedAmount: saved,
        progressPct: goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0,
      };
    }),
  };
}
