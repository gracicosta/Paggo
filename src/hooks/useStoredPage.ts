import { useState } from 'react';
import { STORAGE_KEYS, readText, writeText } from '../services/storage';

/**
 * Aba aberta no menu do painel, salva no navegador para o F5 não voltar sempre para a primeira.
 *
 * @param pages abas que já têm tela; pedir outra (ex.: "Metas") não faz nada.
 * @param fallback aba padrão (a primeira visita, ou um valor salvo que não existe mais).
 * @returns `[page, navigate]`; `navigate` também sobe a página para o topo.
 */
export function useStoredPage<T extends string>(pages: readonly T[], fallback: T) {
  const [page, setPage] = useState<T>(() => {
    const saved = readText(STORAGE_KEYS.activePage);
    return pages.includes(saved as T) ? (saved as T) : fallback;
  });

  const navigate = (next: string) => {
    if (!pages.includes(next as T)) return;
    setPage(next as T);
    window.scrollTo({ top: 0 });
    writeText(STORAGE_KEYS.activePage, next);
  };

  return [page, navigate] as const;
}
