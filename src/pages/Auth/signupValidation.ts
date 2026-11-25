/**
 * Regras de validação da tela de cadastro.
 * Ficam separadas da tela para o back-end (Node.js) poder usar as mesmas regras depois.
 */

/* ------------------------------ Senha ------------------------------ */

export const PASSWORD_RULES = [
  { id: 'length', label: '8 caracteres ou mais', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'Uma letra', test: (p: string) => /[A-Za-zÀ-ÿ]/.test(p) },
  { id: 'number', label: 'Um número', test: (p: string) => /\d/.test(p) },
] as const;

export const isPasswordValid = (password: string) => PASSWORD_RULES.every((r) => r.test(password));

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  level: StrengthLevel;
  label: string;
  tone: 'none' | 'weak' | 'medium' | 'strong';
}

/**
 * Força da senha em 4 barrinhas: 1 ponto para cada regra obrigatória
 * e 1 ponto extra para símbolo (ou 12+ caracteres).
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: '', tone: 'none' };
  const required = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const bonus = /[^A-Za-zÀ-ÿ0-9]/.test(password) || password.length >= 12 ? 1 : 0;
  const level = Math.min(4, required + (required === 3 ? bonus : 0)) as StrengthLevel;

  if (level <= 2) return { level: Math.max(1, level) as StrengthLevel, label: 'Fraca: siga as dicas abaixo', tone: 'weak' };
  if (level === 3) return { level, label: 'Média: coloque um símbolo para ficar forte', tone: 'medium' };
  return { level, label: 'Forte: ótima senha!', tone: 'strong' };
}

/* ------------------------------- Nome ------------------------------ */

export const normalizeName = (value: string) => value.replace(/\s+/g, ' ').trim();

export function validateFullName(value: string): string | null {
  const name = normalizeName(value);
  if (!name) return 'Digite seu nome completo.';
  if (!/^[A-Za-zÀ-ÿ' -]+$/.test(name)) return 'Use só letras no nome.';
  const parts = name.split(' ').filter((p) => p.length > 0);
  if (parts.length < 2 || name.length < 5) {
    return 'Digite nome e sobrenome, como no seu documento.';
  }
  return null;
}

/* -------------------------------- CPF ------------------------------ */

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Máscara 000.000.000-00 enquanto a pessoa digita. */
export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/** Confere os dois dígitos verificadores do CPF (algoritmo oficial da Receita). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function validateCpf(value: string): string | null {
  const digits = onlyDigits(value);
  if (!digits) return 'Digite seu CPF.';
  if (digits.length < 11) return 'O CPF tem 11 números. Confere se faltou algum?';
  if (!isValidCpf(digits)) return 'Esse CPF não parece certo. Confere os números?';
  return null;
}

/* ------------------------- Data de nascimento ---------------------- */

export const MIN_AGE = 18;

/** Máscara dd/mm/aaaa enquanto a pessoa digita. */
export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

/** Converte dd/mm/aaaa em Date (ou null se a data não existir, ex.: 31/02). */
export function parseBirthDate(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function ageOn(birth: Date, today = new Date()): number {
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function validateBirthDate(value: string, today = new Date()): string | null {
  if (!value) return 'Digite sua data de nascimento.';
  if (onlyDigits(value).length < 8) return 'Use o formato dia/mês/ano, por exemplo 14/03/1990.';
  const date = parseBirthDate(value);
  if (!date) return 'Essa data não existe. Confere o dia e o mês?';
  if (date > today) return 'A data de nascimento não pode ser no futuro.';
  const age = ageOn(date, today);
  if (age < MIN_AGE) return 'O app é para maiores de 18 anos.';
  if (age > 120) return 'Confere o ano de nascimento?';
  return null;
}

/** dd/mm/aaaa → aaaa-mm-dd (formato que vai para o banco de dados). */
export function toIsoDate(value: string): string {
  const date = parseBirthDate(value);
  if (!date) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
