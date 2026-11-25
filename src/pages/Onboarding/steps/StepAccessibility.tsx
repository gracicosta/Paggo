import React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { CHART_PALETTES, FONT_STEPS, type PaletteId } from '../../Auth/authPrefs';
import { Check, StepTitle, type StepProps } from '../OnboardingUi';
import o from '../Onboarding.module.css';

const PALETTES: Array<{ id: PaletteId; name: string; hint: string }> = [
  { id: 'padrao', name: 'Padrão', hint: 'cores normais' },
  { id: 'protan', name: 'Vermelho e verde', hint: 'protan / deutan' },
  { id: 'tritan', name: 'Azul e amarelo', hint: 'tritan' },
  { id: 'contraste', name: 'Alto contraste', hint: 'preto e branco' },
];

/** 4 tamanhos do design → posições em FONT_STEPS (A+ na barra ainda chega ao 5º, "máximo"). */
const SIZES = [
  { step: 0, name: 'Pequena', px: 15 },
  { step: 1, name: 'Normal', px: 19 },
  { step: 2, name: 'Grande', px: 24 },
  { step: 3, name: 'Muito grande', px: 29 },
];

/**
 * Passo 2 (opcional): tema, cores dos gráficos e tamanho da letra. Tudo muda na hora.
 * O tipo de letra fica para a tela de Configurações (decisão da Dev, 25/11).
 */
export const StepAccessibility: React.FC<StepProps> = ({ prefs, onPrefsChange, firstName }) => {
  const sizeStep = Math.min(prefs.fontStep, 3);

  return (
    <>
      <StepTitle>Deixe o Paggo do seu jeito</StepTitle>
      <p className={o.sub}>Escolha como prefere ver o app. Dá para mudar depois nas configurações.</p>

      <fieldset className={o.sec}>
        <legend className={o.secT}>Aparência</legend>
        <div className={o.g2}>
          {[false, true].map((dark) => {
            const on = prefs.dark === dark;
            return (
              <button
                key={String(dark)}
                type="button"
                className={`${o.card} ${o.theme} ${on ? o.sel : ''}`}
                aria-pressed={on}
                onClick={() => onPrefsChange({ dark })}
              >
                {on && <Check />}
                <span className={`${o.mini} ${dark ? o.miniDark : o.miniLight}`} aria-hidden="true">
                  <span style={{ width: '50%', background: dark ? '#a78bfa' : '#6d28d9' }} />
                  <span style={{ width: '75%', background: dark ? '#2c2545' : '#e6e3f1' }} />
                  <span className={o.miniRow}>
                    <span style={{ background: dark ? '#2a1f4a' : '#ede9fe' }} />
                    <span style={{ background: dark ? '#173326' : '#dcfce7' }} />
                  </span>
                </span>
                <span className={o.themeName}>
                  {dark ? <LuMoon size={17} aria-hidden="true" /> : <LuSun size={17} aria-hidden="true" />}
                  {dark ? 'Escuro' : 'Claro'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={o.sec}>
        <legend className={o.secT}>
          Cores dos gráficos <em>para quem tem daltonismo</em>
        </legend>
        <div className={o.g4}>
          {PALETTES.map((p) => {
            const on = prefs.palette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`${o.card} ${o.pal} ${on ? o.sel : ''}`}
                aria-pressed={on}
                onClick={() => onPrefsChange({ palette: p.id })}
              >
                {on && <Check />}
                <span className={o.swatches} aria-hidden="true">
                  {CHART_PALETTES[p.id].light.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                {p.name}
                <small>{p.hint}</small>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={o.sec}>
        <legend className={o.secT}>
          Tamanho da letra <em>veja como fica e escolha</em>
        </legend>
        <div className={`${o.card} ${o.sizeBox}`}>
          <div className={o.sizes}>
            {SIZES.map((sz) => {
              const on = sizeStep === sz.step;
              return (
                <button
                  key={sz.step}
                  type="button"
                  className={`${o.sz} ${on ? o.szSel : ''}`}
                  aria-pressed={on}
                  onClick={() => onPrefsChange({ fontStep: sz.step })}
                >
                  <b style={{ fontSize: sz.px }} aria-hidden="true">
                    Aa
                  </b>
                  <small>{sz.name}</small>
                </button>
              );
            })}
          </div>
          <div className={o.prev} aria-live="polite">
            <em>Prévia</em>
            <span style={{ fontSize: `${Math.round(19 * FONT_STEPS[prefs.fontStep])}px` }}>
              Olá{firstName ? `, ${firstName}` : ''}! Assim fica o texto.
            </span>
          </div>
        </div>
      </fieldset>
    </>
  );
};
