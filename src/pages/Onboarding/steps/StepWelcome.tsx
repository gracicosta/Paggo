import React from 'react';
import { LuClock } from 'react-icons/lu';
import { Emo, StepTitle, type StepProps } from '../OnboardingUi';
import { TOTAL_STEPS } from '../onboardingData';
import o from '../Onboarding.module.css';

const FEATURES = [
  { emoji: '📊', tone: 'p', title: 'Veja para onde vai seu dinheiro', text: 'Gráficos simples mostram quanto entra, quanto sai e o que sobra.' },
  { emoji: '🎯', tone: 'g', title: 'Defina limites e metas', text: 'Avisamos antes de você passar do limite e mostramos quanto falta para sua meta.' },
  { emoji: '✨', tone: 'y', title: 'Um plano feito pela IA', text: 'Dicas do dia a dia, em palavras simples, para o seu jeito de gastar.' },
] as const;

/** Passo 1: boas-vindas e o que o Paggo faz. */
export const StepWelcome: React.FC<StepProps> = ({ prefs, firstName }) => (
  <>
    <div className={o.hi}>
      <span className={o.wave} aria-hidden="true">
        👋
      </span>
      <StepTitle>{firstName ? `Oi, ${firstName}! Que bom ter você aqui.` : 'Oi! Que bom ter você aqui.'}</StepTitle>
    </div>
    <p className={o.sub}>O Paggo ajuda você a entender e organizar o seu dinheiro, sem complicação. Veja o que dá para fazer:</p>

    <ul className={o.feat}>
      {FEATURES.map((f) => (
        <li key={f.title} className={o.card}>
          <Emo emoji={f.emoji} tone={f.tone} dark={prefs.dark} />
          <div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        </li>
      ))}
    </ul>

    <div className={o.peek}>
      <LuClock size={20} aria-hidden="true" />
      <div>
        <b>São {TOTAL_STEPS} passos rápidos.</b>
        Só a renda é obrigatória. O resto você pode pular e preencher depois.
      </div>
    </div>
  </>
);
