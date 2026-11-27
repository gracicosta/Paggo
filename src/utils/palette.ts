import { CHART_PALETTES, SERIES_PALETTES } from '../constants/palettes';
import type { PaletteId, Prefs } from '../types/prefs';

/** Cor do item i na paleta escolhida, ou a cor própria do item na paleta padrão. */
export const seriesColor = (palette: PaletteId, dark: boolean, i: number, own: string) => {
  const list = SERIES_PALETTES[palette ?? 'padrao']?.[dark ? 'dark' : 'light'];
  return list ? list[i % list.length] : own;
};

/** Cores da paleta escolhida, já no tom certo para o tema claro ou escuro. */
export const chartColors = (prefs: Prefs) => CHART_PALETTES[prefs.palette ?? 'padrao'][prefs.dark ? 'dark' : 'light'];
