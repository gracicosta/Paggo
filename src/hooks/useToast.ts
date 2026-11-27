import { useEffect, useState } from 'react';

/**
 * Aviso temporário (toast) que some sozinho.
 *
 * @param durationOf quanto tempo (ms) cada aviso fica na tela.
 * @returns `[toast, showToast, closeToast]`. `showToast(null)` também fecha.
 */
export function useToast<T>(durationOf: (toast: T) => number) {
  const [toast, setToast] = useState<T | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), durationOf(toast));
    return () => window.clearTimeout(id);
    // durationOf costuma ser uma função nova a cada render; só o aviso decide o timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const closeToast = () => setToast(null);
  return [toast, setToast, closeToast] as const;
}
