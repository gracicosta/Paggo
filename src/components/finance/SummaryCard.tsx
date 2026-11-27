import { motion, type HTMLMotionProps } from 'motion/react';
import type { IconType } from 'react-icons';
import styles from './SummaryCard.module.css';

export type SummaryTone = 'ok' | 'bad' | 'warn';

interface Props {
  title: string;
  icon: IconType;
  /** Cor do quadradinho do ícone. Sem tom, o ícone aparece solto (cartão roxo). */
  tone?: SummaryTone;
  /** Cartão roxo de destaque (Saldo do mês). */
  hero?: boolean;
  value: React.ReactNode;
  /** O que vai embaixo do valor: um DeltaBadge ou uma nota. */
  children?: React.ReactNode;
  /** Classe extra da página (posição na grade, carrossel no celular…). */
  className?: string;
  /** Animação de entrada (veja components/animations/fade). */
  motionProps?: HTMLMotionProps<'article'>;
}

/** Cartão de resumo do mês: título + ícone, valor grande e um selo/nota. Usado no Dashboard e em Transações. */
export function SummaryCard({ title, icon: Icon, tone, hero = false, value, children, className = '', motionProps }: Props) {
  return (
    <motion.article {...motionProps} className={`${styles.card} ${hero ? styles.hero : ''} ${className}`}>
      <div className={styles.head}>
        {title}
        {tone ? (
          <span className={`${styles.iconBox} ${styles[tone]}`} aria-hidden="true">
            <Icon size={20} />
          </span>
        ) : (
          <Icon size={20} aria-hidden="true" />
        )}
      </div>
      <strong className={styles.value}>{value}</strong>
      {children}
    </motion.article>
  );
}

/** Nota pequena embaixo do valor (ex.: "4 compras no mês…"). */
export const SummaryNote = ({ children }: { children: React.ReactNode }) => (
  <small className={styles.note}>{children}</small>
);
