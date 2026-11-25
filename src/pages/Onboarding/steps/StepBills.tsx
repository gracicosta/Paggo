import React, { useState } from 'react';
import { LuCrown, LuLock, LuPlus } from 'react-icons/lu';
import { Check, Emo, StepTitle, type StepProps } from '../OnboardingUi';
import {
  FREE_SUBSCRIPTIONS,
  HOUSE_BILLS,
  SUBSCRIPTIONS,
  brl,
  parseMoney,
  sum,
  type CatalogItem,
  type PickedItem,
} from '../onboardingData';
import o from '../Onboarding.module.css';

/** Valor com vírgula para o campo: 39.9 → "39,90", 900 → "900" */
const moneyText = (v: number) =>
  v ? v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) : '';

/** Cartão de conta/assinatura: toque marca; marcado, mostra o valor para ajustar. */
const ItemCard: React.FC<{
  item: CatalogItem | PickedItem;
  picked?: PickedItem;
  locked?: boolean;
  dark: boolean;
  onToggle: () => void;
  onValue: (v: number) => void;
}> = ({ item, picked, locked, dark, onToggle, onValue }) => {
  const [text, setText] = useState(picked ? moneyText(picked.value) : '');
  const on = Boolean(picked);

  return (
    <div className={`${o.card} ${o.bill} ${on ? o.sel : ''} ${locked ? o.lock : ''}`}>
      {on && <Check />}
      <button
        type="button"
        className={o.billBtn}
        aria-pressed={on}
        disabled={locked}
        onClick={() => {
          if (!on) setText(moneyText(item.value));
          onToggle();
        }}
        aria-label={locked ? `${item.label}: disponível no Premium` : on ? `${item.label}: desmarcar` : `${item.label}: marcar`}
      >
        <Emo emoji={item.emoji} tone={item.tone} dark={dark} />
        <strong>{item.label}</strong>
        {!on && (
          <span className={o.billHint}>{locked ? <LuLock size={14} aria-hidden="true" /> : '+ valor'}</span>
        )}
      </button>
      {on && (
        <label className={o.billValue}>
          <span aria-hidden="true">R$</span>
          <input
            inputMode="decimal"
            value={text}
            aria-label={`Valor de ${item.label} por mês`}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^\d,]/g, '').slice(0, 10);
              setText(clean);
              onValue(parseMoney(clean));
            }}
          />
        </label>
      )}
    </div>
  );
};

