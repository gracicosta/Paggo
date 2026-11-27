import type { TransactionCategory } from '../../../../data/transactionCategories';
import type { PaletteId } from '../../../../types/prefs';
import { catColor } from '../../transactionUtils';
import txStyles from '../../Transactions.module.css';

export interface NewLimitPickerProps {
  /** Categorias que ainda não têm limite. */
  categories: TransactionCategory[];
  palette: PaletteId;
  dark: boolean;
  onPick: (id: string) => void;
}

/** Grade de categorias sem limite (mesmo visual do "Em quê?" do registro rápido). */
export function NewLimitPicker({ categories, palette, dark, onPick }: NewLimitPickerProps) {
  if (!categories.length) {
    return <p className={txStyles.muted}>Todas as categorias já têm limite. Para mudar um valor, toque na categoria na lista.</p>;
  }
  return (
    <div className={txStyles.catGrid} role="group" aria-label="Escolha a categoria">
      {categories.map((c) => {
        const Icon = c.icon;
        const color = catColor(c.id, palette, dark);
        return (
          <button key={c.id} type="button" className={txStyles.catBtn} onClick={() => onPick(c.id)}>
            <span className={txStyles.catIcon} style={{ background: `${color}22`, color }} aria-hidden="true">
              <Icon size={17} />
            </span>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
