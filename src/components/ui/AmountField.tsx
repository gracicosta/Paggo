import { centsToText, typedCents } from '../../utils/format';
import styles from './AmountField.module.css';

export interface AmountFieldProps {
  id: string;
  /** Texto pequeno em cima do valor ("Quanto foi?", "Limite por mês"…). */
  label: string;
  /** Valor em centavos (4590 = R$ 45,90). */
  cents: number;
  onCentsChange: (cents: number) => void;
  /** Campo com erro: borda vermelha (a mensagem fica com a tela, no id de `describedBy`). */
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Campo grande de dinheiro ("R$ 150,00") estilo caixa eletrônico: cada número entra pela direita.
 * Usado no Registro rápido, no limite por categoria e no depósito das metas.
 */
export function AmountField({ id, label, cents, onCentsChange, invalid = false, describedBy, autoFocus, ref }: AmountFieldProps) {
  return (
    <label className={`${styles.box} ${invalid ? styles.invalid : ''}`} htmlFor={id}>
      <small>{label}</small>
      <span>
        <em>R$</em>
        <input
          ref={ref}
          id={id}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          value={centsToText(cents)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onCentsChange(typedCents(e.target.value))}
        />
      </span>
    </label>
  );
}
