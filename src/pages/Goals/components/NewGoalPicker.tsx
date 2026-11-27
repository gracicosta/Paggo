import { GOAL_TYPES, QUICK_GOAL_TYPES } from '../../../data/goalTypes';
import txStyles from '../../Transactions/Transactions.module.css';

export interface NewGoalPickerProps {
  /** Tipo marcado (no formulário); sem ele, nenhum. */
  selected?: string;
  /** Ids a mostrar (padrão: QUICK_GOAL_TYPES). */
  types?: string[];
  onPick: (typeId: string) => void;
}

/** Grade "O que você quer conquistar?" (mesmo visual da escolha de categoria do Registro rápido). */
export function NewGoalPicker({ selected, types = QUICK_GOAL_TYPES, onPick }: NewGoalPickerProps) {
  return (
    <div className={txStyles.catGrid} role="group" aria-label="Tipo de meta">
      {GOAL_TYPES.filter((t) => types.includes(t.id)).map((t) => {
        const Icon = t.icon;
        const on = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className={`${txStyles.catBtn} ${on ? txStyles.catBtnOn : ''}`}
            aria-pressed={selected ? on : undefined}
            onClick={() => onPick(t.id)}
          >
            <span className={txStyles.catIcon} style={{ background: `${t.color}22`, color: t.color }} aria-hidden="true">
              <Icon size={17} />
            </span>
            {t.id === 'casa' ? 'Imóvel' : t.id === 'reserva' ? 'Reserva' : t.label}
          </button>
        );
      })}
    </div>
  );
}
