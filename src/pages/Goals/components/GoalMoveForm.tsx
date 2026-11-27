import { useId, useState } from 'react';
import { LuCheck, LuMinus, LuPlus, LuWallet } from 'react-icons/lu';
import { shortMonth, type GoalView } from '../../../data/goalSummary';
import { brlInt, pct } from '../../../utils/format';
import { AmountField } from '../../../components/ui/AmountField';
import { shortGoalTitle } from '../goalPlan';
import txStyles from '../../Transactions/Transactions.module.css';
import limStyles from '../../Transactions/Limits.module.css';
import styles from '../Goals.module.css';

export type MoveMode = 'deposit' | 'withdraw';

export interface GoalMoveFormProps {
  goal: GoalView;
  mode: MoveMode;
  onModeChange: (mode: MoveMode) => void;
  /** Saldo do mês que ainda não foi para nenhum cofrinho. */
  freeBalance: number;
  /** "novembro" */
  monthName: string;
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/** Valores rápidos: 50, 100, 150 e o "guardar por mês" (depósito) ou metade e tudo (retirada). */
function quickAmounts(goal: GoalView, mode: MoveMode) {
  const list =
    mode === 'deposit'
      ? [50, 100, 150, goal.perMonth]
      : [50, 100, Math.floor(goal.saved / 2), Math.floor(goal.saved)].filter((v) => v <= goal.saved);
  return [...new Set(list.filter((v) => v > 0))].sort((a, b) => a - b).slice(0, 4);
}

/**
 * "Mexer no cofrinho": depositar ou retirar, já mostrando como a meta fica depois.
 * Com `onCancel` (janela do celular) o botão fica mais curto para caber na tela.
 */
export function GoalMoveForm({ goal, mode, onModeChange, freeBalance, monthName, onConfirm, onCancel, autoFocus }: GoalMoveFormProps) {
  const uid = useId();
  const Icon = goal.type.icon;
  const deposit = mode === 'deposit';
  const [cents, setCents] = useState(() => (deposit ? Math.min(goal.perMonth || 100, goal.left || 100) * 100 : 0));
  const [tried, setTried] = useState(false);
  const value = cents / 100;

  const error = !tried
    ? ''
    : cents <= 0
      ? 'Digite um valor maior que zero.'
      : !deposit && value > goal.saved
        ? `O cofrinho tem ${brlInt(goal.saved)}. Dá para retirar até esse valor.`
        : '';

  const after = Math.max(0, goal.saved + (deposit ? value : -value));
  const afterLeft = Math.max(0, goal.target - after);
  const short = shortGoalTitle(goal.title);
  const base = Math.min(1, goal.saved / (goal.target || 1));
  const next = Math.min(1, after / (goal.target || 1));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (cents <= 0 || (!deposit && value > goal.saved)) return;
    onConfirm(value);
  };

  return (
    <form className={txStyles.form} onSubmit={submit} noValidate>
      <div className={styles.moveWho} style={{ '--goal-color': goal.color } as React.CSSProperties}>
        <span className={styles.goalIcon} aria-hidden="true">
          <Icon size={20} />
        </span>
        <span>
          <b>{goal.title}</b>
          <small>
            {brlInt(goal.saved)} de {brlInt(goal.target)} ({pct(goal.progress)})
          </small>
        </span>
      </div>

      <div className={`${txStyles.kindSwitch} ${styles.moveSwitch}`} role="radiogroup" aria-label="Depositar ou retirar">
        <button
          type="button"
          role="radio"
          aria-checked={deposit}
          className={deposit ? txStyles.kindIncome : ''}
          onClick={() => onModeChange('deposit')}
        >
          <LuPlus size={15} aria-hidden="true" /> Depositar
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!deposit}
          className={!deposit ? txStyles.kindExpense : ''}
          onClick={() => onModeChange('withdraw')}
          disabled={goal.saved <= 0}
        >
          <LuMinus size={15} aria-hidden="true" /> Retirar
        </button>
      </div>

      <AmountField
        id={`${uid}-value`}
        label={deposit ? 'Quanto vai guardar agora?' : 'Quanto vai tirar?'}
        cents={cents}
        onCentsChange={setCents}
        invalid={!!error}
        describedBy={error ? `${uid}-err` : undefined}
        autoFocus={autoFocus}
      />
      {error && (
        <p id={`${uid}-err`} className={txStyles.errorText} role="alert">
          {error}
        </p>
      )}

      <div className={`${limStyles.quickValues} ${styles.moveQuick}`} role="group" aria-label="Valores rápidos">
        {quickAmounts(goal, mode).map((v) => (
          <button
            key={v}
            type="button"
            className={Math.round(value) === v ? limStyles.quickOn : ''}
            aria-pressed={Math.round(value) === v}
            onClick={() => setCents(v * 100)}
          >
            {!deposit && v === Math.floor(goal.saved) ? `Tudo · ${brlInt(v)}` : brlInt(v)}
          </button>
        ))}
      </div>

      <p className={`${styles.from} ${deposit && value > freeBalance ? styles.fromWarn : ''}`}>
        <LuWallet size={17} aria-hidden="true" />
        {deposit ? (
          <>
            Sai do <b>saldo de {monthName}</b>
            <span>{freeBalance > 0 ? `${brlInt(freeBalance)} livres` : 'sem sobra no mês'}</span>
          </>
        ) : (
          <>
            Volta para o <b>saldo de {monthName}</b>
          </>
        )}
      </p>

      <div className={styles.after} aria-live="polite">
        <div className={styles.afterRow}>
          <span>{deposit ? 'Depois do depósito' : 'Depois da retirada'}</span>
          <b>
            {brlInt(after)} · {pct(after / (goal.target || 1))}
          </b>
        </div>
        <span className={styles.afterTrack} aria-hidden="true" style={{ '--goal-color': goal.color } as React.CSSProperties}>
          <span style={{ width: `${Math.min(base, next) * 100}%` }} />
          <span className={deposit ? styles.afterPlus : styles.afterMinus} style={{ left: `${Math.min(base, next) * 100}%`, width: `${Math.abs(next - base) * 100}%` }} />
        </span>
        <div className={styles.afterRow}>
          <small>{afterLeft > 0 ? `Faltam ${brlInt(afterLeft)}` : 'Meta completa!'}</small>
          {goal.deadline && afterLeft > 0 && (
            <small>
              Prazo <b>{shortMonth(goal.deadline)}</b>
            </small>
          )}
        </div>
      </div>

      <div className={txStyles.formActions}>
        {onCancel && (
          <button type="button" className={txStyles.btnSecondary} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className={`${txStyles.btnPrimary} ${txStyles.btnSave}`}>
          <LuCheck size={18} /> {deposit ? `Guardar ${brlInt(value)}${onCancel ? '' : ` na ${short}`}` : `Retirar ${brlInt(value)}`}
        </button>
      </div>
    </form>
  );
}
