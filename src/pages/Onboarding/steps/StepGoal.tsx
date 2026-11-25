import React from 'react';
import { LuCalendar, LuCircleAlert } from 'react-icons/lu';
import { chartColors } from '../../Auth/authPrefs';
import { Check, Emo, StepTitle, type StepProps } from '../OnboardingUi';
import {
  GOALS,
  GOAL_MONTHS,
  brlInt,
  goalEndDate,
  isoMonthAhead,
  monthName,
  monthSummary,
  monthsUntil,
} from '../onboardingData';
import o from '../Onboarding.module.css';

/** Passo 6 (opcional): primeira meta, quanto precisa e em quanto tempo. */
export const StepGoal: React.FC<StepProps> = ({ state, update, prefs }) => {
  const goal = GOALS.find((g) => g.id === state.goalId);
  const { leftover, goalMonthly } = monthSummary(state);
  const [cMain, , , cNeg] = chartColors(prefs);
  const fits = goalMonthly <= Math.max(leftover, 0);
  const share = leftover > 0 ? Math.min(100, Math.round((goalMonthly / leftover) * 100)) : 100;

  const pick = (id: string) => {
    if (state.goalId === id) {
      update({ goalId: null });
      return;
    }
    const g = GOALS.find((x) => x.id === id)!;
    // Ao trocar de meta, sugere nome e valor (sem apagar o que a pessoa já digitou para a mesma meta)
    update({ goalId: id, goalName: id === 'outra' ? '' : g.label, goalAmount: g.amount });
  };

  return (
    <>
      <StepTitle>Qual é o seu primeiro sonho?</StepTitle>
      <p className={o.sub}>Escolha uma meta. O Paggo mostra quanto guardar por mês para chegar lá.</p>

      <div className={o.goals} role="group" aria-label="Tipo de meta">
        {GOALS.map((g) => {
          const on = state.goalId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              className={`${o.card} ${o.goal} ${on ? o.sel : ''}`}
              aria-pressed={on}
              onClick={() => pick(g.id)}
            >
              {on && <Check />}
              <Emo emoji={g.emoji} tone={g.tone} dark={prefs.dark} />
              {g.label}
            </button>
          );
        })}
      </div>

      {goal && (
        <>
          <div className={o.fields}>
            <div className={o.field}>
              <label htmlFor="onb-goal-name">Nome da meta</label>
              <div className={o.box}>
                <input
                  id="onb-goal-name"
                  value={state.goalName}
                  maxLength={40}
                  placeholder={goal.id === 'outra' ? 'Ex.: Notebook novo' : `Ex.: ${goal.label} para Salvador`}
                  onChange={(e) => update({ goalName: e.target.value })}
                />
              </div>
            </div>
            <div className={o.field}>
              <label htmlFor="onb-goal-amount">Quanto precisa</label>
              <div className={o.box}>
                <span className={o.pref} aria-hidden="true">
                  R$
                </span>
                <input
                  id="onb-goal-amount"
                  inputMode="numeric"
                  value={state.goalAmount ? state.goalAmount.toLocaleString('pt-BR') : ''}
                  placeholder="0"
                  onChange={(e) => update({ goalAmount: Number(e.target.value.replace(/\D/g, '').slice(0, 8)) || 0 })}
                />
              </div>
            </div>
          </div>

          <fieldset className={o.sec} style={{ marginTop: 14 }}>
            <legend className={o.secT}>Em quanto tempo?</legend>
            <div className={o.chips}>
              {GOAL_MONTHS.map((m) => {
                const on = !state.goalDate && state.goalMonths === m.months;
                return (
                  <button
                    key={m.months}
                    type="button"
                    className={`${o.chip} ${on ? o.chipSel : ''}`}
                    aria-pressed={on}
                    onClick={() => update({ goalMonths: m.months, goalDate: null })}
                  >
                    {m.label}
                  </button>
                );
              })}
              <label className={`${o.chip} ${state.goalDate ? o.chipSel : ''}`}>
                <LuCalendar size={15} aria-hidden="true" />
                {state.goalDate ? null : <span>Escolher data</span>}
                <input
                  type="month"
                  className={o.monthInput}
                  style={state.goalDate ? undefined : { width: 0, opacity: 0, position: 'absolute' }}
                  min={isoMonthAhead(2)}
                  value={state.goalDate ?? ''}
                  aria-label="Escolher o mês da meta"
                  onChange={(e) =>
                    e.target.value
                      ? update({ goalDate: e.target.value, goalMonths: monthsUntil(e.target.value) })
                      : update({ goalDate: null, goalMonths: 12 })
                  }
                  onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                />
              </label>
            </div>
          </fieldset>

          {state.goalAmount > 0 && (
            <div className={`${o.card} ${o.result}`} aria-live="polite">
              <div
                className={o.ring}
                style={{ background: `conic-gradient(${fits ? cMain : cNeg} 0 ${share}%, var(--border) ${share}% 100%)` }}
                aria-hidden="true"
              >
                <span>{state.goalMonths}x</span>
              </div>
              <p>
                Guardando <b className={o.big}>{brlInt(goalMonthly)} por mês</b>
                <br />
                {goal.verb} <b>{monthName(goalEndDate(state.goalMonths))}</b>.{' '}
                {fits ? (
                  <>Isso cabe na sua sobra de {brlInt(leftover)}. 🎉</>
                ) : (
                  <span className={o.warnNote}>
                    <LuCircleAlert size={14} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px' }} />{' '}
                    {leftover > 0
                      ? `Passa da sua sobra de ${brlInt(leftover)}. Tente um prazo maior.`
                      : 'Hoje não sobra dinheiro no mês. Reveja contas e limites ou escolha um prazo maior.'}
                  </span>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};
