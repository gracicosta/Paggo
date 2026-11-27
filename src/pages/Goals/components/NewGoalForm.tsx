import { useId, useState } from 'react';
import { LuCheck, LuSparkles } from 'react-icons/lu';
import { GOAL_TYPES, goalTypeById } from '../../../data/goalTypes';
import { deadlineIn, monthlyFor, shortMonth, type NewGoalInput } from '../../../data/goalSummary';
import { brlInt } from '../../../utils/format';
import { AmountField } from '../../../components/ui/AmountField';
import { RichText } from '../../../components/ui/RichText';
import { NewGoalPicker } from './NewGoalPicker';
import txStyles from '../../Transactions/Transactions.module.css';
import limStyles from '../../Transactions/Limits.module.css';
import styles from '../Goals.module.css';

/** Prazos rápidos, em meses. */
const MONTH_OPTIONS = [
  { months: 6, label: '6 meses' },
  { months: 12, label: '1 ano' },
  { months: 18, label: '18 meses' },
  { months: 24, label: '2 anos' },
  { months: 36, label: '3 anos' },
];

export interface NewGoalFormProps {
  /** Tipo já escolhido no atalho (pode trocar aqui dentro). */
  initialType?: string;
  onSave: (input: NewGoalInput) => void;
  onCancel: () => void;
}

/** Criar meta em 3 passos: o quê, quanto e até quando. Mostra quanto guardar por mês antes de salvar. */
export function NewGoalForm({ initialType = 'viagem', onSave, onCancel }: NewGoalFormProps) {
  const uid = useId();
  const first = goalTypeById(initialType) ?? GOAL_TYPES[0];
  const [typeId, setTypeId] = useState(first.id);
  const [title, setTitle] = useState(first.id === 'outra' ? '' : first.label);
  const [cents, setCents] = useState(first.amount * 100);
  const [months, setMonths] = useState(12);
  const [tried, setTried] = useState(false);

  const amount = cents / 100;
  const titleError = tried && !title.trim() ? 'Dê um nome para a meta.' : '';
  const amountError = tried && cents <= 0 ? 'Digite quanto você quer juntar.' : '';

  const pickType = (id: string) => {
    const t = goalTypeById(id);
    if (!t) return;
    // Troca o nome e o valor sugeridos só se a pessoa ainda não mudou o nome
    const untouched = !title.trim() || GOAL_TYPES.some((g) => g.label === title);
    setTypeId(id);
    if (untouched) {
      setTitle(id === 'outra' ? '' : t.label);
      setCents(t.amount * 100);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!title.trim() || cents <= 0) return;
    onSave({ typeId, title: title.trim(), amount, months });
  };

  return (
    <form className={txStyles.form} onSubmit={submit} noValidate>
      <p className={txStyles.label}>1 · O que você quer conquistar?</p>
      <NewGoalPicker selected={typeId} types={GOAL_TYPES.map((t) => t.id)} onPick={pickType} />

      <label className={`${txStyles.metaField} ${styles.nameField} ${titleError ? styles.fieldBad : ''}`} htmlFor={`${uid}-title`}>
        Nome
        <input
          id={`${uid}-title`}
          value={title}
          maxLength={40}
          placeholder="Ex.: Viagem para Salvador"
          aria-invalid={!!titleError}
          aria-describedby={titleError ? `${uid}-title-err` : undefined}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      {titleError && (
        <p id={`${uid}-title-err`} className={txStyles.errorText} role="alert">
          {titleError}
        </p>
      )}

      <AmountField
        id={`${uid}-amount`}
        label="2 · Quanto você quer juntar?"
        cents={cents}
        onCentsChange={setCents}
        invalid={!!amountError}
        describedBy={amountError ? `${uid}-amount-err` : undefined}
      />
      {amountError && (
        <p id={`${uid}-amount-err`} className={txStyles.errorText} role="alert">
          {amountError}
        </p>
      )}

      <p className={txStyles.label}>3 · Em quanto tempo?</p>
      <div className={limStyles.quickValues} role="radiogroup" aria-label="Prazo">
        {MONTH_OPTIONS.map((o) => (
          <button
            key={o.months}
            type="button"
            role="radio"
            aria-checked={months === o.months}
            className={months === o.months ? limStyles.quickOn : ''}
            onClick={() => setMonths(o.months)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {amount > 0 && (
        <p className={limStyles.hint}>
          <LuSparkles size={18} aria-hidden="true" />
          <span>
            <RichText
              text={`Guardando **${brlInt(monthlyFor(amount, months))} por mês**, você chega lá em **${shortMonth(deadlineIn(months))}**.`}
            />
          </span>
        </p>
      )}

      <div className={txStyles.formActions}>
        <button type="button" className={txStyles.btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={`${txStyles.btnPrimary} ${txStyles.btnSave}`}>
          <LuCheck size={18} /> Criar meta
        </button>
      </div>
    </form>
  );
}
