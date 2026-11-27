import { useEffect, useState } from 'react';
import { STORAGE_KEYS, readJson, readText, writeText } from '../services/storage';

/** Tema inicial: escolha salva no painel → escolha feita na tela de login → preferência do sistema. */
function initialDark(): boolean {
  const saved = readText(STORAGE_KEYS.dashboardTheme);
  if (saved) return saved === 'dark';
  const loginPrefs = readJson<{ dark?: boolean } | null>(STORAGE_KEYS.prefs, null);
  if (loginPrefs) return !!loginPrefs.dark;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * Tema claro/escuro do painel (botão da lua no topo), salvo no navegador.
 * @returns `[dark, toggleTheme]`
 */
export function useThemePreference() {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    writeText(STORAGE_KEYS.dashboardTheme, dark ? 'dark' : 'light');
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);
  return [dark, toggleTheme] as const;
}
