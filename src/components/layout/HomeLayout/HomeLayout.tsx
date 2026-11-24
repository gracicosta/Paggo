import { useEffect, useState } from 'react';
import { TopNav } from '../TopNav/TopNav';
import { Dashboard } from '../../../pages/Dashboard/Dashboard';
import styles from './HomeLayout.module.css';

const THEME_KEY = 'paggo_theme';
const COLORBLIND_KEY = 'paggo_colorblind';
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
  const [colorblind, setColorblind] = useState(() => {
    try {
      return localStorage.getItem(COLORBLIND_KEY) === '1';
    } catch {
      return false;
    }
  });
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

  useEffect(() => {
    try {
      localStorage.setItem(COLORBLIND_KEY, colorblind ? '1' : '0');
    } catch {
      /* opcional */
    }
  }, [colorblind]);

  return (
    <div className={`${styles.shell} ${dark ? styles.dark : ''} ${colorblind ? styles.colorblind : ''}`}>
      <div className={styles.inner}>
        <TopNav
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          colorblind={colorblind}
          onToggleColorblind={() => setColorblind((c) => !c)}
          month={month}
          onMonthChange={setMonth}
        />
        <Dashboard month={month} colorblind={colorblind} />
      </div>
    </div>
  );
}
