import { useId, useState } from 'react';
import { LuCheck, LuMinus, LuPlus, LuSparkles, LuTrash2 } from 'react-icons/lu';
import { categoryById } from '../../../../data/transactionCategories';
import type { PaletteId } from '../../../../types/prefs';
import { brl, brlInt, centsToText, pct, typedCents } from '../../../../utils/format';
import { catColor } from '../../transactionUtils';
import { quickValues, suggestedLimit } from '../../limitUtils';
import txStyles from '../../Transactions.module.css';
import styles from '../../Limits.module.css';

export interface LimitEditorProps {
  categoryId: string;
  /** Limite atual (undefined = criando um limite novo). */
  limit?: number;
  /** Quanto já saiu na categoria no mês escolhido. */
  spent: number;
  /** Média dos últimos 3 meses na categoria (0 = sem histórico). */
  average: number;
  palette: PaletteId;
  dark: boolean;
  onSave: (limit: number) => void;
  /** Só na edição: tira o limite da categoria. */
  onRemove?: () => void;
  /** Na janela do celular: botão "Cancelar" no lugar do "Remover". */
  onCancel?: () => void;
  autoFocus?: boolean;
}

/** Passo dos botões − e +. */
const STEP = 50;

/**
 * Formulário do limite de uma categoria: valor com − e +, valores rápidos e uma sugestão
 * pela média dos últimos meses. Usado no cartão da direita (computador) e na janela (celular).
 */
export function LimitEditor({ categoryId, limit, spent, average, palette, dark, onSave, onRemove, onCancel, autoFocus }: LimitEditorProps) {
  const uid = useId();
  const cat = categoryById(categoryId);
  const Icon = cat.icon;
  const color = catColor(categoryId, palette, dark);
  const suggestion = suggestedLimit(average);
  const [cents, setCents] = useState(() => Math.round((limit ?? suggestion) * 100));
  const [tried, setTried] = useState(false);
  const value = cents / 100;
  const error = tried && cents <= 0 ? 'Digite um limite maior que zero.' : '';

  const step = (dir: 1 | -1) => setCents((c) => Math.max(0, (Math.round(c / 100 / STEP) + dir) * STEP * 100));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (cents > 0) onSave(value);
  };

  return (
    <form className={styles.editor} onSubmit={submit} noValidate>
      <div className={styles.editorWho}>
        <span className={styles.limitIcon} style={{ background: `${color}22`, color }} aria-hidden="true">
          <Icon size={19} />
        </span>
        <span>
          <b>{cat.label}</b>
          <small>
            {limit
              ? `Usou ${brl(spent)} de ${brlInt(limit)} (${pct(spent / limit)})`
              : spent > 0
                ? `Já saiu ${brl(spent)} neste mês`
                : 'Ainda sem gastos neste mês'}
          </small>
        </span>
      </div>

      <div className={styles.stepper}>
        <button type="button" onClick={() => step(-1)} aria-label={`Diminuir ${STEP} reais`} disabled={cents <= 0}>
          <LuMinus size={18} />
        </button>
        <label className={`${txStyles.amountBox} ${error ? txStyles.fieldError : ''}`} htmlFor={`${uid}-limit`}>
          <small>Limite por mês</small>
          <span>
            <em>R$</em>
            <input
              id={`${uid}-limit`}
              inputMode="numeric"
              autoComplete="off"
              autoFocus={autoFocus}
              value={centsToText(cents)}
              aria-invalid={!!error}
              aria-describedby={error ? `${uid}-err` : undefined}
              onChange={(e) => setCents(typedCents(e.target.value))}
            />
          </span>
        </label>
        <button type="button" onClick={() => step(1)} aria-label={`Aumentar ${STEP} reais`}>
          <LuPlus size={18} />
        </button>
      </div>
      {error && (
        <p id={`${uid}-err`} className={txStyles.errorText} role="alert">
          {error}
        </p>
      )}

      <p className={txStyles.label}>Valores rápidos</p>
      <div className={styles.quickValues} role="group" aria-label="Valores rápidos">
        {quickValues(average, limit ?? 0).map((v) => (
          <button
            key={v}
            type="button"
            className={Math.round(value) === v ? styles.quickOn : ''}
            aria-pressed={Math.round(value) === v}
            onClick={() => setCents(v * 100)}
          >
            {brlInt(v)}
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        <LuSparkles size={18} aria-hidden="true" />
        {average > 0 ? (
          <span>
            Nos últimos 3 meses você gastou em média <b>{brlInt(average)}</b> com {cat.label.toLowerCase()}.{' '}
            <b>{brlInt(suggestion)}</b> é um limite que dá para cumprir.
          </span>
        ) : (
          <span>
            Ainda não há gastos de {cat.label.toLowerCase()} nos últimos meses. Comece com um valor pequeno e ajuste depois.
          </span>
        )}
      </p>

      <div className={txStyles.formActions}>
        {onRemove ? (
          <button type="button" className={`${txStyles.btnSecondary} ${styles.btnRemove}`} onClick={onRemove}>
            <LuTrash2 size={17} /> Remover
          </button>
        ) : (
          onCancel && (
            <button type="button" className={txStyles.btnSecondary} onClick={onCancel}>
              Cancelar
            </button>
          )
        )}
        <button type="submit" className={`${txStyles.btnPrimary} ${txStyles.btnSave}`}>
          <LuCheck size={18} /> {limit ? 'Salvar limite' : 'Criar limite'}
        </button>
      </div>
    </form>
  );
}
