/**
 * Nomes de meses/dias e contas com datas, compartilhados pelo painel, Transações,
 * seletores de mês (topo e onboarding) e calendário de dias.
 * As datas ficam sempre no horário local (sem passar por UTC, para não "voltar um dia").
 */

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** "janeiro", "fevereiro"… */
export const MONTHS_LOWER = MONTH_NAMES.map((m) => m.toLowerCase());

/** "Jan", "Fev"… */
export const MONTHS_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

/** "jan", "fev"… */
export const MONTHS_SHORT_LOWER = MONTHS_LOWER.map((m) => m.slice(0, 3));

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WEEKDAYS_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const two = (n: number) => String(n).padStart(2, '0');

/** Date → "aaaa-mm-dd". */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

/** (2026, 10) → "2026-11" (mês começando em 0, como no Date). */
export const toIsoMonth = (year: number, month0: number) => `${year}-${two(month0 + 1)}`;

/** "aaaa-mm-dd" → Date local. */
export const fromIsoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** "aaaa-mm" → { y, m } com o mês começando em 0. */
export const parseIsoMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return { y, m: m - 1 };
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Soma meses mantendo o dia (31/jan + 1 mês = 28/fev). */
export const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};

/** Texto do seletor de mês do topo: "Novembro 2026". */
export const monthLabel = (d = new Date()) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

/** "novembro de 2026". */
export const monthName = (d: Date) => `${MONTHS_LOWER[d.getMonth()]} de ${d.getFullYear()}`;

/** "Novembro 2026" (do seletor do topo) → { y: 2026, m: 10 }. */
export function parseMonthLabel(label: string) {
  const [name, yearRaw] = label.split(' ');
  return { y: Number(yearRaw) || new Date().getFullYear(), m: Math.max(0, MONTH_NAMES.indexOf(name)) };
}

/** "Novembro 2026" → prefixo "2026-11", o mesmo para o mês anterior e os nomes em minúsculas. */
export function monthKeys(label: string) {
  const { y, m } = parseMonthLabel(label);
  const prev = m === 0 ? toIsoMonth(y - 1, 11) : toIsoMonth(y, m - 1);
  return { current: toIsoMonth(y, m), previous: prev, name: MONTHS_LOWER[m], prevName: MONTHS_LOWER[(m + 11) % 12] };
}
