import type { GoalMonth } from '../../../data/goalSummary';
import { brlInt } from '../../../utils/format';
import styles from '../Goals.module.css';

export interface GoalHistoryBarsProps {
  months: GoalMonth[];
  color: string;
}

/** Barrinhas dos depósitos dos últimos meses. Mês sem depósito aparece tracejado (não só pela cor). */
export function GoalHistoryBars({ months, color }: GoalHistoryBarsProps) {
  const max = Math.max(1, ...months.map((m) => m.amount));
  const last = months.length - 1;
  return (
    <ul className={styles.hist} aria-label="Depósitos dos últimos meses">
      {months.map((m, i) => (
        <li key={m.key}>
          <i
            className={m.amount ? '' : m.missed ? styles.histMissed : styles.histEmpty}
            style={m.amount ? ({ '--h': Math.max(0.25, m.amount / max), background: color, opacity: i === last ? 1 : 0.55 } as React.CSSProperties) : undefined}
            title={m.amount ? `${brlInt(m.amount)} em ${m.label}` : m.missed ? `Sem depósito em ${m.label}` : undefined}
          />
          <span>{m.label}</span>
          <b className="sr-only">{m.amount ? brlInt(m.amount) : 'sem depósito'}</b>
        </li>
      ))}
    </ul>
  );
}
