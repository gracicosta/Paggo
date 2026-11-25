import React from 'react';
import { LuCircleAlert, LuInfo } from 'react-icons/lu';
import { Check, Emo, StepTitle, type StepProps } from '../OnboardingUi';
import { INCOME_SOURCES, PAYDAYS, maskMoneyInt, parseMoney } from '../onboardingData';
import o from '../Onboarding.module.css';

/** Passo 3 (obrigatório): renda do mês, de onde vem e o dia em que cai. */
export const StepIncome: React.FC<StepProps & { showError: boolean }> = ({ state, update, prefs, showError }) => {
  const text = state.income ? state.income.toLocaleString('pt-BR') : '';
  const bad = showError && state.income <= 0;

  const toggleSource = (id: string) =>
    update({
      incomeSources: state.incomeSources.includes(id)
        ? state.incomeSources.filter((s) => s !== id)
        : [...state.incomeSources, id],
    });

  return (
    <>
      <StepTitle>Quanto entra por mês para você?</StepTitle>
      <p className={o.sub}>Pode ser um valor aproximado. Com ele, o Paggo calcula quanto dá para gastar e guardar.</p>

      <label className={`${o.money} ${bad ? o.moneyBad : ''}`} htmlFor="onb-income">
        <span className={o.rs} aria-hidden="true">
          R$
        </span>
        <input
          id="onb-income"
          className={o.moneyInput}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={text}
          aria-label="Renda por mês, em reais"
          aria-invalid={bad}
          aria-describedby="onb-income-msg"
          onChange={(e) => update({ income: parseMoney(maskMoneyInt(e.target.value).replace(/\./g, '')) })}
        />
        <span className={o.perMonth}>por mês</span>
      </label>
      {bad ? (
        <p id="onb-income-msg" className={`${o.note} ${o.err}`} role="alert">
          <LuCircleAlert size={15} aria-hidden="true" />
          Digite quanto entra por mês. Pode ser um valor aproximado.
        </p>
      ) : (
        <p id="onb-income-msg" className={o.note}>
          <LuInfo size={15} aria-hidden="true" />
          Some salário, bicos, pensão e outras entradas. Não precisa enviar documento.
        </p>
      )}

      <fieldset className={o.sec}>
        <legend className={o.secT}>
          De onde vem esse dinheiro? <em>pode marcar mais de um</em>
        </legend>
        <div className={`${o.g3} ${o.srcGrid}`}>
          {INCOME_SOURCES.map((src) => {
            const on = state.incomeSources.includes(src.id);
            return (
              <button
                key={src.id}
                type="button"
                className={`${o.card} ${o.src} ${on ? o.sel : ''}`}
                aria-pressed={on}
                onClick={() => toggleSource(src.id)}
              >
                {on && <Check />}
                <Emo emoji={src.emoji} tone={src.tone} dark={prefs.dark} />
                {src.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={o.sec}>
        <legend className={o.secT}>Em que dia costuma cair?</legend>
        <div className={o.chips}>
          {PAYDAYS.map((day) => {
            const on = state.payday === day;
            return (
              <button
                key={String(day)}
                type="button"
                className={`${o.chip} ${on ? o.chipSel : ''}`}
                aria-pressed={on}
                onClick={() => update({ payday: on ? undefined : day })}
              >
                {day === null ? 'Varia' : `Dia ${day}`}
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );
};
