/** Cores dos gráficos escolhidas no onboarding (passo 2), pensando em quem tem daltonismo. */
export type PaletteId = 'padrao' | 'protan' | 'tritan' | 'contraste';

/** Preferências de acessibilidade compartilhadas por todas as telas (login, cadastro, onboarding, painel, termos). */
export interface Prefs {
  dark: boolean;
  contrast: boolean;
  readable: boolean;
  /** Posição em FONT_STEPS (0 = pequena … 4 = máxima). */
  fontStep: number;
  palette: PaletteId;
}
