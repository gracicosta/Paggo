import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuArrowRight, LuCheck, LuChevronRight, LuClock, LuShield } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { FONT_STEPS, loadPrefs, pageClassName, savePrefs, type Prefs } from '../Auth/authPrefs';
import logo from '../../assets/images/paggo-logo.png';
import styles from '../Auth/AuthPage.module.css';
import o from './Onboarding.module.css';
import { PremiumModal, type StepProps } from './OnboardingUi';
import {
  REQUIRED_STEP,
  STEPS,
  TOTAL_STEPS,
  buildAiPlan,
  defaultLimits,
  draftKey,
  initialState,
  toFinancialProfile,
  type OnboardingState,
} from './onboardingData';
import { StepWelcome } from './steps/StepWelcome';
import { StepAccessibility } from './steps/StepAccessibility';
import { StepIncome } from './steps/StepIncome';
import { StepBills } from './steps/StepBills';
import { StepLimits } from './steps/StepLimits';
import { StepGoal } from './steps/StepGoal';
import { StepPlan } from './steps/StepPlan';

/** Texto do botão principal de cada passo (design aprovado). */
const NEXT_LABEL: Record<number, string> = {
  1: 'Vamos começar',
  6: 'Criar meu plano',
  7: 'Abrir meu painel',
};

function loadDraft(userId: string): OnboardingState {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState();
  } catch {
    return initialState();
  }
}

/**
 * Onboarding em 7 passos (design aprovado em design/onboarding/).
 *  1 Boas-vindas · 2 Acessibilidade* · 3 Renda (obrigatório) · 4 Contas fixas e assinaturas*
 *  5 Limites por categoria* · 6 Primeira meta* · 7 Plano da IA + prévia do painel
 *  (* = tem "Pular")
 * Abre logo depois do cadastro (App.tsx mostra esta tela enquanto user.isConfigured for false).
 * As respostas ficam num rascunho no navegador: recarregar a página não perde nada.
 */
