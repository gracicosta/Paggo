import { useState } from 'react';
import { TopNav, type PageId } from '../TopNav/TopNav';
import { Dashboard } from '../../../pages/Dashboard/Dashboard';
import { TransactionsPage } from '../../../pages/Transactions/TransactionsPage';
import { LimitsPage } from '../../../pages/Transactions/LimitsPage';
import { GoalsPage } from '../../../pages/Goals/GoalsPage';
import type { TransactionsView } from '../../../pages/Transactions/components/ViewTabs';
import { loadPrefs } from '../../../services/prefsService';
import { useThemePreference } from '../../../hooks/useThemePreference';
import { useStoredPage } from '../../../hooks/useStoredPage';
import type { PaletteId } from '../../../types/prefs';
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
  // Cores dos gráficos escolhidas no onboarding (passo 2). A troca fica na tela de Configurações.
  const [palette] = useState<PaletteId>(() => loadPrefs().palette ?? 'padrao');
  const [month, setMonth] = useState(() => monthLabel());
  const [page, navigate] = useStoredPage(READY_PAGES, 'Dashboard');
  // Dentro de Transações: "Lançamentos" ou "Limites do mês" (também fica salvo para o F5)
  const [txView, changeTxView] = useStoredPage(TX_VIEWS, 'lancamentos', 'transactionsView');

  const openTransactions = (view: TransactionsView) => {
    changeTxView(view);
    navigate('Transações');
  };

  return (
    <div
      className={`${styles.shell} ${dark ? styles.dark : ''} ${palette !== 'padrao' ? styles[`pal_${palette}`] : ''} ${
        page !== 'Dashboard' ? styles.scrollable : ''
      }`}
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
    </div>
  );
}
