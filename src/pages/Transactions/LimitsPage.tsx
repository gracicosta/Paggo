import { useState } from 'react';
import { motion } from 'motion/react';
import { LuPlus, LuTrendingDown, LuWallet, LuZap } from 'react-icons/lu';
import { useTransactions } from '../../context/TransactionsContext';
import { useFinance, useMonthFinance } from '../../context/FinanceContext';
import { categoryById } from '../../data/transactionCategories';
import { useFontStep } from '../../hooks/useFontStep';
import { useToast } from '../../hooks/useToast';
import type { PaletteId } from '../../types/prefs';
import { brl, brlInt } from '../../utils/format';
import { fade } from '../../components/animations/fade';
import { SummaryCard } from '../../components/finance/SummaryCard';
import { Pill } from '../../components/finance/Pill';
import { Modal } from '../../components/ui/Modal';
import { ViewTabs, type TransactionsView } from './components/ViewTabs';
import { UndoToast } from './components/UndoToast';
import { LimitRow } from './components/limits/LimitRow';
import { LimitEditor } from './components/limits/LimitEditor';
import { NewLimitPicker } from './components/limits/NewLimitPicker';
import { LimitTipCard } from './components/limits/LimitTipCard';
import {
  buildLimitRows,
  categoriesWithoutLimit,
  categoryAverage,
  daysLeft,
  limitTip,
  limitTotals,
  withLimit,
  type LimitStatus,
} from './limitUtils';
import txStyles from './Transactions.module.css';
import styles from './Limits.module.css';

const FADE = 0.3;
const fadeIn = (i: number) => fade(i, FADE);

type Filter = 'todos' | 'alerta' | 'estourados';
const FILTER_LABEL: Record<Filter, string> = { todos: 'Todos', alerta: 'Em alerta', estourados: 'Estourados' };
const FILTER_STATUS: Record<Filter, LimitStatus[]> = { todos: ['ok', 'warn', 'bad'], alerta: ['warn'], estourados: ['bad'] };

/** Janela do celular: escolher categoria nova ou editar um limite. */
type Dialog = { mode: 'pick' } | { mode: 'edit'; id: string } | null;

/** Abaixo desta largura o cartão "Editar limite" some e a edição abre numa janela (igual ao Registro rápido). */
const SIDE_EDITOR_QUERY = '(min-width: 1101px)';

export interface LimitsPageProps {
  /** Mês escolhido no topo ("Novembro 2026"). */
  month: string;
  palette: PaletteId;
  dark: boolean;
  onViewChange: (view: TransactionsView) => void;
}

/**
 * Aba "Limites do mês" de Transações (doc 5.5, LIM-RF01 a RF04): quanto foi combinado para cada
 * categoria e quanto já saiu, com faixas tranquilo / atenção (80%) / estourou, editar, criar e remover limite.
 * O gasto vem das transações (useMonthFinance) e os limites do perfil (FinanceContext).
 */
