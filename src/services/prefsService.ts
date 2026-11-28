import type { Prefs } from '../types/prefs';
import { STORAGE_KEYS, readText, writeJson } from './storage';

export const PREFS_KEY = STORAGE_KEYS.prefs;
export const REMEMBER_KEY = STORAGE_KEYS.rememberEmail;

/** Preferências salvas (ou as padrão do sistema, na primeira visita). */
export function loadPrefs(): Prefs {
  const fallback: Prefs = {
    dark: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    contrast: false,
    readable: false,
    fontStep: 1,
    palette: 'padrao',
  };
  try {
    const raw = readText(PREFS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

/** Salva as preferências (falhar aqui não impede o uso do app). */
export function savePrefs(prefs: Prefs) {
  writeJson(PREFS_KEY, prefs);
}

/** Evento disparado quando outra tela (ex.: Termos e Privacidade) muda as preferências salvas. */
export const PREFS_EVENT = 'paggo:prefs-changed';

export function notifyPrefsChanged() {
  window.dispatchEvent(new Event(PREFS_EVENT));
}

/** Recarrega as preferências salvas sempre que outra tela avisar que mudou algo. Devolve a função de limpeza. */
export function onPrefsChanged(reload: (prefs: Prefs) => void) {
  const handler = () => reload(loadPrefs());
  window.addEventListener(PREFS_EVENT, handler);
  return () => window.removeEventListener(PREFS_EVENT, handler);
}
