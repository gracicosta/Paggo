import { LuUndo2, LuX } from 'react-icons/lu';
import styles from '../Transactions.module.css';

export interface UndoToastProps {
  text: string;
  /** Quando existe, mostra o botão "Desfazer". */
  onUndo?: () => void;
  onClose: () => void;
}

/** Aviso no rodapé ("Despesa salva.", "... foi excluída. Desfazer"). */
export function UndoToast({ text, onUndo, onClose }: UndoToastProps) {
  return (
    <div className={styles.toast} role="status">
      <span>{text}</span>
      {onUndo && (
        <button type="button" onClick={onUndo}>
          <LuUndo2 size={16} /> Desfazer
        </button>
      )}
      <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Fechar aviso">
        <LuX size={16} />
      </button>
    </div>
  );
}
