/** Receita = dinheiro que entrou. Despesa = dinheiro que saiu. */
export type TransactionKind = 'receita' | 'despesa';

export type PaymentMethod = 'pix' | 'debito' | 'credito' | 'dinheiro' | 'boleto' | 'deposito';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  /** Valor sempre positivo, em reais. O sinal vem de `kind`. */
  amount: number;
  /** Data no formato aaaa-mm-dd. */
  date: string;
  description: string;
  /** Id da categoria (veja data/transactionCategories.ts). */
  category: string;
  method: PaymentMethod;
  /** "Foi por impulso?" (só para despesas). */
  impulse: boolean;
}

/** O que o formulário envia: tudo menos o id, que é criado ao salvar. */
export type TransactionInput = Omit<Transaction, 'id'>;
