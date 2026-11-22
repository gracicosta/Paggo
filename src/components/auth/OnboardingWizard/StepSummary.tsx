import React from 'react';
import { LuCheck, LuArrowRight, LuShieldCheck, LuTrendingUp, LuReceipt, LuSlidersHorizontal, LuPiggyBank } from 'react-icons/lu';
import styles from './OnboardingWizard.module.css';

interface StepSummaryProps {
  name: string;
  totalIncome: number;
  totalFixed: number;
  totalBudgetedLimits: number;
  projectedMonthlySavings: number;
  goalsCount: number;
  onFinish: () => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({
  name,
  totalIncome,
  totalFixed,
  totalBudgetedLimits,
  projectedMonthlySavings,
  goalsCount,
  onFinish,
}) => {
  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge} style={{ background: '#DCFCE7', color: '#16a34a' }}>
          <LuCheck size={26} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Tudo pronto, {name}! Seu perfil financeiro foi calibrado.</h3>
          <p className={styles.stepDescription}>
            Confira o raio-x do seu planejamento antes de ativar o ConsumIQ com seus dados reais.
          </p>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardIcon} style={{ background: '#DCFCE7', color: '#16a34a' }}>
            <LuTrendingUp size={22} />
          </div>
          <div>
            <span className={styles.summaryCardLabel}>Renda Total Mensal</span>
            <strong className={styles.summaryCardValue}>
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardIcon} style={{ background: '#FEE2E2', color: '#dc2626' }}>
            <LuReceipt size={22} />
          </div>
          <div>
            <span className={styles.summaryCardLabel}>Compromissos Fixos</span>
            <strong className={styles.summaryCardValue}>
              R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardIcon} style={{ background: '#FEF3C7', color: '#d97706' }}>
            <LuSlidersHorizontal size={22} />
          </div>
          <div>
            <span className={styles.summaryCardLabel}>Tetos de Gastos Variáveis</span>
            <strong className={styles.summaryCardValue}>
              R$ {totalBudgetedLimits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryCardIcon} style={{ background: '#F3E8FF', color: '#7c3aed' }}>
            <LuPiggyBank size={22} />
          </div>
          <div>
            <span className={styles.summaryCardLabel}>Poupança Mensal Estimada</span>
            <strong className={styles.summaryCardValue}>
              R$ {Math.max(0, projectedMonthlySavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.validationCallout}>
        <LuShieldCheck size={24} className={styles.shieldIcon} />
        <div>
          <h4>Possibilidades Reais e Sustentáveis</h4>
          <p>
            Com este plano, você mantém todas as contas essenciais em dia, consome dentro dos limites de cada categoria e alimenta {goalsCount} meta(s) de economia sem gerar endividamento.
          </p>
        </div>
      </div>

      <div className={styles.finishArea}>
        <button type="button" onClick={onFinish} className={styles.finishButton}>
          Ativar Meu Dashboard Inteligente <LuArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
