import { LuMinus, LuPlus, LuTrash2 } from 'react-icons/lu';
import { shortMonth, type GoalView } from '../../../data/goalSummary';
import { brlInt } from '../../../utils/format';
import { Pill } from '../../../components/finance/Pill';
import { ProgressRing } from '../../../components/finance/ProgressRing';
import { GoalHistoryBars } from './GoalHistoryBars';
import { GOAL_STATUS } from '../goalStatus';
import styles from '../Goals.module.css';
import txStyles from '../../Transactions/Transactions.module.css';

export interface GoalCardProps {
  goal: GoalView;
  /** Meta aberta no cartão "Mexer no cofrinho". */
  selected: boolean;
  onDeposit: (id: number) => void;
  onWithdraw: (id: number) => void;
  onDelete: (id: number) => void;
}

const months = (n: number) => `${n} ${n === 1 ? 'mês' : 'meses'}`;

/** Prazo da meta: "dez/2027 · 13 meses", "Este mês", "Passou de jul/2026" ou "Sem prazo". */
function deadlineText(g: GoalView) {
  if (!g.deadline || g.monthsLeft === null) return 'Sem prazo';
  if (g.monthsLeft < 0) return `Passou de ${shortMonth(g.deadline)}`;
  if (g.monthsLeft === 0) return `${shortMonth(g.deadline)} · este mês`;
  return `${shortMonth(g.deadline)} · ${months(g.monthsLeft)}`;
}

/** Cartão de uma meta: anel, quanto falta, quanto guardar por mês, prazo, depósitos dos últimos meses e ações. */
export function GoalCard({ goal: g, selected, onDeposit, onWithdraw, onDelete }: GoalCardProps) {
  const Icon = g.type.icon;
  const status = GOAL_STATUS[g.status];
  const hist = g.history;
  const withDeposits = hist.filter((m) => m.amount > 0);
  const average = withDeposits.length ? withDeposits.reduce((s, m) => s + m.amount, 0) / withDeposits.length : 0;
  const lastMissed = [...hist].reverse().find((m) => m.missed);

  return (
    <article
      className={`${styles.goal} ${selected ? styles.goalOn : ''}`}
      style={{ '--goal-color': g.color } as React.CSSProperties}
      aria-labelledby={`goal-${g.id}`}
    >
      <header className={styles.goalHead}>
        <span className={styles.goalIcon} aria-hidden="true">
          <Icon size={22} />
        </span>
        <span className={styles.goalName}>
          <b id={`goal-${g.id}`}>{g.title}</b>
          {g.description && <small>{g.description}</small>}
        </span>
        <Pill tone={status.tone}>
          <span aria-hidden="true">{status.symbol}</span> {status.label}
        </Pill>
      </header>

      <div className={styles.goalBody}>
        <ProgressRing value={g.progress} color={g.color} className={styles.ring} label={`${Math.round(g.progress * 100)}% de ${g.title}`} />
        <div className={styles.goalNums}>
          <strong>{brlInt(g.saved)}</strong>
          <span>
            de {brlInt(g.target)}
            {g.left > 0 && ` · faltam ${brlInt(g.left)}`}
          </span>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>Guardar por mês</dt>
            <dd>{g.perMonth > 0 ? brlInt(g.perMonth) : 'Quanto puder'}</dd>
          </div>
          <div>
            <dt>Prazo</dt>
            <dd>{deadlineText(g)}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.histHead}>
        <span>Últimos {hist.length} meses</span>
        {lastMissed ? (
          <span className={styles.histWarn}>
            <b>{lastMissed.label}</b> ficou sem depósito
          </span>
        ) : average > 0 ? (
          <span>
            Média <b>{brlInt(average)}</b>/mês
          </span>
        ) : (
          <span>Nenhum depósito ainda</span>
        )}
      </div>
      <GoalHistoryBars months={hist} color={g.color} />

      <div className={styles.goalActions}>
        <button type="button" className={`${txStyles.btnPrimary} ${styles.btnDeposit}`} onClick={() => onDeposit(g.id)}>
          <LuPlus size={17} /> Depositar
        </button>
        <button type="button" className={txStyles.btnSecondary} onClick={() => onWithdraw(g.id)} disabled={g.saved <= 0}>
          <LuMinus size={17} /> Retirar
        </button>
        <button type="button" className={styles.iconBtn} onClick={() => onDelete(g.id)} aria-label={`Excluir a meta ${g.title}`}>
          <LuTrash2 size={17} />
        </button>
      </div>
    </article>
  );
}
