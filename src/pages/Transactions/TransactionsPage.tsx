import { useState } from 'react';
import { motion } from 'motion/react';
import { LuMinus, LuPlus, LuSearch, LuTrash2, LuZap } from 'react-icons/lu';
import { FiChevronDown } from 'react-icons/fi';
import { useTransactions } from '../../context/TransactionsContext';
import { useFinance, useMonthFinance } from '../../context/FinanceContext';
import { useFontStep } from '../../hooks/useFontStep';
import { useToast } from '../../hooks/useToast';
import type { PaletteId } from '../../types/prefs';
import type { Transaction, TransactionInput, TransactionKind } from '../../types/transactions';
import { brl, pct } from '../../utils/format';
import { fade } from '../../components/animations/fade';
import { SummaryCard, SummaryNote } from '../../components/finance/SummaryCard';
import { BalanceCard, ExpenseCard, IncomeCard } from '../../components/finance/MonthCards';
import { Modal } from '../../components/ui/Modal';
import { TransactionForm } from './TransactionForm';
import { TransactionRow } from './components/TransactionRow';
import { TransactionFilters } from './components/TransactionFilters';
import { CategoryDonut } from './components/CategoryDonut';
import { DeleteConfirm } from './components/DeleteConfirm';
import { UndoToast } from './components/UndoToast';
import { LimitAlertNote } from './components/LimitAlertNote';
import { ViewTabs, type TransactionsView } from './components/ViewTabs';
import { useTransactionFilters } from './hooks/useTransactionFilters';
import { closestLimit, dayLabel, impulseComparison, topCategories } from './transactionUtils';
import styles from './Transactions.module.css';

type FormState = { mode: 'new'; kind: TransactionKind } | { mode: 'edit'; tx: Transaction } | null;
type Toast = { text: string; undo?: Transaction };

/** Os blocos desta tela entram um pouco mais rápido que os do painel. */
const FADE = 0.3;
const fadeIn = (i: number) => fade(i, FADE);

export interface TransactionsPageProps {
  /** Mês escolhido no topo ("Novembro 2026"). */
  month: string;
  palette: PaletteId;
  dark: boolean;
  /** Troca para a aba "Limites do mês". */
  onViewChange: (view: TransactionsView) => void;
}

/**
 * Tela de Transações (doc 5.4, TRA-RF01 a RF06): resumo do mês, lista por dia com busca e filtros,
 * registro rápido em 3 toques, editar/excluir com confirmação e "Foi por impulso?".
 * Esta tela só monta as peças: filtros em hooks/, linhas e modais em components/, contas em transactionUtils.
 */
