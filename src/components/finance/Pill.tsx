import styles from './SummaryCard.module.css';

export type PillTone = 'ok' | 'warn' | 'bad' | 'hero' | 'info';

const TONE_CLASS: Record<PillTone, string> = {
  ok: styles.pillOk,
  warn: styles.pillWarn,
  bad: styles.pillBad,
  hero: styles.pillHero,
  info: styles.pillInfo,
};

/** Selo arredondado usado nos cartões de resumo ("▲ R$ 120 vs outubro", "Sobrou 30% da renda"…). */
export function Pill({ tone, title, children }: { tone: PillTone; title?: string; children: React.ReactNode }) {
  return (
    <span className={`${styles.pill} ${TONE_CLASS[tone]}`} title={title}>
      {children}
    </span>
  );
}