export function LimitsPage({ month, palette, dark, onViewChange }: LimitsPageProps) {
  const { transactions } = useTransactions();
  const { categoryBudgets: profileBudgets, saveCategoryBudgets } = useFinance();
  const { keys, categoryBudgets, byCategory } = useMonthFinance(month);
  const font = useFontStep();
  const [toast, setToast, closeToast] = useToast<string>(() => 3000);

  const rows = buildLimitRows(categoryBudgets);
  const totals = limitTotals(rows);
  const days = daysLeft(keys.current);
  const tip = limitTip(rows, days);
  const free = categoriesWithoutLimit(profileBudgets);

  const [filter, setFilter] = useState<Filter>('todos');
  const visible = rows.filter((r) => FILTER_STATUS[filter].includes(r.status));
  // Cartão da direita: a categoria escolhida, ou a mais apertada
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === selectedId)?.id ?? (selectedId && free.some((c) => c.id === selectedId) ? selectedId : rows[0]?.id);
  const [dialog, setDialog] = useState<Dialog>(null);

  const average = (id: string) => categoryAverage(transactions, id, keys.current);
  const sideEditor = () => window.matchMedia(SIDE_EDITOR_QUERY).matches;

  // ---------- Ações ----------
  const openEditor = (id: string) => {
    setSelectedId(id);
    if (!sideEditor()) setDialog({ mode: 'edit', id });
  };

  const saveLimit = (id: string, limit: number) => {
    const isNew = !profileBudgets.some((b) => b.id === id);
    saveCategoryBudgets(withLimit(profileBudgets, id, limit));
    setToast(`Limite de ${categoryById(id).label} ${isNew ? 'criado' : 'salvo'}: ${brlInt(limit)} por mês.`);
    setDialog(null);
  };

  const removeLimit = (id: string) => {
    saveCategoryBudgets(withLimit(profileBudgets, id, 0));
    setToast(`Limite de ${categoryById(id).label} removido.`);
    setSelectedId(null);
    setDialog(null);
  };

  const moveLimit = (fromId: string, toId: string, amount: number) => {
    const from = profileBudgets.find((b) => b.id === fromId);
    const to = profileBudgets.find((b) => b.id === toId);
    if (!from || !to) return;
    saveCategoryBudgets(withLimit(withLimit(profileBudgets, fromId, from.limit - amount), toId, to.limit + amount));
    setToast(`${brlInt(amount)} foram de ${categoryById(fromId).label} para ${categoryById(toId).label}.`);
  };

  const newLimit = () => (sideEditor() && free.length ? setSelectedId(free[0].id) : setDialog({ mode: 'pick' }));

  const editorFor = (id: string, inDialog: boolean) => {
    const current = profileBudgets.find((b) => b.id === id && b.limit > 0);
    return (
      <LimitEditor
        key={`${id}-${current?.limit ?? 0}`}
        categoryId={id}
        limit={current?.limit}
        spent={byCategory.get(id) ?? 0}
        average={average(id)}
        palette={palette}
        dark={dark}
        onSave={(limit) => saveLimit(id, limit)}
        onRemove={current ? () => removeLimit(id) : undefined}
        onCancel={inDialog ? () => setDialog(null) : () => setSelectedId(null)}
        autoFocus={inDialog}
      />
    );
  };

  const selectedIsNew = !!selected && !rows.some((r) => r.id === selected);

  return (
    <main className={txStyles.page} style={{ fontSize: `${font.fontSizePx}px` }}>
      <motion.section {...fadeIn(0)} className={txStyles.head}>
        <div>
          <h1 className={txStyles.title}>Limites por categoria</h1>
          <p className={txStyles.subtitle}>Quanto você combinou gastar em cada coisa em {keys.name}, e quanto já foi.</p>
        </div>
        <div className={txStyles.cta}>
          <button type="button" className={txStyles.btnPrimary} onClick={newLimit}>
            <LuPlus size={18} /> Novo limite
          </button>
        </div>
      </motion.section>

      <ViewTabs view="limites" onChange={onViewChange} />

      {/* ---------- Resumo ---------- */}
      <section className={txStyles.kpis} aria-label={`Resumo dos limites de ${keys.name}`}>
        <SummaryCard title="Usado do total" icon={LuWallet} hero value={brl(totals.spent)} className={txStyles.kpi} motionProps={fadeIn(1)}>
          <span className={styles.meter} aria-hidden="true">
            <span style={{ width: `${Math.min(100, totals.used * 100)}%` }} />
          </span>
          <Pill tone="hero">
            {Math.round(totals.used * 100)}% de {brlInt(totals.limit)}
            {days > 0 && ` · ${days === 1 ? 'último dia' : `faltam ${days} dias`}`}
          </Pill>
        </SummaryCard>
        <SummaryCard title="Ainda dá para gastar" icon={LuWallet} tone="ok" value={brl(totals.left)} className={txStyles.kpi} motionProps={fadeIn(2)}>
          <Pill tone="ok">{days > 0 ? `≈ ${brlInt(totals.left / days)} por dia` : `Sobrou em ${keys.name}`}</Pill>
        </SummaryCard>
        <SummaryCard
          title="Perto do limite"
          icon={LuZap}
          tone="warn"
          value={`${totals.warn.length} ${totals.warn.length === 1 ? 'categoria' : 'categorias'}`}
          className={txStyles.kpi}
          motionProps={fadeIn(3)}
        >
          <Pill tone={totals.warn.length ? 'warn' : 'ok'}>{totals.warn.length ? 'Passaram de 80%' : 'Nenhuma passou de 80%'}</Pill>
        </SummaryCard>
        <SummaryCard
          title="Estourou"
          icon={LuTrendingDown}
          tone="bad"
          value={`${totals.over.length} ${totals.over.length === 1 ? 'categoria' : 'categorias'}`}
          className={txStyles.kpi}
          motionProps={fadeIn(4)}
        >
          {totals.over.length ? (
            <Pill tone="bad">
              {totals.over[0].label}
              {totals.over[0].left < -0.5 && ` · ${brlInt(-totals.over[0].left)} acima`}
              {totals.over.length > 1 && ` e mais ${totals.over.length - 1}`}
            </Pill>
          ) : (
            <Pill tone="ok">Nenhuma. Boa!</Pill>
          )}
        </SummaryCard>
      </section>

      <div className={txStyles.grid}>
        {/* ---------- Lista de limites ---------- */}
        <motion.section {...fadeIn(5)} className={`${txStyles.card} ${styles.limits}`} aria-labelledby="limits-title">
          <header className={styles.limitsHead}>
            <h2 id="limits-title">Seus limites de {keys.name}</h2>
            <div className={txStyles.seg} role="radiogroup" aria-label="Mostrar">
              {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={filter === f}
                  className={filter === f ? txStyles.segOn : ''}
                  onClick={() => setFilter(f)}
                >
                  {FILTER_LABEL[f]}
                </button>
              ))}
            </div>
            <ul className={styles.legendInline} aria-label="Cores das barras">
              <li>
                <i className={styles.fillOk} /> Até 79%
              </li>
              <li>
                <i className={styles.fillWarn} /> 80% a 100%
              </li>
              <li>
                <i className={styles.fillBad} /> Passou do limite
              </li>
            </ul>
          </header>

          {visible.length ? (
            <ul className={styles.limitList}>
              {visible.map((r) => (
                <LimitRow key={r.id} row={r} days={days} selected={r.id === selected} palette={palette} dark={dark} onEdit={openEditor} />
              ))}
            </ul>
          ) : (
            <p className={`${txStyles.muted} ${styles.emptyFilter}`}>
              {rows.length
                ? filter === 'alerta'
                  ? 'Nenhuma categoria entre 80% e 100% do limite.'
                  : 'Nenhuma categoria estourou o limite. Boa!'
                : 'Você ainda não tem limites. Crie o primeiro no botão abaixo.'}
            </p>
          )}

          {free.length > 0 && (
            <button type="button" className={styles.addRow} onClick={() => setDialog({ mode: 'pick' })}>
              <span className={styles.limitIcon} aria-hidden="true">
                <LuPlus size={19} />
              </span>
              <span>
                Criar limite para outra categoria
                <small>{free.map((c) => c.label).join(', ')}</small>
              </span>
            </button>
          )}
        </motion.section>

        {/* ---------- Coluna da direita ---------- */}
        <aside className={txStyles.side}>
          {selected && (
            <motion.section {...fadeIn(6)} className={`${txStyles.card} ${styles.editorCard}`} aria-labelledby="editor-title">
              <header className={txStyles.cardHead}>
                <h2 id="editor-title">{selectedIsNew ? 'Novo limite' : 'Editar limite'}</h2>
                <span className={txStyles.badge}>{categoryById(selected).label}</span>
              </header>
              {editorFor(selected, false)}
            </motion.section>
          )}

          {free.length > 0 && (
            <motion.section {...fadeIn(7)} className={`${txStyles.card} ${styles.newCard}`} aria-labelledby="new-title">
              <header className={txStyles.cardHead}>
                <h2 id="new-title">Novo limite</h2>
                <span className={txStyles.badge}>2 toques</span>
              </header>
              <p className={txStyles.muted}>Escolha uma categoria que ainda não tem limite e diga o valor.</p>
              <NewLimitPicker categories={free} palette={palette} dark={dark} onPick={openEditor} />
            </motion.section>
          )}

          <motion.div {...fadeIn(8)}>
            <LimitTipCard tip={tip} onMove={moveLimit} />
          </motion.div>
        </aside>
      </div>

      <div className={txStyles.a11y} role="group" aria-label="Tamanho da letra">
        Tamanho da letra:
        <button type="button" onClick={() => font.changeFont(-1)} disabled={!font.canDecrease} aria-label="Diminuir letra">
          A−
        </button>
        <button type="button" onClick={() => font.changeFont(1)} disabled={!font.canIncrease} aria-label="Aumentar letra">
          A+
        </button>
      </div>

      {/* Celular e tablet: novo limite pelo botão "+" */}
      <button type="button" className={txStyles.fab} onClick={() => setDialog({ mode: 'pick' })} aria-label="Novo limite">
        <LuPlus size={28} />
      </button>

      {dialog?.mode === 'pick' && (
        <Modal title="Novo limite" onClose={() => setDialog(null)}>
          <p className={`${txStyles.muted} ${styles.dialogText}`}>Escolha a categoria:</p>
          <NewLimitPicker
            categories={free}
            palette={palette}
            dark={dark}
            onPick={(id) => {
              setSelectedId(id);
              setDialog({ mode: 'edit', id });
            }}
          />
        </Modal>
      )}

      {dialog?.mode === 'edit' && (
        <Modal
          title={profileBudgets.some((b) => b.id === dialog.id && b.limit > 0) ? 'Editar limite' : 'Novo limite'}
          onClose={() => setDialog(null)}
        >
          {editorFor(dialog.id, true)}
        </Modal>
      )}

      {toast && <UndoToast text={toast} onClose={closeToast} />}
    </main>
  );
}
