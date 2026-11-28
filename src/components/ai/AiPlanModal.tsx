import { LuCrown, LuSparkles } from 'react-icons/lu';
import type { AiPlanAction } from '../../types/auth';
import { Modal } from '../ui/Modal';
import { RichText } from '../ui/RichText';
import styles from './Ai.module.css';

/**
 * Janela do "Plano com IA": as 3 ações práticas devolvidas por POST /ai/plan
 * (ou pelo plano local, com os mesmos números da tela).
 */
export function AiPlanModal({
  actions,
  loading,
  blocked,
  onClose,
}: {
  actions: AiPlanAction[];
  loading: boolean;
  /** Mensagem de cota estourada no grátis (Slide 8): mostra o convite do Premium. */
  blocked?: string;
  onClose: () => void;
}) {
  return (
    <Modal title="Seu plano do mês" onClose={onClose}>
      <p className={styles.planSub}>
        <LuSparkles size={15} aria-hidden="true" /> O Paggo olhou sua renda, seus limites e suas metas. Primeiros passos:
      </p>
      {loading ? (
        <p className={styles.planLoading} role="status">Montando seu plano…</p>
      ) : blocked ? (
        <div className={styles.planBlocked} role="alert">
          <LuCrown size={22} aria-hidden="true" />
          <p>{blocked}</p>
          <small>Por <b>R$ 14,90/mês</b>: planos ilimitados, assistente sem limite e histórico do ano todo.</small>
        </div>
      ) : (
        <ol className={styles.planList} aria-live="polite">
          {actions.map((a, i) => (
            <li key={i} className={styles.planItem}>
              <span className={styles.planNum} aria-hidden="true">{i + 1}</span>
              <div className={styles.planText}>
                <p><RichText text={a.text} /></p>
                <small>{a.detail}</small>
              </div>
              <span className={`${styles.planTag} ${a.tag === 'Atenção' ? styles.planTagWarn : ''}`}>{a.tag}</span>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
