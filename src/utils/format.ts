/**
 * Formatação de dinheiro e porcentagem usada em todas as telas
 * (antes cada página tinha a sua cópia de `brl` e `pct`).
 */

/** R$ 1.340,80 — `digits` casas decimais (padrão 2). */
export const brl = (value: number, digits = 2) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Saldo com sinal na frente: "− R$ 200,00" (o "R$ -200,00" do toLocaleString fica estranho). */
export const signedBrl = (value: number, digits = 2) => `${value < 0 ? '− ' : ''}${brl(Math.abs(value), digits)}`;

/** R$ 1.341 (arredondado, para resumos). */
export const brlInt = (value: number) => `R$ ${Math.round(value).toLocaleString('pt-BR')}`;

/** R$ 4,5 mil a partir de mil reais; abaixo disso, R$ 980. */
export const brlShort = (value: number) =>
  value >= 1000 ? `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : brl(value, 0);

/** 0.234 → "23%" (sempre positivo: o sinal aparece na seta ▲/▼ ao lado). */
export const pct = (value: number) => `${Math.round(Math.abs(value) * 100)}%`;

/** Para a busca: ignora acentos e maiúsculas. */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Centavos → texto do campo de valor: 4590 → "45,90". */
export const centsToText = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Campo de valor estilo caixa eletrônico: cada número digitado entra pela direita
 * (4 → 0,04 → 0,45 → 4,59). Recebe o texto do campo e devolve os centavos.
 */
export const typedCents = (text: string) => Number(text.replace(/\D/g, '').slice(0, 11) || 0);
