import { useEffect, useState } from 'react';
import { TopNav } from '../TopNav/TopNav';
import { Dashboard } from '../../../pages/Dashboard/Dashboard';
import { loadPrefs, type PaletteId } from '../../../pages/Auth/authPrefs';
import styles from './HomeLayout.module.css';

const THEME_KEY = 'paggo_theme';
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Tema inicial: escolha salva → escolha feita na tela de login → preferência do sistema. */
function initialDark(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    const loginPrefs = localStorage.getItem('paggo_login_prefs');
    if (loginPrefs) return !!JSON.parse(loginPrefs).dark;
  } catch {
    /* usa o padrão do sistema */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function HomeLayout() {
  const [dark, setDark] = useState(initialDark);
  // Cores dos gráficos escolhidas no onboarding (passo 2). A troca fica na tela de Configurações.
  const [palette] = useState<PaletteId>(() => loadPrefs().palette ?? 'padrao');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      /* opcional */
    }
  }, [dark]);


  return (
    <div className={`${styles.shell} ${dark ? styles.dark : ''} ${palette !== 'padrao' ? styles[`pal_${palette}`] : ''}`}>
      <div className={styles.inner}>
        <TopNav
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          month={month}
          onMonthChange={setMonth}
        />
        <Dashboard month={month} palette={palette} dark={dark} />
      </div>
    </div>
  );
}
