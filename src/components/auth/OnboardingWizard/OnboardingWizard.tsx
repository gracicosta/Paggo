import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { useAuth } from '../../../context/AuthContext';
import { DEFAULT_CATEGORIES } from '../../../data/defaultFinancialProfile';
import type { FixedBillItem, SubscriptionItem, CategoryBudgetItem, PiggyBankItemModel, UserFinancialProfile } from '../../../types/auth';

import { StepIncome } from './StepIncome';
import { StepBills } from './StepBills';
import { StepCategoryLimits } from './StepCategoryLimits';
import { StepSavings } from './StepSavings';
import { StepSummary } from './StepSummary';

import styles from './OnboardingWizard.module.css';

export const OnboardingWizard: React.FC = () => {
  const { user, saveFinancialProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Estados locais do perfil financeiro
  const [salary, setSalary] = useState(user?.profile?.salary || 5500);
  const [extraIncome, setExtraIncome] = useState(user?.profile?.extraIncome || 800);

  const [fixedBills, setFixedBills] = useState<FixedBillItem[]>(
    user?.profile?.fixedBills?.length
      ? user.profile.fixedBills
      : [
          { id: '1', title: 'Aluguel / Condomínio', value: 1600, dueDay: 10, category: 'casa', status: 'Pendente' },
          { id: '2', title: 'Energia Elétrica', value: 210, dueDay: 5, category: 'casa', status: 'Vencido' },
          { id: '3', title: 'Internet Fibra Óptica', value: 120, dueDay: 20, category: 'casa', status: 'Pendente' },
          { id: '4', title: 'Plano de Saúde / Remédios', value: 450, dueDay: 15, category: 'saude', status: 'Pendente' },
        ]
  );

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(
    user?.profile?.subscriptions?.length
      ? user.profile.subscriptions
      : [
          { id: '1', name: 'Netflix', price: 44.90, dueDay: 15, service: 'netflix', color: '#E50914' },
          { id: '2', name: 'Spotify', price: 21.90, dueDay: 5, service: 'spotify', color: '#1DB954' },
        ]
  );

  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgetItem[]>(
    user?.profile?.categoryBudgets?.length ? user.profile.categoryBudgets : DEFAULT_CATEGORIES
  );

  const [piggyBanks, setPiggyBanks] = useState<PiggyBankItemModel[]>(
    user?.profile?.piggyBanks?.length
      ? user.profile.piggyBanks
      : [
          {
            id: 1,
            title: 'Reserva de Emergência',
            description: 'Tranquilidade e segurança 🛡️',
            savedAmount: 3200,
            goalAmount: 10000,
            progress: 32,
            progressColor: '#22C55E',
          },
          {
            id: 2,
            title: 'Férias / Viagem',
            description: 'Explorar novos lugares ✈️',
            savedAmount: 1500,
            goalAmount: 4000,
            progress: 37,
            progressColor: '#7C3AED',
          },
        ]
  );

  // Cálculos consolidados
  const totalIncome = salary + extraIncome;
  const totalBills = fixedBills.reduce((acc, c) => acc + (c.value || 0), 0);
  const totalSubs = subscriptions.reduce((acc, c) => acc + (c.price || 0), 0);
  const totalFixed = totalBills + totalSubs;
  const totalBudgetedLimits = categoryBudgets.reduce((acc, c) => acc + (c.limit || 0), 0);
  const projectedMonthlySavings = totalIncome - totalFixed - totalBudgetedLimits;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    const fullProfile: UserFinancialProfile = {
      salary,
      extraIncome,
      fixedBills,
      subscriptions,
      categoryBudgets,
      piggyBanks,
    };
    saveFinancialProfile(fullProfile);
  };

  return (
    <div className={styles.wizardWrapper}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={styles.wizardCard}
      >
        <div className={styles.wizardHeader}>
          <div className={styles.topBrandRow}>
            <span className={styles.brandLogoTitle}>Paggo · Onboarding Financeiro</span>
            <span className={styles.stepCounterBadge}>Etapa {currentStep} de 5</span>
          </div>

          <div className={styles.stepperTrack}>
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`${styles.stepPill} ${
                  step === currentStep
                    ? styles.stepPillActive
                    : step < currentStep
                    ? styles.stepPillCompleted
                    : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className={styles.wizardBody}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && (
                <StepIncome
                  salary={salary}
                  extraIncome={extraIncome}
                  onSalaryChange={setSalary}
                  onExtraIncomeChange={setExtraIncome}
                />
              )}

              {currentStep === 2 && (
                <StepBills
                  fixedBills={fixedBills}
                  subscriptions={subscriptions}
                  onBillsChange={setFixedBills}
                  onSubscriptionsChange={setSubscriptions}
                />
              )}

              {currentStep === 3 && (
                <StepCategoryLimits
                  totalIncome={totalIncome}
                  fixedCommitments={totalFixed}
                  categoryBudgets={categoryBudgets}
                  onCategoriesChange={setCategoryBudgets}
                />
              )}

              {currentStep === 4 && (
                <StepSavings
                  projectedMonthlySavings={projectedMonthlySavings}
                  piggyBanks={piggyBanks}
                  onPiggyBanksChange={setPiggyBanks}
                />
              )}

              {currentStep === 5 && (
                <StepSummary
                  name={user?.name || 'Visitante'}
                  totalIncome={totalIncome}
                  totalFixed={totalFixed}
                  totalBudgetedLimits={totalBudgetedLimits}
                  projectedMonthlySavings={projectedMonthlySavings}
                  goalsCount={piggyBanks.length}
                  onFinish={handleFinish}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.wizardFooter}>
          {currentStep > 1 ? (
            <button type="button" onClick={handleBack} className={styles.backButton}>
              <LuArrowLeft size={18} /> Voltar
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 1 && totalIncome <= 0}
              className={styles.nextButton}
            >
              Avançar <LuArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
