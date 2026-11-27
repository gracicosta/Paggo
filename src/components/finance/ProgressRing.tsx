import styles from './ProgressRing.module.css';

export interface ProgressRingProps {
  /** 0 a 1 (acima de 1 fica cheio). */
  value: number;
  color: string;
  /** Tamanho em "em" (acompanha o A−/A+). Sem ele, vale o font-size da `className` (padrão 6.75em). */
  size?: number;
  /** Classe da tela (tamanho por CSS, inclusive no celular). */
  className?: string;
  /** Texto no meio; padrão: a porcentagem. */
  children?: React.ReactNode;
  /** Descrição para leitores de tela ("38% da meta Viagem"). */
  label?: string;
}

const R = 42;
const LENGTH = 2 * Math.PI * R;

/** Anel de progresso com a porcentagem no meio (metas e cofrinhos). */
export function ProgressRing({ value, color, size, className = '', children, label }: ProgressRingProps) {
  const filled = Math.max(0, Math.min(1, value)) * LENGTH;
  return (
    <span
      className={`${styles.ring} ${className}`}
      role="img"
      aria-label={label ?? `${Math.round(value * 100)}%`}
      style={size ? { fontSize: `${size}em` } : undefined}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={R} className={styles.track} />
        <circle cx="50" cy="50" r={R} className={styles.fill} stroke={color} strokeDasharray={`${filled} ${LENGTH}`} />
      </svg>
      <span className={styles.text} aria-hidden="true">
        {children ?? `${Math.round(value * 100)}%`}
      </span>
    </span>
  );
}
