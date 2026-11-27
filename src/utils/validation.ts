/** Validações simples reaproveitadas pelos formulários (login e cadastro). */
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
