/**
 * Ponte de compatibilidade: as preferências saíram da pasta do Login porque o app inteiro usa.
 * Imports novos devem vir direto de:
 *   types/prefs · constants/palettes · utils/palette · utils/validation · services/prefsService · hooks/usePrefs
 * Aqui fica só `pageClassName`, que depende do CSS das telas de entrada (login, cadastro, onboarding).
 */
import type { Prefs } from '../../types/prefs';
import styles from './AuthPage.module.css';

export type { PaletteId, Prefs } from '../../types/prefs';
export { FONT_STEPS, CHART_PALETTES, SERIES_PALETTES } from '../../constants/palettes';
export { seriesColor, chartColors } from '../../utils/palette';
export { isValidEmail } from '../../utils/validation';
export {
  PREFS_KEY,
  REMEMBER_KEY,
  PREFS_EVENT,
  loadPrefs,
  savePrefs,
  notifyPrefsChanged,
  onPrefsChanged,
} from '../../services/prefsService';

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
