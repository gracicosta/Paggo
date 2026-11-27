import { categoryById } from '../../../data/transactionCategories';
import type { PaletteId } from '../../../types/prefs';
import { brl, brlShort } from '../../../utils/format';
import { OTHER_SLICE_ID, catColor } from '../transactionUtils';
import styles from '../Transactions.module.css';

export interface CategoryDonutProps {
  /** Pares [id da categoria, valor gasto], já ordenados (veja topCategories). */
  data: [string, number][];
  /** Total que saiu no mês (centro da rosca). */
  total: number;
  palette: PaletteId;
  dark: boolean;
}

/** Rosca com as maiores categorias do mês. A legenda repete os números (a cor não é a única informação). */
export function CategoryDonut({ data, total, palette, dark }: CategoryDonutProps) {
  // Onde cada fatia começa (soma das anteriores, em %)
  const starts = data.map((_, i) => (total ? (data.slice(0, i).reduce((s, [, v]) => s + v, 0) / total) * 100 : 0));
  const colorOf = (id: string) => (id === OTHER_SLICE_ID ? 'var(--muted)' : catColor(id, palette, dark));
  const labelOf = (id: string) => (id === OTHER_SLICE_ID ? 'Outras' : categoryById(id).label);
  const short = brlShort(total);

  return (
    <div className={styles.donut}>
      <svg viewBox="0 0 42 42" role="img" aria-label={`Saiu ${brl(total)} no mês`}>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--track)" strokeWidth="5.2" />
        {data.map(([id, v], i) => {
          const p = total ? (v / total) * 100 : 0;
          return (
            <circle
              key={id}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={colorOf(id)}
              strokeWidth="5.2"
              strokeDasharray={`${Math.max(0, p - 0.8)} ${100 - Math.max(0, p - 0.8)}`}
              strokeDashoffset={25 - starts[i]}
            />
          );
        })}
        <text x="21" y="19.6" textAnchor="middle" className={styles.donutSmall}>
          Saiu
        </text>
        <text x="21" y="25" textAnchor="middle" className={styles.donutBig}>
          {short}
        </text>
      </svg>
      <ul className={styles.legend}>
        {data.map(([id, v]) => (
          <li key={id}>
            <i style={{ background: colorOf(id) }} aria-hidden="true" />
            {labelOf(id)}
            <span>{total ? Math.round((v / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
