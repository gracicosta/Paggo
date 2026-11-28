/**
 * Categorização automática por palavras-chave da descrição.
 * Espelha as categorias do front (src/data/transactionCategories.ts):
 * despesas: alimentacao, transporte, casa, saude, lazer, educacao, despesasPessoais, assinaturas, outros
 * receitas: salario, extra, outrasEntradas
 */

export type TransactionKindApi = 'receita' | 'despesa';

/** Nome de exibição usado ao criar a categoria automaticamente no banco. */
export const CATEGORY_NAMES: Record<string, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  casa: 'Casa',
  saude: 'Saúde',
  lazer: 'Lazer',
  educacao: 'Educação',
  despesasPessoais: 'Compras',
  assinaturas: 'Assinaturas',
  outros: 'Outros',
  salario: 'Salário',
  extra: 'Renda extra',
  outrasEntradas: 'Outras entradas',
};

const EXPENSE_KEYWORDS: Array<[string, string[]]> = [
  ['assinaturas', ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'youtube premium', 'globoplay', 'deezer', 'icloud', 'chatgpt', 'assinatura', 'mensalidade app', 'gympass', 'wellhub']],
  ['educacao', ['faculdade', 'especializa', 'curso', 'escola', 'mensalidade escolar', 'udemy', 'alura', 'livro', 'cursinho']],
  ['saude', ['farmácia', 'farmacia', 'dentista', 'médico', 'medico', 'consulta', 'exame', 'remédio', 'remedio', 'hospital', 'plano de saúde', 'plano de saude', 'psicólogo', 'psicologo', 'terapia', 'academia']],
  ['casa', ['aluguel', 'condomínio', 'condominio', 'energia', 'enel', 'conta de luz', 'luz', 'água', 'agua', 'saneamento', 'internet', 'fibra', 'wifi', 'gás', 'iptu', 'reforma', 'limpeza']],
  ['transporte', ['uber', '99', 'posto', 'gasolina', 'combustível', 'combustivel', 'metro', 'metrô', 'ônibus', 'onibus', 'estacionamento', 'pedágio', 'pedagio', 'taxi', 'táxi', 'passagem', 'bilhete']],
  ['lazer', ['cinema', 'show', 'jogo', 'bar ', 'passeio', 'viagem', 'parque', 'teatro', 'festa', 'ingresso', 'steam', 'barzinho']],
  ['despesasPessoais', ['roupa', 'camiseta', 'tênis', 'tenis', 'shopping', 'shein', 'fone', 'celular', 'presente', 'cabelo', 'salão', 'salao', 'barbeiro', 'cosmético', 'cosmetico', 'sapato']],
  ['alimentacao', ['ifood', 'pizza', 'hambúrguer', 'hamburguer', 'restaurante', 'mercado', 'supermercado', 'padaria', 'feira', 'lanche', 'comida', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'açaí', 'acai', 'delivery', 'rappi', 'sorvete', 'açougue', 'acougue', 'burger', 'mcdonald', 'sushi']],
];

const INCOME_KEYWORDS: Array<[string, string[]]> = [
  ['salario', ['salário', 'salario', 'pagamento', 'holerite', 'pró-labore', 'pro-labore', 'pro labore']],
  ['extra', ['freela', 'freelance', 'bico', 'extra', 'comissão', 'comissao', 'venda', 'reembolso', 'cashback']],
];

const norm = (text: string) => ` ${text.toLowerCase()} `;

/**
 * Sugere a categoria pela descrição. Devolve o slug da categoria
 * ('outros' / 'outrasEntradas' quando nenhuma palavra-chave bate).
 */
export function suggestCategory(description: string, kind: TransactionKindApi): string {
  const text = norm(description || '');
  const table = kind === 'receita' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  for (const [slug, keywords] of table) {
    if (keywords.some((k) => text.includes(k))) return slug;
  }
  return kind === 'receita' ? 'outrasEntradas' : 'outros';
}

/** Só aceita categoria conhecida; desconhecida cai para a sugestão pela descrição. */
export function resolveCategorySlug(category: string | undefined, description: string, kind: TransactionKindApi): string {
  if (category && CATEGORY_NAMES[category]) return category;
  return suggestCategory(description, kind);
}
