import type { IconType } from 'react-icons';
import {
  FaBox,
  FaBriefcase,
  FaCarSide,
  FaCoins,
  FaGamepad,
  FaGraduationCap,
  FaHeartPulse,
  FaHouse,
  FaMoneyBillWave,
  FaTv,
  FaUser,
  FaUtensils,
  FaPix,
} from 'react-icons/fa6';
import { LuBanknote, LuBarcode, LuCreditCard, LuLandmark } from 'react-icons/lu';
import type { PaymentMethod, TransactionKind } from '../types/transactions';

export interface TransactionCategory {
  id: string;
  label: string;
  kind: TransactionKind;
  icon: IconType;
  /** Cor da paleta padrão (as paletas de daltonismo trocam pela posição na lista). */
  color: string;
}

/**
 * As despesas usam os mesmos ids dos limites por categoria (DEFAULT_CATEGORIES),
 * para o gasto de cada transação contar no limite certo.
 */
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  { id: 'alimentacao', label: 'Alimentação', kind: 'despesa', icon: FaUtensils, color: '#f97316' },
  { id: 'transporte', label: 'Transporte', kind: 'despesa', icon: FaCarSide, color: '#eab308' },
  { id: 'casa', label: 'Casa', kind: 'despesa', icon: FaHouse, color: '#ef4444' },
  { id: 'saude', label: 'Saúde', kind: 'despesa', icon: FaHeartPulse, color: '#ec4899' },
  { id: 'lazer', label: 'Lazer', kind: 'despesa', icon: FaGamepad, color: '#8b5cf6' },
  { id: 'educacao', label: 'Educação', kind: 'despesa', icon: FaGraduationCap, color: '#3b82f6' },
  { id: 'despesasPessoais', label: 'Compras', kind: 'despesa', icon: FaUser, color: '#d946ef' },
  { id: 'assinaturas', label: 'Assinaturas', kind: 'despesa', icon: FaTv, color: '#e11d48' },
  { id: 'outros', label: 'Outros', kind: 'despesa', icon: FaBox, color: '#0f766e' },
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  { id: 'salario', label: 'Salário', kind: 'receita', icon: FaBriefcase, color: '#10b981' },
  { id: 'extra', label: 'Renda extra', kind: 'receita', icon: FaMoneyBillWave, color: '#14b8a6' },
  { id: 'outrasEntradas', label: 'Outras entradas', kind: 'receita', icon: FaCoins, color: '#0ea5e9' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const FALLBACK: TransactionCategory = { id: 'outros', label: 'Outros', kind: 'despesa', icon: FaBox, color: '#0f766e' };

export const categoryById = (id: string) => ALL_CATEGORIES.find((c) => c.id === id) ?? FALLBACK;

/** Posição da categoria na lista, usada para escolher a cor nas paletas de daltonismo. */
export const categoryIndex = (id: string) =>
  Math.max(
    0,
    ALL_CATEGORIES.findIndex((c) => c.id === id),
  );

/** Formas de pagamento, cada uma com ícone e cor para o menu "Como pagou?". */
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: IconType; color: string }[] = [
  { id: 'pix', label: 'Pix', icon: FaPix, color: '#14b8a6' },
  { id: 'debito', label: 'Cartão de débito', icon: LuCreditCard, color: '#3b82f6' },
  { id: 'credito', label: 'Cartão de crédito', icon: LuCreditCard, color: '#8b5cf6' },
  { id: 'dinheiro', label: 'Dinheiro', icon: LuBanknote, color: '#16a34a' },
  { id: 'boleto', label: 'Boleto', icon: LuBarcode, color: '#f97316' },
  { id: 'deposito', label: 'Depósito', icon: LuLandmark, color: '#0ea5e9' },
];

export const methodLabel = (id: PaymentMethod) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

/**
 * Categorização automática por palavras-chave da descrição — o mesmo mapa do servidor
 * (server/src/utils/categorize.ts), para a sugestão aparecer enquanto a pessoa digita.
 */
const EXPENSE_KEYWORDS: Array<[string, string[]]> = [
  ['assinaturas', ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'youtube premium', 'globoplay', 'deezer', 'icloud', 'chatgpt', 'assinatura', 'gympass', 'wellhub']],
  ['educacao', ['faculdade', 'especializa', 'curso', 'escola', 'udemy', 'alura', 'livro', 'cursinho']],
  ['saude', ['farmácia', 'farmacia', 'dentista', 'médico', 'medico', 'consulta', 'exame', 'remédio', 'remedio', 'hospital', 'plano de saúde', 'plano de saude', 'psicólogo', 'psicologo', 'terapia', 'academia']],
  ['casa', ['aluguel', 'condomínio', 'condominio', 'energia', 'enel', 'conta de luz', 'água', 'agua', 'saneamento', 'internet', 'fibra', 'wifi', 'gás', 'iptu', 'reforma', 'limpeza']],
  ['transporte', ['uber', '99', 'posto', 'gasolina', 'combustível', 'combustivel', 'metro', 'metrô', 'ônibus', 'onibus', 'estacionamento', 'pedágio', 'pedagio', 'taxi', 'táxi', 'passagem', 'bilhete']],
  ['lazer', ['cinema', 'show', 'jogo', 'passeio', 'viagem', 'parque', 'teatro', 'festa', 'ingresso', 'steam', 'barzinho']],
  ['despesasPessoais', ['roupa', 'camiseta', 'tênis', 'tenis', 'shopping', 'shein', 'fone', 'celular', 'presente', 'cabelo', 'salão', 'salao', 'barbeiro', 'cosmético', 'cosmetico', 'sapato']],
  ['alimentacao', ['ifood', 'pizza', 'hambúrguer', 'hamburguer', 'restaurante', 'mercado', 'supermercado', 'padaria', 'feira', 'lanche', 'comida', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'açaí', 'acai', 'delivery', 'rappi', 'sorvete', 'açougue', 'acougue', 'burger', 'mcdonald', 'sushi']],
];

const INCOME_KEYWORDS: Array<[string, string[]]> = [
  ['salario', ['salário', 'salario', 'pagamento', 'holerite', 'pró-labore', 'pro-labore', 'pro labore']],
  ['extra', ['freela', 'freelance', 'bico', 'extra', 'comissão', 'comissao', 'venda', 'reembolso', 'cashback']],
];

/** Sugere a categoria pela descrição; devolve '' quando nenhuma palavra-chave bate. */
export function suggestCategory(description: string, kind: TransactionKind): string {
  const text = ` ${description.toLowerCase()} `;
  const table = kind === 'receita' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  for (const [slug, keywords] of table) {
    if (keywords.some((k) => text.includes(k))) return slug;
  }
  return '';
}
