import type { GoalView } from '../../../data/goalSummary';
import { brlInt } from '../../../utils/format';
import { MONTHS_LOWER, fromIsoDate } from '../../../utils/dates';
import { Pill } from '../../../components/finance/Pill';
import styles from '../Goals.module.css';

/** Linha de uma meta já conquistada ("Celular novo · ✓ Concluída em agosto"). */
export function DoneGoalRow({ goal: g }: { goal: GoalView }) {
  const Icon = g.type.icon;
  const when = g.completedAt ? ` em ${MONTHS_LOWER[fromIsoDate(g.completedAt).getMonth()]}` : '';
  return (
    <li className={styles.done} style={{ '--goal-color': g.color } as React.CSSProperties}>
      <span className={styles.goalIcon} aria-hidden="true">
        <Icon size={19} />
      </span>
      <span className={styles.goalName}>
        <b>{g.title}</b>
        <small>{brlInt(g.saved)} guardados</small>
      </span>
      <Pill tone="ok">
        <span aria-hidden="true">✓</span> Concluída{when}
      </Pill>
    </li>
  );
}
