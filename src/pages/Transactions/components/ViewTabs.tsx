import { LuArrowLeftRight, LuWallet } from 'react-icons/lu';
import styles from '../Limits.module.css';

/** As duas visões da aba Transações. */
export type TransactionsView = 'lancamentos' | 'limites';

const VIEWS: { id: TransactionsView; label: string; icon: typeof LuWallet }[] = [
  { id: 'lancamentos', label: 'Lançamentos', icon: LuArrowLeftRight },
  { id: 'limites', label: 'Limites do mês', icon: LuWallet },
];

export interface ViewTabsProps {
  view: TransactionsView;
  onChange: (view: TransactionsView) => void;
}

/** "Lançamentos | Limites do mês", embaixo do título das duas telas. */
export function ViewTabs({ view, onChange }: ViewTabsProps) {
  return (
    <nav className={styles.viewTabs} aria-label="Visão de Transações">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={view === id ? styles.viewOn : ''}
          aria-current={view === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={16} aria-hidden="true" /> {label}
        </button>
      ))}
    </nav>
  );
}
