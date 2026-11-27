import { LuCrown, LuLock } from 'react-icons/lu';
import { PREMIUM_PRICE } from '../../../data/plans';
import txStyles from '../../Transactions/Transactions.module.css';
import styles from '../Goals.module.css';

export interface PremiumGoalSlotProps {
  /** Quantas metas cabem no grátis. */
  freeLimit: number;
  onUpgrade: () => void;
}

/** Vaga trancada no lugar da próxima meta, quando o plano grátis já está cheio. */
export function PremiumGoalSlot({ freeLimit, onUpgrade }: PremiumGoalSlotProps) {
  return (
    <article className={styles.lock} aria-labelledby="premium-slot-title">
      <span className={styles.lockIcon} aria-hidden="true">
        <LuLock size={26} />
      </span>
      <b id="premium-slot-title">Quer uma {freeLimit + 1}ª meta?</b>
      <p>
        No plano grátis você tem até <b>{freeLimit} metas</b> ao mesmo tempo. No <b>Premium</b> são ilimitadas, com plano do
        Paggo para cada uma.
      </p>
      <ul className={styles.lockIdeas} aria-label="Ideias de metas">
        <li>Carro</li>
        <li>Estudos</li>
        <li>Casamento</li>
        <li>Outra</li>
      </ul>
      <button type="button" className={txStyles.btnPrimary} onClick={onUpgrade}>
        <LuCrown size={17} /> Ser Premium · {PREMIUM_PRICE}/mês
      </button>
    </article>
  );
}
