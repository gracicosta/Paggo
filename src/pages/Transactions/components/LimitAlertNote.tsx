import { LuSparkles, LuTriangleAlert } from 'react-icons/lu';
import { brl, pct } from '../../../utils/format';
import type { LimitAlert } from '../transactionUtils';
import styles from '../Transactions.module.css';

export interface LimitAlertNoteProps {
  alert: LimitAlert;
}

/** Aviso do limite de categoria: "Atenção" a partir de 80%, "Estourou" acima de 100%. */
export function LimitAlertNote({ alert }: LimitAlertNoteProps) {
  const over = alert.used > 1;
  return (
    <p className={`${styles.limitNote} ${over ? styles.limitOver : ''}`} role="status">
      {over ? <LuTriangleAlert size={18} aria-hidden="true" /> : <LuSparkles size={18} aria-hidden="true" />}
      <span>
        <b>
          {over ? 'Estourou' : 'Atenção'}: {pct(alert.used)}
        </b>{' '}
        do limite de <b>{alert.label}</b>.{' '}
        {alert.left >= 0.5
          ? `Faltam ${brl(alert.left, 0)} até o fim do mês.`
          : alert.left > -0.5
            ? 'O limite do mês acabou.'
            : `Passou ${brl(-alert.left, 0)} do combinado.`}
      </span>
    </p>
  );
}
