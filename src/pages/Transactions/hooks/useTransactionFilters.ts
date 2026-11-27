import { useState } from 'react';
import { categoryById, methodLabel } from '../../../data/transactionCategories';
import type { Transaction, TransactionKind } from '../../../types/transactions';
import { brl, normalize } from '../../../utils/format';
import { groupByDay } from '../transactionUtils';

export type KindFilter = 'todas' | TransactionKind;

/** Quantas linhas aparecem antes do botão "Ver transações mais antigas". */
export const PAGE_SIZE = 25;

/**
 * Busca, filtros (tipo, categoria, impulso) e paginação da lista de transações do mês.
 * As regras de combinação ficam aqui (ex.: escolher "Receitas" desliga "Só impulso"),
 * e a tela só chama as ações.
 */
export function useTransactionFilters(monthTx: Transaction[]) {
  const [kindFilter, setKindFilter] = useState<KindFilter>('todas');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [onlyImpulse, setOnlyImpulse] = useState(false);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const q = normalize(search.trim());
  const filtered = monthTx.filter((t) => {
    if (kindFilter !== 'todas' && t.kind !== kindFilter) return false;
    if (catFilter && t.category !== catFilter) return false;
    if (onlyImpulse && !t.impulse) return false;
    if (!q) return true;
    const text = normalize(`${t.description} ${categoryById(t.category).label} ${methodLabel(t.method)} ${brl(t.amount)}`);
    return text.includes(q) || text.replace(/\./g, '').includes(q);
  });

  // Mostra os dias até completar o limite de linhas
  const groups = groupByDay(filtered);
  const visibleGroups: typeof groups = [];
  let shown = 0;
  for (const g of groups) {
    if (shown >= limit) break;
    visibleGroups.push(g);
    shown += g.items.length;
  }

  return {
    kindFilter,
    catFilter,
    onlyImpulse,
    search,
    filtered,
    visibleGroups,
    hasMore: shown < filtered.length,
    anyFilter: kindFilter !== 'todas' || !!catFilter || onlyImpulse || !!search.trim(),

    changeSearch: (value: string) => {
      setSearch(value);
      setLimit(PAGE_SIZE);
    },
    changeKind: (k: KindFilter) => {
      setKindFilter(k);
      setLimit(PAGE_SIZE);
      if (k === 'receita') setOnlyImpulse(false);
      if (catFilter && k !== 'todas' && categoryById(catFilter).kind !== k) setCatFilter(null);
    },
    /** Liga/desliga a categoria (categorias são de despesa, então "Receitas" vira "Todas"). */
    toggleCategory: (id: string) => {
      const on = catFilter === id;
      setCatFilter(on ? null : id);
      if (!on && kindFilter === 'receita') setKindFilter('todas');
      setLimit(PAGE_SIZE);
    },
    showAllCategories: () => {
      setCatFilter(null);
      setOnlyImpulse(false);
    },
    toggleImpulse: () => {
      setOnlyImpulse((v) => !v);
      if (kindFilter === 'receita') setKindFilter('todas');
    },
    showMore: () => setLimit((l) => l + PAGE_SIZE),
    clearFilters: () => {
      setKindFilter('todas');
      setCatFilter(null);
      setOnlyImpulse(false);
      setSearch('');
    },
  };
}

export type TransactionFiltersState = ReturnType<typeof useTransactionFilters>;
