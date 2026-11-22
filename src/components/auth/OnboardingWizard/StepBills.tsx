import React, { useState } from 'react';
import { LuReceipt, LuPlus, LuTrash2, LuTv, LuMusic, LuShoppingBag, LuSparkles } from 'react-icons/lu';
import type { FixedBillItem, SubscriptionItem } from '../../../types/auth';
import styles from './OnboardingWizard.module.css';

interface StepBillsProps {
  fixedBills: FixedBillItem[];
  subscriptions: SubscriptionItem[];
  onBillsChange: (bills: FixedBillItem[]) => void;
  onSubscriptionsChange: (subs: SubscriptionItem[]) => void;
}

export const StepBills: React.FC<StepBillsProps> = ({
  fixedBills,
  subscriptions,
  onBillsChange,
  onSubscriptionsChange,
}) => {
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillValue, setNewBillValue] = useState('');
  const [newBillDay, setNewBillDay] = useState('10');

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillTitle.trim() || !newBillValue) return;

    const newBill: FixedBillItem = {
      id: `bill_${newBillTitle.trim().toLowerCase().replace(/\s+/g, '_')}_${newBillDay}`,
      title: newBillTitle.trim(),
      value: Number(newBillValue),
      dueDay: Number(newBillDay) || 10,
      category: 'casa',
      status: 'Pendente',
    };

    onBillsChange([...fixedBills, newBill]);
    setNewBillTitle('');
    setNewBillValue('');
  };

  const handleRemoveBill = (id: string) => {
    onBillsChange(fixedBills.filter((b) => b.id !== id));
  };

  const toggleSubscription = (name: string, price: number, dueDay: number, service: SubscriptionItem['service'], color: string) => {
    const exists = subscriptions.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      onSubscriptionsChange(subscriptions.filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
    } else {
      const newSub: SubscriptionItem = {
        id: `sub_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        price,
        dueDay,
        service,
        color,
      };
      onSubscriptionsChange([...subscriptions, newSub]);
    }
  };

  const totalBills = fixedBills.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalSubs = subscriptions.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalCommitment = totalBills + totalSubs;

  const popularSubs = [
    { name: 'Netflix', price: 44.90, dueDay: 15, service: 'netflix' as const, color: '#E50914', icon: LuTv },
    { name: 'Spotify', price: 21.90, dueDay: 5, service: 'spotify' as const, color: '#1DB954', icon: LuMusic },
    { name: 'Amazon Prime', price: 19.90, dueDay: 20, service: 'amazon' as const, color: '#FF9900', icon: LuShoppingBag },
    { name: 'Disney+ / Max', price: 39.90, dueDay: 12, service: 'other' as const, color: '#3b82f6', icon: LuSparkles },
  ];

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge}>
          <LuReceipt size={24} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Quais são suas despesas fixas e assinaturas?</h3>
          <p className={styles.stepDescription}>
            Identifique os compromissos que você tem todo mês antes de definir os limites de gastos variáveis.
          </p>
        </div>
      </div>

      <div className={styles.subSectionTitle}>
        <h4>Contas e Boletos Essenciais</h4>
        <span>Total: R$ {totalBills.toFixed(2)}</span>
      </div>

      <form onSubmit={handleAddBill} className={styles.addInlineForm}>
        <input
          type="text"
          placeholder="Ex: Aluguel / Condomínio / Luz"
          value={newBillTitle}
          onChange={(e) => setNewBillTitle(e.target.value)}
          className={styles.textInput}
        />
        <div className={styles.smallCurrencyWrapper}>
          <span>R$</span>
          <input
            type="number"
            placeholder="Valor"
            min="0"
            step="10"
            value={newBillValue}
            onChange={(e) => setNewBillValue(e.target.value)}
            className={styles.smallNumberInput}
          />
        </div>
        <div className={styles.daySelectorWrapper}>
          <span>Dia</span>
          <input
            type="number"
            min="1"
            max="31"
            value={newBillDay}
            onChange={(e) => setNewBillDay(e.target.value)}
            className={styles.dayInput}
          />
        </div>
        <button type="submit" className={styles.addButton}>
          <LuPlus size={18} /> Adicionar
        </button>
      </form>

      <div className={styles.billsList}>
        {fixedBills.map((bill) => (
          <div key={bill.id} className={styles.billItem}>
            <div className={styles.billDetails}>
              <span className={styles.billTitle}>{bill.title}</span>
              <span className={styles.billDay}>Vencimento todo dia {bill.dueDay}</span>
            </div>
            <div className={styles.billActionArea}>
              <strong className={styles.billAmount}>R$ {bill.value.toFixed(2)}</strong>
              <button
                type="button"
                onClick={() => handleRemoveBill(bill.id)}
                className={styles.removeButton}
                title="Remover conta"
              >
                <LuTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.subSectionTitle} style={{ marginTop: '28px' }}>
        <h4>Assinaturas e Serviços Recorrentes</h4>
        <span>Total: R$ {totalSubs.toFixed(2)}</span>
      </div>

      <div className={styles.popularSubsGrid}>
        {popularSubs.map((sub) => {
          const isSelected = subscriptions.some((s) => s.name.toLowerCase() === sub.name.toLowerCase());
          const Icon = sub.icon;
          return (
            <button
              type="button"
              key={sub.name}
              onClick={() => toggleSubscription(sub.name, sub.price, sub.dueDay, sub.service, sub.color)}
              className={`${styles.subChip} ${isSelected ? styles.subChipSelected : ''}`}
            >
              <div className={styles.subChipIcon} style={{ color: sub.color }}>
                <Icon size={20} />
              </div>
              <div className={styles.subChipInfo}>
                <span className={styles.subChipName}>{sub.name}</span>
                <span className={styles.subChipPrice}>R$ {sub.price.toFixed(2)}/mês</span>
              </div>
              <span className={styles.subChipStatus}>{isSelected ? 'Ativo' : '+ Adicionar'}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.totalCommitmentBar}>
        <span>Compromissos Fixos Totais:</span>
        <strong>R$ {totalCommitment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
    </div>
  );
};
