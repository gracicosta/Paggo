import React, { useEffect, useRef } from 'react';
import { LuCheck, LuCrown, LuX } from 'react-icons/lu';
import type { Prefs } from '../Auth/authPrefs';
import { FREE_CATEGORY_LIMITS, FREE_SUBSCRIPTIONS, PREMIUM_PRICE, TONES, type OnboardingState, type Tone } from './onboardingData';
import o from './Onboarding.module.css';

/** O que cada passo recebe do OnboardingPage. */
export interface StepProps {
  state: OnboardingState;
  update: (next: Partial<OnboardingState>) => void;
  prefs: Prefs;
  onPrefsChange: (next: Partial<Prefs>) => void;
  openPremium: () => void;
  firstName: string;
}

/** Quadradinho colorido com emoji. */
export const Emo: React.FC<{ emoji: string; tone: Tone; dark: boolean }> = ({ emoji, tone, dark }) => (
  <span className={o.emo} style={{ background: TONES[tone][dark ? 'dark' : 'light'] }} aria-hidden="true">
    {emoji}
  </span>
);

/** Bolinha com ✓ dos cartões selecionados (a seleção não depende só da cor). */
export const Check: React.FC = () => (
  <span className={o.check} aria-hidden="true">
    <LuCheck size={13} strokeWidth={3} />
  </span>
);

/** Título do passo: o OnboardingPage leva o foco até ele ao trocar de passo (o leitor de tela anuncia). */
export const StepTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className={o.title} tabIndex={-1} id="onb-title">
    {children}
  </h2>
);

/** Janela "Conheça o Premium" (o pagamento ainda não existe no protótipo). */
export const PremiumModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [asked, setAsked] = React.useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={o.modalBack} onClick={onClose}>
      <div
        className={o.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={o.modalHead}>
          <span className={o.crown} aria-hidden="true">
            <LuCrown size={22} />
          </span>
          <h2 id="premium-title">Paggo Premium</h2>
          <button type="button" className={o.iconBtn} style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Fechar">
            <LuX size={18} />
          </button>
        </div>
        <p className={o.price}>
          {PREMIUM_PRICE} <small>por mês</small>
        </p>
        <ul className={o.perks}>
          <li>
            <LuCheck size={16} strokeWidth={3} aria-hidden="true" />
            Assinaturas sem limite (no grátis são {FREE_SUBSCRIPTIONS})
          </li>
          <li>
            <LuCheck size={16} strokeWidth={3} aria-hidden="true" />
            Limites em todas as categorias (no grátis são {FREE_CATEGORY_LIMITS})
          </li>
          <li>
            <LuCheck size={16} strokeWidth={3} aria-hidden="true" />
            Assistente de IA sem limite de conversas
          </li>
          <li>
            <LuCheck size={16} strokeWidth={3} aria-hidden="true" />
            Várias metas ao mesmo tempo
          </li>
        </ul>
        {asked && (
          <p className={o.note} role="status">
            O pagamento chega na próxima versão. Você poderá assinar pelo menu do painel. Por enquanto, siga no plano grátis.
          </p>
        )}
        <div className={o.modalBtns}>
          <button type="button" className={o.back} onClick={onClose} ref={closeRef}>
            Agora não
          </button>
          <button type="button" className={o.submit} onClick={() => setAsked(true)}>
            Quero o Premium
          </button>
        </div>
      </div>
    </div>
  );
};
