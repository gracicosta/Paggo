import { useEffect, useRef, type RefObject } from 'react';

interface Options {
  /** Fecha com a tecla Esc (padrão: não; alguns componentes tratam o Esc no próprio teclado). */
  escape?: boolean;
  /** Fecha ao rolar a página (rolar dentro do próprio menu não fecha) ou mudar o tamanho da janela. */
  scrollAndResize?: boolean;
}

/**
 * Fecha menus e calendários suspensos ao clicar fora deles.
 * Usado pelo seletor de mês do topo, pelo do onboarding, pelo calendário de dias e pela lista "Como pagou?".
 * `refs`: tudo que conta como "dentro" (o botão que abre e o cartão aberto).
 */
export function useDismiss(
  open: boolean,
  refs: Array<RefObject<HTMLElement | null>>,
  onDismiss: () => void,
  { escape = false, scrollAndResize = false }: Options = {},
) {
  const dismissRef = useRef(onDismiss);
  const refsRef = useRef(refs);
  useEffect(() => {
    dismissRef.current = onDismiss;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) =>
      refsRef.current.some((r) => r.current?.contains(target as Node));
    const onDown = (e: MouseEvent) => {
      if (!inside(e.target)) dismissRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissRef.current();
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) dismissRef.current();
    };
    const onResize = () => dismissRef.current();

    document.addEventListener('mousedown', onDown);
    if (escape) document.addEventListener('keydown', onKey);
    if (scrollAndResize) {
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onResize);
    }
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, escape, scrollAndResize]);
}
