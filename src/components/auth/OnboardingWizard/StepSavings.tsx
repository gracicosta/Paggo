import React, { useState } from 'react';
import { LuPiggyBank, LuPlus, LuTrash2, LuSparkles, LuTarget, LuCoins } from 'react-icons/lu';
import type { PiggyBankItemModel } from '../../../types/auth';
import styles from './OnboardingWizard.module.css';

interface StepSavingsProps {
  projectedMonthlySavings: number;
  piggyBanks: PiggyBankItemModel[];
  onPiggyBanksChange: (piggyBanks: PiggyBankItemModel[]) => void;
}

export const StepSavings: React.FC<StepSavingsProps> = ({
  projectedMonthlySavings,
  piggyBanks,
  onPiggyBanksChange,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newCurrent, setNewCurrent] = useState('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newGoal) return;

    const goalVal = Number(newGoal);
    const currVal = Number(newCurrent) || 0;
    const progress = goalVal > 0 ? Math.min(100, Math.round((currVal / goalVal) * 100)) : 0;

    const colors = ['#7C3AED', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'];
    const chosenColor = colors[piggyBanks.length % colors.length];

    const newPiggy: PiggyBankItemModel = {
      id: Date.now(),
      title: newTitle.trim(),
      description: 'Meta de economia ativa 🎯',
      savedAmount: currVal,
      goalAmount: goalVal,
      progress,
      progressColor: chosenColor,
    };

    onPiggyBanksChange([...piggyBanks, newPiggy]);
    setNewTitle('');
    setNewGoal('');
    setNewCurrent('');
  };

  const handleRemovePiggy = (id: number) => {
    onPiggyBanksChange(piggyBanks.filter((p) => p.id !== id));
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge}>
          <LuPiggyBank size={24} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Possibilidades Reais de Economias & Cofrinhos</h3>
          <p className={styles.stepDescription}>
            Transforme sobras orçamentárias em conquistas reais. Defina para onde irão suas economias todo mês.
          </p>
        </div>
      </div>

      <div className={styles.savingsPotentialCard}>
        <div className={styles.savingsPotentialHeader}>
          <LuSparkles size={22} className={styles.sparkleIcon} />
          <div>
            <span>Sua Capacidade Mensal Projetada de Poupança:</span>
            <h2 className={styles.savingsPotentialValue}>
              R$ {Math.max(0, projectedMonthlySavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <small>/mês</small>
            </h2>
          </div>
        </div>
        <p className={styles.savingsPotentialText}>
          {projectedMonthlySavings > 0
            ? 'Excelente! Seu planejamento orçamentário gera excedente mensal para você guardar ou investir sem aperto.'
            : 'Seus limites de gastos consom toda a renda. Ajuste os passos anteriores para liberar margem de economia.'}
        </p>
      </div>

      <div className={styles.subSectionTitle}>
        <h4>Suas Metas e Cofrinhos Atuais</h4>
        <span>{piggyBanks.length} meta(s) ativa(s)</span>
      </div>

      <form onSubmit={handleAddGoal} className={styles.addInlineForm}>
        <input
          type="text"
          placeholder="Ex: Viagem, Reserva de Emergência, Carro..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.textInput}
        />
        <div className={styles.smallCurrencyWrapper}>
          <span>Meta R$</span>
          <input
            type="number"
            placeholder="Alvo"
            min="100"
            step="100"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className={styles.smallNumberInput}
          />
        </div>
        <div className={styles.smallCurrencyWrapper}>
          <span>Já guardado R$</span>
          <input
            type="number"
            placeholder="Atual"
            min="0"
            step="50"
            value={newCurrent}
            onChange={(e) => setNewCurrent(e.target.value)}
            className={styles.smallNumberInput}
          />
        </div>
        <button type="submit" className={styles.addButton}>
          <LuPlus size={18} /> Adicionar Meta
        </button>
      </form>

      <div className={styles.piggyGrid}>
        {piggyBanks.map((item) => (
          <div key={item.id} className={styles.piggyCardItem}>
            <div className={styles.piggyCardTop}>
              <div className={styles.piggyCardIcon} style={{ background: `${item.progressColor}20`, color: item.progressColor }}>
                <LuTarget size={20} />
              </div>
              <div className={styles.piggyCardTitle}>
                <h5>{item.title}</h5>
                <p>{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePiggy(item.id)}
                className={styles.removeButton}
                title="Remover meta"
              >
                <LuTrash2 size={16} />
              </button>
            </div>

            <div className={styles.piggyProgressSection}>
              <div className={styles.piggyValues}>
                <span>
                  <LuCoins size={14} /> R$ {item.savedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className={styles.goalTarget}>de R$ {item.goalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.meterTrack}>
                <div
                  className={styles.meterFill}
                  style={{ width: `${Math.min(100, item.progress)}%`, backgroundColor: item.progressColor }}
                />
              </div>
              <span className={styles.piggyPercentText} style={{ color: item.progressColor }}>
                {item.progress}% concluído
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
