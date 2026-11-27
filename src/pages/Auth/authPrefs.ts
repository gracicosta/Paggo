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

/**
 * Cores para séries/categorias (até 8 itens: limites, cofrinhos…), por paleta.
 * "padrao" é null: cada item usa a sua própria cor de sempre.
 */
export const SERIES_PALETTES: Record<PaletteId, { light: string[]; dark: string[] } | null> = {
  padrao: null,
  protan: {
    light: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9', '#d55e00', '#f0e442', '#7f7f7f'],
    dark: ['#56b4e9', '#e69f00', '#009e73', '#cc79a7', '#0072b2', '#d55e00', '#f0e442', '#bbbbbb'],
  },
  tritan: {
    light: ['#d81b60', '#1e88e5', '#004d40', '#ffc107', '#8e24aa', '#f4511e', '#00897b', '#6d4c41'],
    dark: ['#f06292', '#64b5f6', '#4db6ac', '#ffd54f', '#ce93d8', '#ff8a65', '#80cbc4', '#bcaaa4'],
  },
  contraste: {
    light: ['#000000', '#555555', '#888888', '#333333', '#666666', '#999999', '#222222', '#777777'],
    dark: ['#ffffff', '#bbbbbb', '#888888', '#dddddd', '#aaaaaa', '#777777', '#eeeeee', '#999999'],
  },
};

/** Cor do item i na paleta escolhida, ou a cor própria do item na paleta padrão. */
export const seriesColor = (palette: PaletteId, dark: boolean, i: number, own: string) => {
  const list = SERIES_PALETTES[palette ?? 'padrao']?.[dark ? 'dark' : 'light'];
  return list ? list[i % list.length] : own;
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
