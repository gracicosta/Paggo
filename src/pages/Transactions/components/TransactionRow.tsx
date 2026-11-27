import { LuPencil, LuTrash2 } from 'react-icons/lu';
import { categoryById, methodLabel } from '../../../data/transactionCategories';
import type { PaletteId } from '../../../types/prefs';
import type { Transaction } from '../../../types/transactions';
import { brl } from '../../../utils/format';
import { catColor, signed } from '../transactionUtils';
import styles from '../Transactions.module.css';

export interface TransactionRowProps {
  transaction: Transaction;
  palette: PaletteId;
  dark: boolean;
  /** Tocar na linha ou no lápis. */
  onEdit: (t: Transaction) => void;
  /** Tocar na lixeira (a tela pede confirmação antes de apagar). */
  onDelete: (t: Transaction) => void;
}

/** Uma linha da lista: ícone da categoria, descrição, forma de pagamento, valor e ações. */
export function TransactionRow({ transaction: t, palette, dark, onEdit, onDelete }: TransactionRowProps) {
  const cat = categoryById(t.category);
  const color = catColor(t.category, palette, dark);
  const Icon = cat.icon;
  return (
    <li className={styles.row}>
      {/* Tocar na linha abre a edição (no celular é o único jeito; lá os ícones ficam escondidos) */}
      <button
        type="button"
        className={styles.rowOpen}
        onClick={() => onEdit(t)}
        aria-label={`${t.description}, ${t.kind === 'receita' ? 'entrou' : 'saiu'} ${brl(t.amount)}. Abrir para editar`}
      >
        <span className={styles.rowIcon} style={{ background: `${color}22`, color }} aria-hidden="true">
          <Icon size={18} />
        </span>
        <div className={styles.rowText}>
          <b>{t.description}</b>
          <span>
            {cat.label}
            <span className={styles.method}>· {methodLabel(t.method)}</span>
            {t.impulse && <em className={styles.tag}>⚡ Impulso</em>}
          </span>
        </div>
        <span className={`${styles.amount} ${t.kind === 'receita' ? styles.amountIn : ''}`}>
          {signed(t) >= 0 ? '+' : '−'} {brl(t.amount)}
        </span>
      </button>
      <span className={styles.rowActions}>
        <button type="button" onClick={() => onEdit(t)} aria-label={`Editar ${t.description}`} title="Editar">
          <LuPencil size={16} />
        </button>
        <button
          type="button"
          className={styles.del}
          onClick={() => onDelete(t)}
          aria-label={`Excluir ${t.description}`}
          title="Excluir"
        >
          <LuTrash2 size={16} />
        </button>
      </span>
    </li>
  );
}
