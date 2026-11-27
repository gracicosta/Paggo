import { useState } from 'react';
import { TopNav, type PageId } from '../TopNav/TopNav';
import { Dashboard } from '../../../pages/Dashboard/Dashboard';
import { TransactionsPage } from '../../../pages/Transactions/TransactionsPage';
import { loadPrefs } from '../../../services/prefsService';
import { useThemePreference } from '../../../hooks/useThemePreference';
import { useStoredPage } from '../../../hooks/useStoredPage';
import type { PaletteId } from '../../../types/prefs';
import { monthLabel } from '../../../utils/dates';
import styles from './HomeLayout.module.css';

/** Abas que já têm tela. Metas e Insights ainda não: clicar nelas mantém a aba atual. */
const READY_PAGES = ['Dashboard', 'Transações'] as const satisfies readonly PageId[];

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

  return (
    <div
      className={`${styles.shell} ${dark ? styles.dark : ''} ${palette !== 'padrao' ? styles[`pal_${palette}`] : ''} ${
        page === 'Transações' ? styles.scrollable : ''
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
        {page === 'Transações' ? (
          <TransactionsPage month={month} palette={palette} dark={dark} />
        ) : (
          <Dashboard month={month} palette={palette} dark={dark} onNewTransaction={() => navigate('Transações')} />
        )}
      </div>
    </div>
  );
}
