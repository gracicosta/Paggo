import styles from './AuthPage.module.css';

/** Preferências de acessibilidade compartilhadas pelo login e pelo cadastro. */
export interface Prefs {
  dark: boolean;
  contrast: boolean;
  readable: boolean;
  fontStep: number;
}

export const PREFS_KEY = 'paggo_login_prefs';
export const REMEMBER_KEY = 'paggo_remember_email';
export const FONT_STEPS = [0.875, 1, 1.125, 1.25, 1.375];

export function loadPrefs(): Prefs {
  const fallback: Prefs = {
    dark: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    contrast: false,
    readable: false,
    fontStep: 1,
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Classes do contêiner da página (tema, contraste e fonte de leitura). */
export const pageClassName = (prefs: Prefs, extra = '') =>
  [
    styles.page,
    prefs.dark ? styles.dark : '',
    prefs.contrast ? styles.highContrast : '',
    prefs.readable ? styles.readable : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
