import { useCallback, useEffect, useRef, useState } from 'react';
import type { LegalDoc } from './legalContent';

/**
 * Rota simples por hash para Termos e Privacidade (o app ainda não usa React Router):
 *   #termos            → abre os Termos de Uso
 *   #privacidade       → abre a Política de Privacidade
 *   #termos-planos     → abre os Termos já no tópico "planos" (vale para qualquer id de legalContent)
 * Qualquer <a href="#termos"> ou <a href="#privacidade"> do app abre a página sem mexer na tela de origem.
 */
export interface LegalRoute {
  doc: LegalDoc;
  section: string | null;
}

export function parseLegalHash(hash: string): LegalRoute | null {
  const m = /^#(termos|privacidade)(?:-([\w-]+))?$/.exec(hash);
  return m ? { doc: m[1] as LegalDoc, section: m[2] ?? null } : null;
}

export const legalHref = (doc: LegalDoc, section?: string) => `#${doc}${section ? `-${section}` : ''}`;

export function useLegalRoute() {
  const [route, setRoute] = useState<LegalRoute | null>(() => parseLegalHash(window.location.hash));
  /** true quando a página foi aberta por um link dentro do app (dá para "voltar" no histórico). */
  const openedInApp = useRef(false);
  /** Elemento que abriu a página (o foco volta para ele ao fechar) e posição da rolagem. */
  const origin = useRef<{ el: HTMLElement | null; scrollY: number }>({ el: null, scrollY: 0 });

  useEffect(() => {
    const onHash = () => {
      const next = parseLegalHash(window.location.hash);
      setRoute((prev) => {
        if (next && !prev) {
          openedInApp.current = true;
          origin.current = {
            el: document.activeElement instanceof HTMLElement ? document.activeElement : null,
            scrollY: window.scrollY,
          };
        }
        return next;
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /** Troca de aba (Termos ↔ Privacidade) sem criar uma nova entrada no histórico. */
  const switchDoc = useCallback((doc: LegalDoc) => {
    history.replaceState(history.state, '', legalHref(doc));
    setRoute({ doc, section: null });
  }, []);

  /** Volta para a tela de onde a pessoa veio, do jeito que ela estava. */
  const close = useCallback(() => {
    if (openedInApp.current) {
      history.back(); // o hashchange fecha a página
    } else {
      // Entrou direto pelo endereço (ex.: link compartilhado): só tira o hash.
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
      setRoute(null);
    }
  }, []);

  // Ao fechar (pelo "Voltar", pelo Esc ou pelo botão voltar do navegador), a tela de origem
  // reaparece: devolve a rolagem e o foco para o link que abriu os termos.
  useEffect(() => {
    if (route) return;
    const { el, scrollY } = origin.current;
    origin.current = { el: null, scrollY: 0 };
    openedInApp.current = false;
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      el?.focus?.({ preventScroll: true });
    });
  }, [route]);

  return { route, switchDoc, close };
}
