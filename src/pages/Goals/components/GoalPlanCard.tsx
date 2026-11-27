import { LuCheck, LuCrown, LuMessageCircle, LuSparkles } from 'react-icons/lu';
import { RichText } from '../../../components/ui/RichText';
import type { GoalPlanStep } from '../goalPlan';
import styles from '../Goals.module.css';

export interface GoalPlanCardProps {
  /** Nome curto da meta ("Viagem"). */
  title: string;
  steps: GoalPlanStep[];
  /** O chat é do Premium: no grátis aparece o selo. */
  premium: boolean;
  onChat: () => void;
}

/** "Plano do Paggo": passos curtos para chegar na meta, no mesmo roxo da "Dica do Paggo". */
export function GoalPlanCard({ title, steps, premium, onChat }: GoalPlanCardProps) {
  let n = 0;
  return (
    <section className={styles.plan} aria-labelledby="plan-title">
      <h2 id="plan-title">
        <LuSparkles size={19} aria-hidden="true" /> Plano do Paggo para {title}
      </h2>
      <p className={styles.planSub}>Montado com os seus depósitos. Sem economês.</p>
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={s.done ? styles.planDone : ''}>
            <span className={styles.planNum} aria-hidden="true">
              {s.done ? <LuCheck size={14} /> : ++n}
            </span>
            <span>
              {s.done && <span className="sr-only">Feito: </span>}
              <RichText text={s.text} />
            </span>
          </li>
        ))}
      </ol>
      <button type="button" className={styles.planChat} onClick={onChat}>
        <LuMessageCircle size={17} /> Conversar com o Paggo
        {!premium && (
          <span className={styles.premiumTag}>
            <LuCrown size={12} /> Premium
          </span>
        )}
      </button>
    </section>
  );
}
