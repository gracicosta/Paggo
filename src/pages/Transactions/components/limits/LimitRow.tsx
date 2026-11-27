import { LuPencil, LuZap } from 'react-icons/lu';
import { categoryById } from '../../../../data/transactionCategories';
import type { PaletteId } from '../../../../types/prefs';
import { brl, brlInt } from '../../../../utils/format';
import { Pill } from '../../../../components/finance/Pill';
import { catColor } from '../../transactionUtils';
import { STATUS_LABEL, STATUS_SYMBOL, type LimitRowData } from '../../limitUtils';
import styles from '../../Limits.module.css';

export interface LimitRowProps {
  row: LimitRowData;
  /** Dias que faltam no mês (0 = mês que já passou). */
  days: number;
  /** Linha aberta no cartão "Editar limite". */
  selected: boolean;
  palette: PaletteId;
  dark: boolean;
  onEdit: (id: string) => void;
}

const PILL_TONE = { ok: 'ok', warn: 'warn', bad: 'bad' } as const;
const FILL = { ok: styles.fillOk, warn: styles.fillWarn, bad: styles.fillBad };

/** Uma categoria: gasto de limite, selo da faixa, barra com a marca dos 80% e uma frase simples. */
export function LimitRow({ row, days, selected, palette, dark, onEdit }: LimitRowProps) {
  const cat = categoryById(row.id);
  const Icon = cat.icon;
  const color = catColor(row.id, palette, dark);
  const percent = Math.round(row.used * 100);

  let note: React.ReactNode;
  if (row.left < -0.5) {
    note = (
      <>
        <LuZap size={14} aria-hidden="true" /> Passou <b className={styles.overText}>{brl(-row.left)}</b> do limite. Segure os
        gastos de {row.label.toLowerCase()} até o mês virar.
      </>
    );
  } else if (row.left <= 0.5) {
    note = <>O limite deste mês acabou.</>;
  } else if (row.status === 'warn' && days > 0) {
    note = (
      <>
        Faltam <b>{brl(row.left)}</b>, dá uns <b>{brlInt(row.left / days)} por dia</b> até o fim do mês.
      </>
    );
  } else {
    note = (
      <>
        Faltam <b>{brl(row.left)}</b>.{row.status === 'ok' ? ' Tudo certo por aqui.' : ''}
      </>
    );
  }

  return (
    <li className={`${styles.limitRow} ${selected ? styles.limitRowOn : ''}`}>
      <button
        type="button"
        className={styles.limitOpen}
        onClick={() => onEdit(row.id)}
        aria-label={`${row.label}: ${brl(row.spent)} de ${brl(row.limit)}, ${percent}%, ${STATUS_LABEL[row.status]}. Editar limite`}
      >
        <span className={styles.limitIcon} style={{ background: `${color}22`, color }} aria-hidden="true">
          <Icon size={19} />
        </span>
        <span className={styles.limitName}>
          <b>{row.label}</b>
          <span>
            <strong>{brl(row.spent)}</strong> de {brlInt(row.limit)}
          </span>
        </span>
        <span className={styles.limitPct}>
          <Pill tone={PILL_TONE[row.status]}>
            <span aria-hidden="true">{STATUS_SYMBOL[row.status]}</span> {STATUS_LABEL[row.status]}
          </Pill>
          {percent}%
        </span>
        <span className={styles.track} aria-hidden="true">
          <span className={`${styles.fill} ${FILL[row.status]}`} style={{ width: `${Math.min(100, row.used * 100)}%` }} />
          <span className={styles.mark80} />
        </span>
        <span className={styles.limitNote}>{note}</span>
      </button>
      <span className={styles.limitEdit} aria-hidden="true">
        <LuPencil size={16} />
      </span>
    </li>
  );
}
