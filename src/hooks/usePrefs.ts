import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPrefs, notifyPrefsChanged, onPrefsChanged, savePrefs } from '../services/prefsService';
import type { Prefs } from '../types/prefs';

interface UsePrefsOptions {
  /**
   * Como a tela conversa com as outras sobre as preferências:
   * - `listen` (padrão): salva a cada mudança e recarrega quando outra tela avisar (login, cadastro, onboarding).
   * - `broadcast`: salva só depois da primeira mudança e avisa as outras telas (Termos e Privacidade,
   *   que abre por cima da tela de origem).
   */
  sync?: 'listen' | 'broadcast';
}

/**
 * Preferências de acessibilidade (tema, contraste, letra, paleta) como estado de React,
 * já salvas no navegador e sincronizadas entre as telas.
 *
 * @example const { prefs, updatePrefs } = usePrefs();
 *          updatePrefs({ dark: true });
 */
export function usePrefs({ sync = 'listen' }: UsePrefsOptions = {}) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const firstRun = useRef(true);

  useEffect(() => {
    if (sync === 'broadcast') {
      if (firstRun.current) {
        firstRun.current = false;
        return;
      }
      savePrefs(prefs);
      notifyPrefsChanged();
      return;
    }
    savePrefs(prefs);
  }, [prefs, sync]);

  // Se a pessoa mudar tema ou letra na página de Termos e Privacidade, a tela acompanha ao voltar.
  useEffect(() => (sync === 'listen' ? onPrefsChanged(setPrefs) : undefined), [sync]);

  /** Muda só os campos informados, mantendo o resto. */
  const updatePrefs = useCallback((next: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...next })), []);

  return { prefs, setPrefs, updatePrefs };
}
