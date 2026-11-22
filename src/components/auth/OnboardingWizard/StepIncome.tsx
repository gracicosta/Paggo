import React from 'react';
import { LuWallet, LuInfo } from 'react-icons/lu';
import styles from './OnboardingWizard.module.css';

interface StepIncomeProps {
  salary: number;
  extraIncome: number;
  onSalaryChange: (val: number) => void;
  onExtraIncomeChange: (val: number) => void;
}

export const StepIncome: React.FC<StepIncomeProps> = ({
  salary,
  extraIncome,
  onSalaryChange,
  onExtraIncomeChange,
}) => {
  const total = salary + extraIncome;

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge}>
          <LuWallet size={24} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Qual é a sua renda real mensal?</h3>
          <p className={styles.stepDescription}>
            Informe suas fontes líquidas de receita para calibrarmos suas possibilidades reais de gastos e economias.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Salário Líquido Mensal (Trabalho Principal)
          </label>
          <div className={styles.currencyInputWrapper}>
            <span className={styles.currencySymbol}>R$</span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="Ex: 5000"
              value={salary || ''}
              onChange={(e) => onSalaryChange(Number(e.target.value) || 0)}
              className={styles.currencyInput}
              autoFocus
            />
          </div>
          <span className={styles.inputHint}>Valor que cai na sua conta já livre de impostos e deduções.</span>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            Rendas Extras, Freelances ou Rendimentos
          </label>
          <div className={styles.currencyInputWrapper}>
            <span className={styles.currencySymbol}>R$</span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="Ex: 800"
              value={extraIncome || ''}
              onChange={(e) => onExtraIncomeChange(Number(e.target.value) || 0)}
              className={styles.currencyInput}
            />
          </div>
          <span className={styles.inputHint}>Média mensal de outras entradas, bonificações ou vendas.</span>
        </div>
      </div>

      <div className={styles.incomeHighlightCard}>
        <div className={styles.incomeHighlightText}>
          <span>Receita Total Mensal Disponível:</span>
          <strong>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div className={styles.tipBox}>
          <LuInfo size={18} />
          <span>Este total servirá como base para seus tetos de despesas e capacidade de poupança nos próximos passos.</span>
        </div>
      </div>
    </div>
  );
};