export const OnboardingPage: React.FC = () => {
  const { user, saveFinancialProfile } = useAuth();
  const userId = user?.id ?? 'anon';
  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] ?? '';

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [state, setState] = useState<OnboardingState>(() => loadDraft(userId));
  const [incomeError, setIncomeError] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const { step } = state;
  const prevStep = useRef(step);
  const meta = STEPS[step - 1];

  useEffect(() => savePrefs(prefs), [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey(userId), JSON.stringify(state));
    } catch {
      /* rascunho é opcional */
    }
  }, [state, userId]);

  // Ao trocar de passo: sobe a página e leva o foco ao título (o leitor de tela anuncia o passo).
  // Compara com o passo anterior (e não com "primeira vez") para funcionar também no StrictMode.
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('onb-title')?.focus({ preventScroll: true });
  }, [step]);

  const updatePrefs = useCallback((next: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...next })), []);
  const closePremium = useCallback(() => setPremiumOpen(false), []);
  const update = useCallback((next: Partial<OnboardingState>) => setState((s) => ({ ...s, ...next })), []);

  // O plano é gerado uma vez ao chegar no passo 7 (e refeito se a pessoa voltar e mudar algo)
  const plan = useMemo(() => (step === TOTAL_STEPS ? buildAiPlan(state) : []), [step, state]);

  const goTo = (target: number, extra: Partial<OnboardingState> = {}) => {
    setState((s) => {
      const next = { ...s, ...extra, step: target };
      // Limites: na primeira vez, sugere 3 categorias pela renda
      if (target === 5 && !next.limitsTouched) next.limits = defaultLimits(next.income);
      return next;
    });
  };

  const handleNext = () => {
    if (step === REQUIRED_STEP && state.income <= 0) {
      setIncomeError(true);
      document.getElementById('onb-income')?.focus();
      return;
    }
    if (step === TOTAL_STEPS) {
      finish();
      return;
    }
    goTo(step + 1, { skipped: state.skipped.filter((n) => n !== step) });
  };

  /** "Pular": deixa o passo em branco (nada é inventado) e segue. */
  const handleSkip = () => {
    const cleared: Partial<OnboardingState> =
      step === 4
        ? { bills: [], subscriptions: [] }
        : step === 5
          ? { limits: [], limitsTouched: true }
          : step === 6
            ? { goalId: null, goalName: '', goalAmount: 0 }
            : {};
    goTo(step + 1, { ...cleared, skipped: [...new Set([...state.skipped, step])] });
  };

  const finish = () => {
    saveFinancialProfile(toFinancialProfile(state, buildAiPlan(state)));
    try {
      localStorage.removeItem(draftKey(userId));
    } catch {
      /* nada */
    }
  };

  const stepProps: StepProps = {
    state,
    update,
    prefs,
    onPrefsChange: updatePrefs,
    openPremium: () => setPremiumOpen(true),
    firstName,
  };

  const tagDesktop = meta.optional ? (
    <button type="button" className={o.skip} onClick={handleSkip}>
      Pular <LuChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
    </button>
  ) : step === REQUIRED_STEP ? (
    <span className={o.req}>Obrigatória</span>
  ) : null;

  const bars = (
    <>
      {STEPS.map((s) => (
        <i key={s.n} className={s.n <= step ? o.barOn : ''} />
      ))}
    </>
  );

  return (
    <div
      className={pageClassName(
        prefs,
        [o.onb, prefs.dark ? o.dark : '', prefs.contrast ? o.highContrast : ''].filter(Boolean).join(' '),
      )}
      style={{ '--fs': FONT_STEPS[prefs.fontStep] } as React.CSSProperties}
    >
      {/* ------------------------- Painel roxo (desktop) ------------------------- */}
      <aside className={`${styles.hero} ${o.hero}`}>
        <img src={logo} alt="Paggo" className={styles.logo} style={{ alignSelf: 'flex-start' }} />
        <h1 className={`${styles.heroTitle} ${o.heroTitle}`}>
          Vamos montar
          <br />
          <span className={styles.heroTitleAccent}>o seu Paggo.</span>
        </h1>
        <p className={styles.heroText}>
          Algumas perguntas rápidas e o app já abre com seus números, seus limites e um plano feito para você.
        </p>
        <span className={o.time}>
          <LuClock size={16} aria-hidden="true" /> Leva menos de 2 minutos
        </span>
        <ol className={o.steps} aria-label="Passos do onboarding">
          {STEPS.map((s) => {
            const done = s.n < step;
            const cur = s.n === step;
            const content = (
              <>
                <b aria-hidden="true">{done ? <LuCheck size={15} strokeWidth={3} /> : s.n}</b>
                <span>
                  {s.name}
                  <span className="sr-only">{done ? ' (concluído, toque para voltar)' : cur ? ' (passo atual)' : ''}</span>
                </span>
                {s.optional && <i className={o.optTag}>opcional</i>}
              </>
            );
            return (
              <li key={s.n} className={done ? o.stepDone : cur ? o.stepCurrent : ''} aria-current={cur ? 'step' : undefined}>
                {done ? (
                  // Passo já feito: clicar volta para ele, com tudo preenchido
                  <button type="button" className={o.stepBtn} onClick={() => goTo(s.n)} title={`Voltar para ${s.name}`}>
                    {content}
                  </button>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
        <ul className={`${styles.heroBadges} ${o.heroBadges}`}>
          <li>
            <span aria-hidden="true">✏️</span> <strong>Dá para mudar tudo</strong> depois
          </li>
          <li>
            <span aria-hidden="true">🔒</span> <strong>Só você</strong> vê seus dados
          </li>
        </ul>
      </aside>

      {/* ------------------------- Cabeçalho roxo (celular) ------------------------- */}
      <header className={o.mHead}>
        <div className={o.mTop}>
          <img src={logo} alt="Paggo" className={`${styles.logo} ${o.mLogo}`} />
        </div>
        <div className={o.mStep}>
          <span>
            Passo {step} de {TOTAL_STEPS} · {meta.name}
          </span>
          {meta.optional ? (
            <button type="button" className={o.skip} onClick={handleSkip}>
              Pular <LuChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
          ) : step === REQUIRED_STEP ? (
            <span className={o.mReq}>Obrigatória</span>
          ) : null}
        </div>
        <div className={o.mBars} aria-hidden="true">
          {bars}
        </div>
      </header>

      {/* ------------------------------ Conteúdo ------------------------------ */}
      <main className={`${styles.formSide} ${o.formSide}`}>
        <div className={o.wrap}>
          <div className={o.progress}>
            <span className={o.progressLabel}>
              Passo <b>{step} de {TOTAL_STEPS}</b>
            </span>
            <div className={o.bars} aria-hidden="true">
              {bars}
            </div>
            {tagDesktop}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            noValidate
            aria-labelledby="onb-title"
          >
            {step === 1 && <StepWelcome {...stepProps} />}
            {step === 2 && <StepAccessibility {...stepProps} />}
            {step === 3 && <StepIncome {...stepProps} showError={incomeError} />}
            {step === 4 && <StepBills {...stepProps} />}
            {step === 5 && <StepLimits {...stepProps} />}
            {step === 6 && <StepGoal {...stepProps} />}
            {step === 7 && <StepPlan {...stepProps} plan={plan} />}

            <div className={o.btns}>
              {step > 1 && (
                <button type="button" className={o.back} onClick={() => goTo(step - 1)}>
                  <LuArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" /> Voltar
                </button>
              )}
              <button type="submit" className={o.submit}>
                {NEXT_LABEL[step] ?? 'Continuar'} <LuArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>

        <footer className={`${styles.footer} ${o.footer}`}>
          <LuShield size={15} aria-hidden="true" />
          <span>Seus dados ficam protegidos</span>
          <span aria-hidden="true">·</span>
          <a href="#termos">Termos</a>
          <span aria-hidden="true">·</span>
          <a href="#privacidade">Privacidade</a>
        </footer>
      </main>

      {premiumOpen && <PremiumModal onClose={closePremium} />}
    </div>
  );
};
