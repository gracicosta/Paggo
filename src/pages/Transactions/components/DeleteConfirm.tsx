import { LuTrash2 } from 'react-icons/lu';
import { Modal } from '../../../components/ui/Modal';
import type { Transaction } from '../../../types/transactions';
import { brl } from '../../../utils/format';
import styles from '../Transactions.module.css';

export interface DeleteConfirmProps {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Excluir esta transação?" O foco começa no Cancelar, para ninguém apagar sem querer. */
export function DeleteConfirm({ transaction: t, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <Modal title="Excluir esta transação?" role="alertdialog" size="sm" onClose={onCancel}>
      <div className={styles.confirm}>
        <div className={styles.confirmItem}>
          <b>{t.description}</b>
          <span className={t.kind === 'receita' ? styles.amountIn : ''}>
            {t.kind === 'receita' ? '+' : '−'} {brl(t.amount)}
          </span>
        </div>
        <p className={styles.muted}>O saldo e os gráficos do mês vão ser atualizados.</p>
        <div className={styles.formActions}>
          <button type="button" className={styles.btnGhost} onClick={onCancel} data-autofocus>
            Cancelar
          </button>
          <button type="button" className={styles.btnDanger} onClick={onConfirm}>
            <LuTrash2 size={17} /> Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}
