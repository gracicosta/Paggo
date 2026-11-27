import { LuTrash2 } from 'react-icons/lu';
import { Modal } from '../../../components/ui/Modal';
import type { GoalView } from '../../../data/goalSummary';
import { brlInt } from '../../../utils/format';
import txStyles from '../../Transactions/Transactions.module.css';

export interface GoalDeleteConfirmProps {
  goal: GoalView;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Excluir esta meta?" O foco começa no Cancelar, para ninguém apagar sem querer. */
export function GoalDeleteConfirm({ goal, onConfirm, onCancel }: GoalDeleteConfirmProps) {
  return (
    <Modal title="Excluir esta meta?" role="alertdialog" size="sm" onClose={onCancel}>
      <div className={txStyles.confirm}>
        <div className={txStyles.confirmItem}>
          <b>{goal.title}</b>
          <span>{brlInt(goal.saved)} guardados</span>
        </div>
        <p className={txStyles.muted}>O cofrinho e o histórico de depósitos desta meta vão ser apagados.</p>
        <div className={txStyles.formActions}>
          <button type="button" className={txStyles.btnGhost} onClick={onCancel} data-autofocus>
            Cancelar
          </button>
          <button type="button" className={txStyles.btnDanger} onClick={onConfirm}>
            <LuTrash2 size={17} /> Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}
