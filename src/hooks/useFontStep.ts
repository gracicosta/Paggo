import { useState } from 'react';
import { FONT_STEPS } from '../constants/palettes';
import { loadPrefs, savePrefs } from '../services/prefsService';

/**
 * Tamanho da letra (A− / A+) salvo junto com as outras preferências.
 * @returns posição atual, `changeFont(+1 | -1)`, se dá para diminuir/aumentar e o tamanho em px.
 */
export function useFontStep() {
  const [fontStep, setFontStep] = useState(() => loadPrefs().fontStep ?? 1);

  const changeFont = (delta: number) => {
    const next = Math.min(FONT_STEPS.length - 1, Math.max(0, fontStep + delta));
    setFontStep(next);
    savePrefs({ ...loadPrefs(), fontStep: next });
  };

  return {
    fontStep,
    changeFont,
    canDecrease: fontStep > 0,
    canIncrease: fontStep < FONT_STEPS.length - 1,
    fontSizePx: 16 * FONT_STEPS[fontStep],
  };
}
