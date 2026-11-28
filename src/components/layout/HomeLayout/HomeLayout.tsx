import { useState } from 'react';
import { TopNav, type PageId } from '../TopNav/TopNav';
import { Dashboard } from '../../../pages/Dashboard/Dashboard';
import { TransactionsPage } from '../../../pages/Transactions/TransactionsPage';
import { LimitsPage } from '../../../pages/Transactions/LimitsPage';
import { GoalsPage } from '../../../pages/Goals/GoalsPage';
import type { TransactionsView } from '../../../pages/Transactions/components/ViewTabs';
import { usePrefs } from '../../../hooks/usePrefs';
import { useThemePreference } from '../../../hooks/useThemePreference';
import { useStoredPage } from '../../../hooks/useStoredPage';
import { useFinance, useMonthFinance } from '../../../context/FinanceContext';
import { useGoals } from '../../../hooks/useGoals';
import { AssistantChat } from '../../ai/AssistantChat';
import { buildAiUiContext } from '../../../services/aiService';
import { FONT_STEPS } from '../../../constants/palettes';
import { monthLabel } from '../../../utils/dates';
import styles from './HomeLayout.module.css';

/** Abas que já têm tela. Insights ainda não: clicar nela mantém a aba atual. */
const READY_PAGES = ['Dashboard', 'Transações', 'Metas'] as const satisfies readonly PageId[];
const TX_VIEWS = ['lancamentos', 'limites'] as const satisfies readonly TransactionsView[];

/**
 * Casca do app logado: menu do topo + a aba escolhida.
 * Tema e aba salvos ficam nos hooks useThemePreference e useStoredPage.
 */
export function HomeLayout() {
  const [dark, toggleTheme] = useThemePreference();
  // Acessibilidade (Slide 7): paleta, letra legível e tamanho da fonte reagem ao menu do topo
  const { prefs } = usePrefs();
  const palette = prefs.palette ?? 'padrao';
  const fontScale = FONT_STEPS[Math.min(FONT_STEPS.length - 1, Math.max(0, prefs.fontStep))];
  const [month, setMonth] = useState(() => monthLabel());
  const [page, navigate] = useStoredPage(READY_PAGES, 'Dashboard');
  // Dentro de Transações: "Lançamentos" ou "Limites do mês" (também fica salvo para o F5)
  const [txView, changeTxView] = useStoredPage(TX_VIEWS, 'lancamentos', 'transactionsView');

  // Assistente: respostas locais usam os mesmos números dos cards (mesmo sem API)
  const { subscriptions, categoryBudgets } = useFinance();
  const { totals: goalTotals } = useGoals(month);
  const summary = useMonthFinance(month);
  const focusGoal = [...goalTotals.active].sort((a, b) => a.left - b.left)[0];
  const chatUi = buildAiUiContext({
    income: summary.totalIn,
    expense: summary.totalOut,
    budgets: categoryBudgets,
    subscriptionsTotal: subscriptions.reduce((acc, s) => acc + (s.price || 0), 0),
    goal: focusGoal ? { title: focusGoal.title, left: focusGoal.left, progress: focusGoal.progress } : null,
  });

  const openTransactions = (view: TransactionsView) => {
    changeTxView(view);
    navigate('Transações');
  };

  return (
    <div
      className={`${styles.shell} ${dark ? styles.dark : ''} ${palette !== 'padrao' ? styles[`pal_${palette}`] : ''} ${
        prefs.readable ? styles.readable : ''
      } ${page !== 'Dashboard' ? styles.scrollable : ''}`}
      style={{ fontSize: `${Math.round(16 * fontScale)}px` }}
    >
      <div className={styles.inner}>
        <TopNav
          dark={dark}
          onToggleTheme={toggleTheme}
          month={month}
          onMonthChange={setMonth}
          active={page}
          onNavigate={navigate}
        />
        {page === 'Metas' ? (
          <GoalsPage month={month} />
        ) : page === 'Transações' ? (
          txView === 'limites' ? (
            <LimitsPage month={month} palette={palette} dark={dark} onViewChange={changeTxView} />
          ) : (
            <TransactionsPage month={month} palette={palette} dark={dark} onViewChange={changeTxView} />
          )
        ) : (
          <Dashboard
            month={month}
            palette={palette}
            dark={dark}
            onNewTransaction={() => openTransactions('lancamentos')}
            onOpenLimits={() => openTransactions('limites')}
            onOpenGoals={() => navigate('Metas')}
          />
        )}
      </div>
      <AssistantChat ui={chatUi} />
    </div>
  );
}
