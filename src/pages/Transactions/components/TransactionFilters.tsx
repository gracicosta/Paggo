import { LuFilter, LuSearch, LuZap } from 'react-icons/lu';
import { EXPENSE_CATEGORIES } from '../../../data/transactionCategories';
import type { PaletteId } from '../../../types/prefs';
import type { KindFilter, TransactionFiltersState } from '../hooks/useTransactionFilters';
import { catColor } from '../transactionUtils';
import styles from '../Transactions.module.css';

export interface TransactionFiltersProps {
  /** Estado e ações vindos de useTransactionFilters. */
  filters: TransactionFiltersState;
  palette: PaletteId;
  dark: boolean;
}

const KIND_LABEL: Record<KindFilter, string> = { todas: 'Todas', receita: 'Receitas', despesa: 'Despesas' };

/** Busca + "Todas / Receitas / Despesas" + chips de categoria e "Só impulso". */
export function TransactionFilters({ filters: f, palette, dark }: TransactionFiltersProps) {
  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <LuSearch size={18} aria-hidden="true" />
          <span className={styles.srOnly}>Buscar transação</span>
          <input
            type="search"
            placeholder="Buscar por nome, valor ou categoria"
            value={f.search}
            onChange={(e) => f.changeSearch(e.target.value)}
          />
        </label>
        <div className={styles.seg} role="radiogroup" aria-label="Mostrar">
          {(Object.keys(KIND_LABEL) as KindFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={f.kindFilter === k}
              className={f.kindFilter === k ? styles.segOn : ''}
              onClick={() => f.changeKind(k)}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chips} role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          className={`${styles.chip} ${!f.catFilter && !f.onlyImpulse ? styles.chipOn : ''}`}
          aria-pressed={!f.catFilter && !f.onlyImpulse}
          onClick={f.showAllCategories}
        >
          <LuFilter size={15} /> Todas as categorias
        </button>
        {EXPENSE_CATEGORIES.filter((c) => c.id !== 'outros').map((c) => {
          const Icon = c.icon;
          const on = f.catFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              aria-pressed={on}
              onClick={() => f.toggleCategory(c.id)}
            >
              <Icon size={14} color={catColor(c.id, palette, dark)} aria-hidden="true" /> {c.label}
            </button>
          );
        })}
        <button
          type="button"
          className={`${styles.chip} ${styles.chipImpulse} ${f.onlyImpulse ? styles.chipOn : ''}`}
          aria-pressed={f.onlyImpulse}
          onClick={f.toggleImpulse}
        >
          <LuZap size={15} /> Só impulso
        </button>
      </div>
    </>
  );
}
