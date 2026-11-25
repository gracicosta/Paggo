import React, { useEffect, useState } from 'react';
import { LuBot, LuLoader } from 'react-icons/lu';
import { chartColors } from '../../Auth/authPrefs';
import type { AiPlanAction } from '../../../types/auth';
import { StepTitle, type StepProps } from '../OnboardingUi';
import { GOALS, brlInt, currentMonthLabel, monthSummary } from '../onboardingData';
import o from '../Onboarding.module.css';

/** "Separe **R$ 334** no dia 5" → Separe <b>R$ 334</b> no dia 5 */
const rich = (text: string) =>
  text.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <React.Fragment key={i}>{part}</React.Fragment>));

/** Tempo da "IA pensando" (o plano é calculado na hora; a pausa só dá ritmo à tela). */
const THINK_MS = 1100;

/** Passo 7: plano da IA (3 ações) e prévia do painel. */
export const StepPlan: React.FC<StepProps & { plan: AiPlanAction[] }> = ({ state, prefs, firstName, plan }) => {
  const [ready, setReady] = useState(false);
  const { committed, goalMonthly } = monthSummary(state);
  const goal = GOALS.find((g) => g.id === state.goalId);
  const [cMain, cWarn, cOk, cNeg] = chartColors(prefs);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setReady(true), reduce ? 0 : THINK_MS);
    return () => window.clearTimeout(t);
  }, []);

  const committedPct = state.income ? Math.min(100, (committed / state.income) * 100) : 0;

  return (
    <>
      <div className={o.planHead}>
        <span className={o.spark} aria-hidden="true">
          ✨
        </span>
        <StepTitle>{firstName ? `Seu plano está pronto, ${firstName}!` : 'Seu plano está pronto!'}</StepTitle>
      </div>
      <p className={o.sub}>
        A IA olhou sua renda, suas contas{goal ? ' e sua meta' : ''}. Estes são os 3 primeiros passos:
      </p>

      {!ready ? (
        <div className={o.thinking} role="status">
          <LuLoader size={22} className={o.spin} aria-hidden="true" />
          A IA está montando o seu plano…
        </div>
      ) : (
        <ol className={o.acts} aria-live="polite">
          {plan.map((a, i) => (
            <li key={i} className={`${o.card} ${o.act}`}>
              <span className={o.actN} aria-hidden="true">
                {i + 1}
              </span>
              <p>
                {rich(a.text)}
                <small>{a.detail}</small>
              </p>
              <span className={`${o.tag} ${a.tag === 'Atenção' ? o.tagWarn : ''}`}>{a.tag}</span>
            </li>
          ))}
        </ol>
      )}

      <section className={o.dash} aria-labelledby="onb-dash">
        <h3 className={o.dashT} id="onb-dash">
          <span>Prévia do seu painel</span>
          <span>{currentMonthLabel()}</span>
        </h3>
        <div className={o.kpis}>
          <div className={o.kpi}>
            <small>Renda do mês</small>
            <b>{brlInt(state.income)}</b>
            <div className={o.kpiBar} aria-hidden="true">
              <i style={{ width: '100%', background: cOk }} />
            </div>
          </div>
          <div className={o.kpi}>
            <small>Já comprometido</small>
            <b>{brlInt(committed)}</b>
            <div className={o.kpiBar} aria-hidden="true">
              <i style={{ width: `${committedPct}%`, background: committed > state.income ? cNeg : cWarn }} />
            </div>
          </div>
          <div className={o.kpi}>
            {goal ? (
              <>
                <small>
                  <span aria-hidden="true">{goal.emoji}</span> {state.goalName.trim() || goal.label}
                </small>
                <b>0 de {brlInt(state.goalAmount)}</b>
                <div className={o.kpiBar} aria-hidden="true">
                  <i style={{ width: '3%', background: cMain }} />
                </div>
              </>
            ) : (
              <>
                <small>Sobra do mês</small>
                <b>{brlInt(state.income - committed - goalMonthly)}</b>
                <div className={o.kpiBar} aria-hidden="true">
                  <i
                    style={{
                      width: `${state.income ? Math.max(0, Math.min(100, ((state.income - committed) / state.income) * 100)) : 0}%`,
                      background: cMain,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <p className={o.note}>
        <LuBot size={18} aria-hidden="true" />
        <span>Quer conversar sobre o plano? O assistente fica no canto da tela. No plano grátis você tem 1 consulta por mês.</span>
      </p>
    </>
  );
};