/** Passo 4 (opcional): contas da casa e assinaturas (3 no plano grátis). */
export const StepBills: React.FC<StepProps> = ({ state, update, prefs, openPremium }) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customValue, setCustomValue] = useState('');

  const customBills = state.bills.filter((b) => b.custom);
  const subsFull = state.subscriptions.length >= FREE_SUBSCRIPTIONS;

  const toggle = (list: 'bills' | 'subscriptions', item: CatalogItem | PickedItem) => {
    const current = state[list];
    const exists = current.some((p) => p.id === item.id);
    const next = exists
      ? current.filter((p) => p.id !== item.id)
      : [...current, { id: item.id, label: item.label, emoji: item.emoji, tone: item.tone, value: item.value }];
    update({ [list]: next });
  };

  const setValue = (list: 'bills' | 'subscriptions', id: string, value: number) =>
    update({ [list]: state[list].map((p) => (p.id === id ? { ...p, value } : p)) });

  const addCustom = () => {
    const label = customName.trim();
    if (!label) return;
    const item: PickedItem = {
      id: `custom_${Date.now()}`,
      label,
      emoji: '🧾',
      tone: 'p',
      value: parseMoney(customValue),
      custom: true,
    };
    update({ bills: [...state.bills, item] });
    setCustomName('');
    setCustomValue('');
    setCustomOpen(false);
  };

  /** Enter no formulário "Outra" adiciona a conta (e não avança de passo). */
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  const total = sum(state.bills) + sum(state.subscriptions);

  return (
    <>
      <StepTitle>Quais contas você paga todo mês?</StepTitle>
      <p className={o.sub}>Toque nas que você tem e ajuste o valor. Assim o Paggo já desconta da sua renda.</p>

      <section className={o.sec} aria-labelledby="onb-bills">
        <h3 className={o.secT} id="onb-bills">
          Contas da casa <em>toque para marcar</em>
        </h3>
        <div className={o.bills}>
          {[...HOUSE_BILLS, ...customBills].map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              picked={state.bills.find((p) => p.id === item.id)}
              dark={prefs.dark}
              onToggle={() => toggle('bills', item)}
              onValue={(v) => setValue('bills', item.id, v)}
            />
          ))}
          <div className={`${o.card} ${o.bill} ${o.add}`}>
            <button
              type="button"
              className={o.billBtn}
              aria-expanded={customOpen}
              aria-controls="onb-custom"
              onClick={() => setCustomOpen((v) => !v)}
            >
              <Emo emoji="➕" tone="p" dark={prefs.dark} />
              <strong>Outra</strong>
              <span className={o.billHint}>criar</span>
            </button>
          </div>
        </div>

        {customOpen && (
          <div className={`${o.card} ${o.customForm}`} id="onb-custom">
            <div className={o.field}>
              <label htmlFor="onb-custom-name">Nome da conta</label>
              <div className={o.box}>
                <input
                  id="onb-custom-name"
                  value={customName}
                  maxLength={30}
                  placeholder="Ex.: Condomínio"
                  autoFocus
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={onEnter}
                />
              </div>
            </div>
            <div className={o.field}>
              <label htmlFor="onb-custom-value">Valor por mês</label>
              <div className={o.box}>
                <span className={o.pref} aria-hidden="true">
                  R$
                </span>
                <input
                  id="onb-custom-value"
                  inputMode="decimal"
                  value={customValue}
                  placeholder="0"
                  onChange={(e) => setCustomValue(e.target.value.replace(/[^\d,]/g, '').slice(0, 10))}
                  onKeyDown={onEnter}
                />
              </div>
            </div>
            <button type="button" className={o.smallBtn} onClick={addCustom} disabled={!customName.trim()}>
              Adicionar
            </button>
          </div>
        )}
      </section>

      <section className={o.sec} aria-labelledby="onb-subs">
        <h3 className={o.secT} id="onb-subs">
          Assinaturas
          <span className={o.limit}>
            Plano grátis: {state.subscriptions.length} de {FREE_SUBSCRIPTIONS}
            <span className={o.pips} aria-hidden="true">
              {Array.from({ length: FREE_SUBSCRIPTIONS }, (_, i) => (
                <i key={i} className={i < state.subscriptions.length ? o.pipOn : ''} />
              ))}
            </span>
          </span>
        </h3>
        <div className={o.bills}>
          {SUBSCRIPTIONS.map((item) => {
            const picked = state.subscriptions.find((p) => p.id === item.id);
            return (
              <ItemCard
                key={item.id}
                item={item}
                picked={picked}
                locked={!picked && subsFull}
                dark={prefs.dark}
                onToggle={() => toggle('subscriptions', item)}
                onValue={(v) => setValue('subscriptions', item.id, v)}
              />
            );
          })}
        </div>
        {subsFull && (
          <div className={o.prem} role="status">
            <LuCrown size={18} aria-hidden="true" />
            <span>
              <b>Chegou ao limite do plano grátis.</b> No Premium você cadastra assinaturas sem limite.
            </span>
            <button type="button" className={o.pbtn} onClick={openPremium}>
              Ver Premium
            </button>
          </div>
        )}
      </section>

      <div className={`${o.card} ${o.total}`} aria-live="polite">
        <span>Total de contas fixas por mês</span>
        <b>{brl(total)}</b>
      </div>

      {state.bills.length === 0 && state.subscriptions.length === 0 && (
        <p className={o.note}>
          <LuPlus size={15} aria-hidden="true" />
          Não tem nenhuma agora? Toque em “Pular”. Dá para cadastrar depois no painel.
        </p>
      )}
    </>
  );
};
