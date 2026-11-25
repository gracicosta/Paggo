import styles from './AuthPage.module.css';

/** Cores dos gráficos escolhidas no onboarding (passo 2), pensando em quem tem daltonismo. */
export type PaletteId = 'padrao' | 'protan' | 'tritan' | 'contraste';

/** Preferências de acessibilidade compartilhadas pelo login, pelo cadastro e pelo onboarding. */
export interface Prefs {
  dark: boolean;
  contrast: boolean;
  readable: boolean;
  /** Posição em FONT_STEPS (0 = pequena … 4 = máxima). */
  fontStep: number;
  palette: PaletteId;
}

export const PREFS_KEY = 'paggo_login_prefs';
export const REMEMBER_KEY = 'paggo_remember_email';
export const FONT_STEPS = [0.875, 1, 1.125, 1.25, 1.375];

/**
 * 4 cores por paleta, sempre na mesma ordem de significado:
 * [principal, atenção, positivo, negativo]. As paletas protan/tritan seguem Okabe-Ito / IBM.
 */
export const CHART_PALETTES: Record<PaletteId, { light: string[]; dark: string[] }> = {
  padrao: { light: ['#7c3aed', '#f59e0b', '#16a34a', '#dc2626'], dark: ['#a78bfa', '#fbbf24', '#4ade80', '#f87171'] },
  protan: { light: ['#0072b2', '#e69f00', '#56b4e9', '#999999'], dark: ['#56b4e9', '#e69f00', '#7fc8f0', '#bbbbbb'] },
  tritan: { light: ['#1e88e5', '#d81b60', '#004d40', '#ffc107'], dark: ['#64b5f6', '#f06292', '#4db6ac', '#ffd54f'] },
  contraste: { light: ['#111111', '#555555', '#999999', '#dddddd'], dark: ['#ffffff', '#bbbbbb', '#888888', '#555555'] },
};

/** Cores da paleta escolhida, já no tom certo para o tema claro ou escuro. */
export const chartColors = (prefs: Prefs) => CHART_PALETTES[prefs.palette ?? 'padrao'][prefs.dark ? 'dark' : 'light'];

export function loadPrefs(): Prefs {
  const fallback: Prefs = {
    dark: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    contrast: false,
    readable: false,
    fontStep: 1,
    palette: 'padrao',
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    // A troca de fonte (botão "Aa") saiu do login e do cadastro e vai para a tela de Configurações.
    // Até ela existir, a fonte de leitura fica desligada para ninguém ficar preso nela sem botão para voltar.
    return raw ? { ...fallback, ...JSON.parse(raw), readable: false } : fallback;
  } catch {
    return fallback;
  }
}

/** Salva as preferências (falhar aqui não impede o uso do app). */
export function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* preferências são opcionais */
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
