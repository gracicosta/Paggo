import React from 'react';
import { LuSlidersHorizontal, LuUtensils, LuGamepad, LuCar, LuHeartPulse, LuGraduationCap, LuUser } from 'react-icons/lu';
import { FaHouse, FaEllipsis, FaCircleExclamation, FaCircleCheck } from 'react-icons/fa6';
import type { CategoryBudgetItem } from '../../../types/auth';
import styles from './OnboardingWizard.module.css';

interface StepCategoryLimitsProps {
  totalIncome: number;
  fixedCommitments: number;
  categoryBudgets: CategoryBudgetItem[];
  onCategoriesChange: (categories: CategoryBudgetItem[]) => void;
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'alimentacao':
      return LuUtensils;
    case 'lazer':
      return LuGamepad;
    case 'transporte':
      return LuCar;
    case 'saude':
      return LuHeartPulse;
    case 'educacao':
      return LuGraduationCap;
    case 'casa':
      return FaHouse;
    case 'despesasPessoais':
      return LuUser;
    default:
      return FaEllipsis;
  }
};

export const StepCategoryLimits: React.FC<StepCategoryLimitsProps> = ({
  totalIncome,
  fixedCommitments,
  categoryBudgets,
  onCategoriesChange,
}) => {
  const availableForSpending = Math.max(0, totalIncome - fixedCommitments);
  const totalBudgetedLimits = categoryBudgets.reduce((acc, c) => acc + (c.limit || 0), 0);
  const percentageOfAvailable = availableForSpending > 0 ? (totalBudgetedLimits / availableForSpending) * 100 : 0;
  const isOverBudget = totalBudgetedLimits > availableForSpending && availableForSpending > 0;

  const handleLimitChange = (id: string, newLimit: number) => {
    onCategoriesChange(
      categoryBudgets.map((cat) => (cat.id === id ? { ...cat, limit: Math.max(0, newLimit) } : cat))
    );
  };

  const handleApplyRecommended = () => {
    if (availableForSpending <= 0) return;
    const proportions: Record<string, number> = {
      alimentacao: 0.35,
      transporte: 0.18,
      lazer: 0.14,
      saude: 0.08,
      despesasPessoais: 0.10,
      casa: 0.08,
      outros: 0.07,
    };

    onCategoriesChange(
      categoryBudgets.map((cat) => {
        const prop = proportions[cat.id] || 0.05;
        const recommendedLimit = Math.round((availableForSpending * 0.75 * prop) / 10) * 10;
        return {
          ...cat,
          limit: Math.max(100, recommendedLimit),
        };
      })
    );
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge}>
          <LuSlidersHorizontal size={24} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Possibilidades Reais de Gastos (Tetos por Categoria)</h3>
          <p className={styles.stepDescription}>
            Defina limites orçamentários realistas para não ter surpresas com despesas variáveis no fim do mês.
          </p>
        </div>
      </div>

      <div className={styles.budgetOverviewBanner}>
        <div className={styles.budgetOverviewCol}>
          <span>Disponível após contas fixas:</span>
          <strong>R$ {availableForSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={styles.budgetOverviewDivider} />
        <div className={styles.budgetOverviewCol}>
          <span>Soma dos tetos planejados:</span>
          <strong style={{ color: isOverBudget ? '#ef4444' : '#22c55e' }}>
            R$ {totalBudgetedLimits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <button
          type="button"
          onClick={handleApplyRecommended}
          className={styles.applyRecommendedButton}
        >
          Sugerir Tetos Ideais
        </button>
      </div>

      <div className={styles.meterContainer}>
        <div className={styles.meterLabels}>
          <span>Comprometimento do orçamento variável:</span>
          <span style={{ fontWeight: 600, color: isOverBudget ? '#ef4444' : '#0f172a' }}>
            {Math.round(percentageOfAvailable)}%
          </span>
        </div>
        <div className={styles.meterTrack}>
          <div
            className={styles.meterFill}
            style={{
              width: `${Math.min(percentageOfAvailable, 100)}%`,
              backgroundColor: isOverBudget ? '#ef4444' : percentageOfAvailable > 85 ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
        {isOverBudget ? (
          <div className={styles.warningMessage}>
            <FaCircleExclamation size={16} />
            <span>Atenção: A soma dos limites ultrapassa o valor disponível. Reduza alguns tetos para sobrar para economias.</span>
          </div>
        ) : (
          <div className={styles.successMessage}>
            <FaCircleCheck size={16} />
            <span>Orçamento equilibrado! Você terá folga financeira para atingir suas metas de poupança no próximo passo.</span>
          </div>
        )}
      </div>

      <div className={styles.categoryGrid}>
        {categoryBudgets.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          return (
            <div key={cat.id} className={styles.categoryLimitCard}>
              <div className={styles.categoryTopLine}>
                <div className={styles.categoryIconCircle} style={{ background: cat.background, color: cat.color }}>
                  <Icon size={18} />
                </div>
                <span className={styles.categoryNameText}>{cat.name}</span>
              </div>
              <div className={styles.categoryInputWrap}>
                <span className={styles.currencyPrefix}>R$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={cat.limit || ''}
                  onChange={(e) => handleLimitChange(cat.id, Number(e.target.value) || 0)}
                  className={styles.categoryLimitInput}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
