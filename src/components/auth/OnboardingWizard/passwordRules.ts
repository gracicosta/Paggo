/** Regras mínimas da senha (as mesmas que o back-end deve validar depois). */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'Pelo menos uma letra', test: (p: string) => /[A-Za-zÀ-ÿ]/.test(p) },
  { id: 'number', label: 'Pelo menos um número', test: (p: string) => /\d/.test(p) },
] as const;

export const isPasswordValid = (password: string, confirm: string) =>
  PASSWORD_RULES.every((r) => r.test(password)) && password === confirm;
