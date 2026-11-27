import React from 'react';
import { LuCircleAlert, LuCrown, LuLock, LuPencil, LuPlus, LuX } from 'react-icons/lu';
import { chartColors } from '../../../utils/palette';
import { Emo, StepTitle, type StepProps } from '../OnboardingUi';
import {
  FREE_CATEGORY_LIMITS,
  LIMIT_CATEGORIES,
  brlInt,
  monthSummary,
  suggestedLimit,
} from '../onboardingData';
import o from '../Onboarding.module.css';

/** Passo 5 (opcional): limite por categoria (3 no plano grátis) e como fica o mês. */
export const StepLimits: React.FC<StepProps> = ({ state, update, prefs, openPremium }) => {
  const max = Math.max(500, Math.round((state.income * 0.5) / 50) * 50);
  const full = state.limits.length >= FREE_CATEGORY_LIMITS;
  const { fixed, limits, leftover } = monthSummary(state);
  const [cFixed, cLimits, cLeft, cNeg] = chartColors(prefs);

  const setValue = (id: string, value: number) =>
    update({ limits: state.limits.map((l) => (l.id === id ? { ...l, value: Math.max(0, Math.min(value, 999999)) } : l)), limitsTouched: true });

  const remove = (id: string) => update({ limits: state.limits.filter((l) => l.id !== id), limitsTouched: true });

  const add = (id: string) => {
    const cat = LIMIT_CATEGORIES.find((c) => c.id === id);
    if (!cat || full) return;
    update({ limits: [...state.limits, { id, value: suggestedLimit(cat, state.income) }], limitsTouched: true });
  };

  // Barra do mês: proporções sobre a renda (ou sobre o total, se passar da renda)
  const base = Math.max(state.income, fixed + limits, 1);
  const pct = (v: number) => `${(Math.max(v, 0) / base) * 100}%`;

  return (
    <>
      <StepTitle>Quanto quer gastar em cada coisa?</StepTitle>
      <p className={o.sub}>
        Sugerimos valores pela sua renda de <b>{brlInt(state.income)}</b>. Arraste para ajustar. Avisamos quando chegar perto do limite.
      </p>

      <ul className={o.lims} style={{ listStyle: 'none', padding: 0 }}>
        {LIMIT_CATEGORIES.map((cat) => {
          const limit = state.limits.find((l) => l.id === cat.id);

          if (limit) {
            const fill = `${Math.min(100, (limit.value / max) * 100)}%`;
            return (
              <li key={cat.id} className={`${o.card} ${o.lim}`}>
                <Emo emoji={cat.emoji} tone={cat.tone} dark={prefs.dark} />
                <strong className={o.limName} id={`lim-${cat.id}`}>
                  {cat.label}
                </strong>
                <div className={o.limActions}>
                  <label className={o.amt} title="Digitar o valor">
                    R$
                    <input
                      inputMode="numeric"
                      value={limit.value ? limit.value.toLocaleString('pt-BR') : ''}
                      placeholder="0"
                      style={{ '--len': Math.max(1, limit.value.toLocaleString('pt-BR').length) } as React.CSSProperties}
                      aria-label={`Limite de ${cat.label} por mês, em reais`}
                      onChange={(e) => setValue(cat.id, Number(e.target.value.replace(/\D/g, '').slice(0, 6)) || 0)}
                    />
                    <LuPencil size={14} aria-hidden="true" />
                  </label>
                  <button type="button" className={o.iconBtn} onClick={() => remove(cat.id)} aria-label={`Tirar o limite de ${cat.label}`} title="Tirar limite">
                    <LuX size={16} />
                  </button>
                </div>
                <input
                  type="range"
                  className={o.slider}
                  min={0}
                  max={max}
                  step={10}
                  value={Math.min(limit.value, max)}
                  style={{ '--pct': fill } as React.CSSProperties}
                  aria-labelledby={`lim-${cat.id}`}
                  aria-valuetext={brlInt(limit.value)}
                  onChange={(e) => setValue(cat.id, Number(e.target.value))}
                />
              </li>
            );
          }

          return (
            <li key={cat.id}>
              <button
                type="button"
                className={`${o.card} ${o.lim} ${o.limOff} ${full ? o.locked : ''}`}
                onClick={() => (full ? openPremium() : add(cat.id))}
                aria-label={full ? `${cat.label}: disponível no Premium` : `Criar limite para ${cat.label}`}
              >
                <Emo emoji={cat.emoji} tone={cat.tone} dark={prefs.dark} />
                <strong className={o.limName}>{cat.label}</strong>
                {full ? (
                  <span className={o.lockT}>
                    <LuLock size={14} aria-hidden="true" /> Premium
                  </span>
                ) : (
                  <span className={o.addT}>
                    <LuPlus size={14} aria-hidden="true" /> Criar limite
                  </span>
                )}
                <span className={o.sug}>
                  {full ? 'Disponível no Premium' : `Sugestão: ${brlInt(suggestedLimit(cat, state.income))} por mês`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={o.prem}>
        <LuCrown size={18} aria-hidden="true" />
        <span>
          <b>Plano grátis: limites em {FREE_CATEGORY_LIMITS} categorias.</b> No Premium, em quantas quiser.
        </span>
        <button type="button" className={o.pbtn} onClick={openPremium}>
          Ver Premium
        </button>
      </div>

      <section className={o.sec} aria-labelledby="onb-month">
        <h3 className={o.secT} id="onb-month">
          Como fica o seu mês
        </h3>
        <div className={o.split} aria-hidden="true">
          <i style={{ width: pct(fixed), background: cFixed }} />
          <i style={{ width: pct(limits), background: cLimits }} />
          <i style={{ width: pct(leftover), background: cLeft }} />
        </div>
        <ul className={o.legend} aria-live="polite">
          <li>
            <span className={o.dot} style={{ background: cFixed }} aria-hidden="true" />
            Contas fixas <b>{brlInt(fixed)}</b>
          </li>
          <li>
            <span className={`${o.dot} ${o.dotSquare}`} style={{ background: cLimits }} aria-hidden="true" />
            Limites <b>{brlInt(limits)}</b>
          </li>
          <li>
            <span className={`${o.dot} ${o.dotDiamond}`} style={{ background: leftover < 0 ? cNeg : cLeft }} aria-hidden="true" />
            {leftover < 0 ? 'Falta' : 'Sobra'} <b>{brlInt(Math.abs(leftover))}</b>
          </li>
        </ul>
        {leftover < 0 && (
          <p className={`${o.note} ${o.warnNote}`} role="status">
            <LuCircleAlert size={15} aria-hidden="true" />
            Contas e limites passam da sua renda. Diminua algum limite para fechar o mês no azul.
          </p>
        )}
      </section>
    </>
  );
};
