import { useEffect, useId, useRef, useState } from 'react';
import { LuCheck, LuPencil, LuZap } from 'react-icons/lu';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../data/transactionCategories';
import { toIsoDate } from '../../utils/dates';
import type { PaletteId } from '../../types/prefs';
import type { PaymentMethod, TransactionInput, TransactionKind } from '../../types/transactions';
import { catColor } from './transactionUtils';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { DatePicker } from '../../components/ui/DatePicker';
import { AmountField } from '../../components/ui/AmountField';
import styles from './Transactions.module.css';

interface Props {
  /** Valores iniciais (edição) ou só o tipo (nova receita/despesa). */
  initial?: Partial<TransactionInput>;
  /** "quick" = cartão "Registro rápido" (3 toques); "full" = janela de nova/editar transação. */
  variant: 'quick' | 'full';
  palette: PaletteId;
  dark: boolean;
  onSave: (input: TransactionInput) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function TransactionForm({ initial, variant, palette, dark, onSave, onCancel, autoFocus }: Props) {
  const uid = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const editing = initial?.amount !== undefined;

  const [kind, setKind] = useState<TransactionKind>(initial?.kind ?? 'despesa');
  const [cents, setCents] = useState(() => Math.round((initial?.amount ?? 0) * 100));
  const [category, setCategory] = useState(initial?.category ?? '');
  const [date, setDate] = useState(initial?.date ?? toIsoDate(new Date()));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? (initial?.kind === 'receita' ? 'pix' : 'debito'));
  const [impulse, setImpulse] = useState(initial?.impulse ?? false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (autoFocus) amountRef.current?.focus();
  }, [autoFocus]);

  const categories = kind === 'despesa' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const amountError = tried && cents <= 0 ? 'Digite um valor maior que zero.' : '';
  const categoryError = tried && !category ? 'Escolha uma categoria.' : '';
  const today = toIsoDate(new Date());

  const switchKind = (k: TransactionKind) => {
    if (k === kind) return;
    setKind(k);
    setCategory('');
    setImpulse(false);
    setMethod(k === 'receita' ? 'pix' : 'debito');
  };

  const reset = () => {
    setCents(0);
    setCategory('');
    setDescription('');
    setDate(toIsoDate(new Date()));
    setImpulse(false);
    setTried(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (cents <= 0 || !category) {
      (cents <= 0 ? amountRef.current : document.getElementById(`${uid}-cat`))?.focus();
      return;
    }
    const label = categories.find((c) => c.id === category)?.label ?? '';
    onSave({
      kind,
      amount: cents / 100,
      category,
      date: date || today,
      description: description.trim() || label,
      method,
      impulse: kind === 'despesa' && impulse,
    });
    if (variant === 'quick') reset();
  };

  const step = cents > 0 ? (category ? 3 : 2) : 1;
  const kindLabel = kind === 'despesa' ? 'despesa' : 'receita';

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {variant === 'quick' && (
        <div className={styles.steps3} aria-hidden="true">
          <span className={step >= 1 ? styles.stepOn : ''} />
          <span className={step >= 2 ? styles.stepOn : ''} />
          <span className={step >= 3 ? styles.stepOn : ''} />
        </div>
      )}

      <div className={styles.kindSwitch} role="radiogroup" aria-label="Tipo de transação">
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'receita'}
          className={kind === 'receita' ? styles.kindIncome : ''}
          onClick={() => switchKind('receita')}
        >
          + Receita
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === 'despesa'}
          className={kind === 'despesa' ? styles.kindExpense : ''}
          onClick={() => switchKind('despesa')}
        >
          − Despesa
        </button>
      </div>

      <AmountField
        ref={amountRef}
        id={`${uid}-amount`}
        label="1 · Quanto foi?"
        cents={cents}
        onCentsChange={setCents}
        invalid={!!amountError}
        describedBy={amountError ? `${uid}-amount-err` : undefined}
      />
      {amountError && (
        <p id={`${uid}-amount-err`} className={styles.errorText} role="alert">
          {amountError}
        </p>
      )}

      <div className={styles.label} id={`${uid}-cat-label`}>
        2 · Em quê?
      </div>
      <div
        id={`${uid}-cat`}
        tabIndex={-1}
        className={`${styles.catGrid} ${kind === 'receita' ? styles.catGridIncome : ''}`}
        role="radiogroup"
        aria-labelledby={`${uid}-cat-label`}
      >
        {categories.map((c) => {
          const color = catColor(c.id, palette, dark);
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              className={`${styles.catBtn} ${category === c.id ? styles.catBtnOn : ''}`}
              onClick={() => setCategory(c.id)}
            >
              <span className={styles.catIcon} style={{ background: `${color}22`, color }}>
                <Icon size={16} />
              </span>
              {c.label}
            </button>
          );
        })}
      </div>
      {categoryError && (
        <p className={styles.errorText} role="alert">
          {categoryError}
        </p>
      )}

      <div className={styles.metaRow}>
        <DatePicker value={date || today} max={today} onChange={setDate} />
        <label className={styles.metaField}>
          <LuPencil size={16} aria-hidden="true" />
          <span className={styles.srOnly}>Descrição</span>
          <input
            type="text"
            placeholder="Descrição (opcional)"
            maxLength={60}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      {variant === 'full' && (
        <SelectMenu
          label={kind === 'receita' ? 'Como recebeu?' : 'Como pagou?'}
          value={method}
          options={PAYMENT_METHODS}
          onChange={setMethod}
        />
      )}

      {kind === 'despesa' && (
        <label className={styles.impulseBox}>
          <span className={styles.impulseIcon} aria-hidden="true">
            <LuZap size={17} />
          </span>
          <span>
            <b>Foi por impulso?</b>
            <small>Ajuda a ver quanto sai sem planejar</small>
          </span>
          <input type="checkbox" role="switch" checked={impulse} onChange={(e) => setImpulse(e.target.checked)} />
          <span className={styles.switch} aria-hidden="true" />
        </label>
      )}

      <div className={styles.formActions}>
        {onCancel && (
          <button type="button" className={styles.btnGhost} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className={`${styles.btnPrimary} ${styles.btnSave}`}>
          <LuCheck size={19} />{' '}
          {variant === 'quick' ? `3 · Salvar ${kindLabel}` : editing ? 'Salvar alterações' : `Salvar ${kindLabel}`}
        </button>
      </div>
    </form>
  );
}