export function TransactionsPage({ month, palette, dark, onViewChange }: TransactionsPageProps) {
  const { transactions, addTransaction, updateTransaction, removeTransaction, restoreTransaction } = useTransactions();
  const { fixedBills } = useFinance();
  // Mesmos números do Dashboard (uma fonte só): o que muda aqui aparece lá na hora
  const summary = useMonthFinance(month);
  const { keys, monthTx, impulses, totalOut, impulseTotal, byCategory: spentMap, categoryBudgets } = summary;

  const filters = useTransactionFilters(monthTx);
  const { filtered, visibleGroups, hasMore, anyFilter } = filters;
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  // Some sozinho depois de alguns segundos (mais tempo quando dá para desfazer)
  const [toast, setToast, closeToast] = useToast<Toast>((t) => (t.undo ? 6000 : 3000));
  const font = useFontStep();

  const impulseCompare = impulseComparison(impulseTotal, fixedBills);
  const byCategory = topCategories(spentMap);
  const limitAlert = closestLimit(categoryBudgets);

  // ---------- Ações ----------
  const save = (input: TransactionInput) => {
    const kindWord = input.kind === 'receita' ? 'Receita' : 'Despesa';
    if (form?.mode === 'edit') {
      updateTransaction(form.tx.id, input);
      setToast({ text: 'Alterações salvas.' });
    } else {
      addTransaction(input);
      setToast({ text: `${kindWord} de ${brl(input.amount)} salva.` });
    }
    setForm(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    removeTransaction(toDelete.id);
    setToast({ text: `"${toDelete.description}" foi excluída.`, undo: toDelete });
    setToDelete(null);
  };

  const editTx = (tx: Transaction) => setForm({ mode: 'edit', tx });
  const showingOtherMonth = !monthTx.length && !!transactions.length;

  return (
    <main className={styles.page} style={{ fontSize: `${font.fontSizePx}px` }}>
      <motion.section {...fadeIn(0)} className={styles.head}>
        <div>
          <h1 className={styles.title}>Transações</h1>
          <p className={styles.subtitle}>Tudo que entrou e saiu em {keys.name}, organizado por dia.</p>
        </div>
        <div className={styles.cta}>
          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.btnIncome}`}
            onClick={() => setForm({ mode: 'new', kind: 'receita' })}
          >
            <LuPlus size={18} /> Nova receita
          </button>
          <button type="button" className={styles.btnPrimary} onClick={() => setForm({ mode: 'new', kind: 'despesa' })}>
            <LuMinus size={18} /> Nova despesa
          </button>
        </div>
      </motion.section>

      <ViewTabs view="lancamentos" onChange={onViewChange} />

      {/* ---------- Resumo (mesmos cartões do Dashboard) ---------- */}
      <section className={styles.kpis} aria-label={`Resumo de ${keys.name}`}>
        <BalanceCard summary={summary} className={styles.kpi} motionProps={fadeIn(1)} />
        <IncomeCard summary={summary} className={styles.kpi} motionProps={fadeIn(2)} />
        <ExpenseCard summary={summary} className={styles.kpi} motionProps={fadeIn(3)} />
        <SummaryCard
          title="Gasto por impulso"
          icon={LuZap}
          tone="warn"
          value={brl(impulseTotal)}
          className={styles.kpi}
          motionProps={fadeIn(4)}
        >
          <SummaryNote>
            {impulses.length ? (
              <>
                <b>
                  {impulses.length} {impulses.length === 1 ? 'compra' : 'compras'}
                </b>{' '}
                no mês. {impulseCompare ?? `É ${pct(totalOut ? impulseTotal / totalOut : 0)} de tudo que saiu.`}
              </>
            ) : (
              'Nenhuma compra por impulso neste mês. Boa!'
            )}
          </SummaryNote>
        </SummaryCard>
      </section>

      <div className={styles.grid}>
        {/* ---------- Lista ---------- */}
        <motion.section {...fadeIn(5)} className={`${styles.card} ${styles.list}`} aria-label="Lista de transações">
          <TransactionFilters filters={filters} palette={palette} dark={dark} />

          <p className={styles.srOnly} aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'transação encontrada' : 'transações encontradas'}
          </p>

          {visibleGroups.map((g) => (
            <div key={g.date} className={styles.dayGroup}>
              <h3 className={styles.day}>
                <span>{dayLabel(g.date)}</span>
                <span>
                  {g.total >= 0 ? '+' : '−'} {brl(Math.abs(g.total))}
                </span>
              </h3>
              <ul className={styles.rows}>
                {g.items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    palette={palette}
                    dark={dark}
                    onEdit={editTx}
                    onDelete={setToDelete}
                  />
                ))}
              </ul>
            </div>
          ))}

          {!filtered.length && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <LuSearch size={22} />
              </span>
              {anyFilter ? (
                <>
                  <b>Nada encontrado com esses filtros.</b>
                  <button type="button" className={styles.link} onClick={filters.clearFilters}>
                    Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <b>Nenhuma transação em {keys.name}.</b>
                  <span>
                    {showingOtherMonth
                      ? 'Escolha outro mês no topo ou registre a primeira.'
                      : 'Registre a primeira no botão "Nova despesa".'}
                  </span>
                </>
              )}
            </div>
          )}

          {hasMore && (
            <button type="button" className={styles.more} onClick={filters.showMore}>
              Ver transações mais antigas <FiChevronDown size={17} />
            </button>
          )}
        </motion.section>

        {/* ---------- Coluna da direita ---------- */}
        <aside className={styles.side}>
          <motion.section {...fadeIn(6)} className={`${styles.card} ${styles.quick}`} aria-labelledby="quick-title">
            <header className={styles.cardHead}>
              <h2 id="quick-title">Registro rápido</h2>
              <span className={styles.badge}>3 toques</span>
            </header>
            <TransactionForm
              variant="quick"
              palette={palette}
              dark={dark}
              onSave={(input) => {
                addTransaction(input);
                setToast({ text: `${input.kind === 'receita' ? 'Receita' : 'Despesa'} de ${brl(input.amount)} salva.` });
              }}
            />
          </motion.section>

          <motion.section {...fadeIn(7)} className={`${styles.card} ${styles.where}`} aria-labelledby="where-title">
            <header className={styles.cardHead}>
              <h2 id="where-title">Para onde foi o dinheiro</h2>
              <span className={styles.linkStatic}>{keys.name[0].toUpperCase() + keys.name.slice(1)}</span>
            </header>
            {byCategory.length ? (
              <CategoryDonut data={byCategory} total={totalOut} palette={palette} dark={dark} />
            ) : (
              <p className={styles.muted}>Quando você registrar despesas, o gráfico aparece aqui.</p>
            )}
            {limitAlert && limitAlert.used >= 0.8 && <LimitAlertNote alert={limitAlert} />}
          </motion.section>
        </aside>
      </div>

      <div className={styles.a11y} role="group" aria-label="Tamanho da letra">
        Tamanho da letra:
        <button type="button" onClick={() => font.changeFont(-1)} disabled={!font.canDecrease} aria-label="Diminuir letra">
          A−
        </button>
        <button type="button" onClick={() => font.changeFont(1)} disabled={!font.canIncrease} aria-label="Aumentar letra">
          A+
        </button>
      </div>

      {/* Celular e tablet: o registro rápido abre por este botão */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setForm({ mode: 'new', kind: 'despesa' })}
        aria-label="Nova transação"
      >
        <LuPlus size={28} />
      </button>

      {form && (
        <Modal
          title={form.mode === 'edit' ? 'Editar transação' : form.kind === 'receita' ? 'Nova receita' : 'Nova despesa'}
          onClose={() => setForm(null)}
        >
          <TransactionForm
            variant="full"
            palette={palette}
            dark={dark}
            initial={form.mode === 'edit' ? form.tx : { kind: form.kind }}
            onSave={save}
            onCancel={() => setForm(null)}
            autoFocus
          />
          {form.mode === 'edit' && (
            <button
              type="button"
              className={styles.deleteLink}
              onClick={() => {
                setToDelete(form.tx);
                setForm(null);
              }}
            >
              <LuTrash2 size={16} /> Excluir esta transação
            </button>
          )}
        </Modal>
      )}

      {toDelete && <DeleteConfirm transaction={toDelete} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}

      {toast && (
        <UndoToast
          text={toast.text}
          onClose={closeToast}
          onUndo={
            toast.undo
              ? () => {
                  restoreTransaction(toast.undo!);
                  setToast({ text: 'Transação de volta.' });
                }
              : undefined
          }
        />
      )}
    </main>
  );
}
