import { LuCrown } from 'react-icons/lu';
import styles from '../Goals.module.css';

export interface FreePlanBarProps {
  used: number;
  limit: number;
  onUpgrade: () => void;
}

/** "Você usa 3 de 3 metas do plano grátis · Ver Premium" (só no plano grátis). */
export function FreePlanBar({ used, limit, onUpgrade }: FreePlanBarProps) {
  return (
    <div className={styles.freeBar}>
      <span className={styles.freeDots} aria-hidden="true">
        {Array.from({ length: limit + 1 }, (_, i) => (
          <i key={i} className={i < Math.min(used, limit) ? styles.dotOn : i === limit ? styles.dotLock : ''} />
        ))}
      </span>
      <span>
        Você usa <b>{Math.min(used, limit)} de {limit}</b> metas do plano grátis
      </span>
      <button type="button" className={styles.freeLink} onClick={onUpgrade}>
        <LuCrown size={16} /> Ver Premium
      </button>
    </div>
  );
}
