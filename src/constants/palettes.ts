import type { PaletteId } from '../types/prefs';

/** Tamanhos de letra (multiplicador de 16px), do menor ao maior. */
export const FONT_STEPS = [0.875, 1, 1.125, 1.25, 1.375];

/**
 * 4 cores por paleta, sempre na mesma ordem de significado:
 * [principal, atenção, positivo, negativo]. As paletas protan/tritan seguem Okabe-Ito / IBM.
 */
export const CHART_PALETTES: Record<PaletteId, { light: string[]; dark: string[] }> = {
  padrao: { light: ['#7c3aed', '#f59e0b', '#16a34a', '#dc2626'], dark: ['#a78bfa', '#fbbf24', '#4ade80', '#f87171'] },
  protan: { light: ['#0072b2', '#e69f00', '#56b4e9', '#999999'], dark: ['#56b4e9', '#e69f00', '#7fc8f0', '#bbbbbb'] },
  tritan: { light: ['#1e88e5', '#d81b60', '#004d40', '#ffc107'], dark: ['#64b5f6', '#f06292', '#4db6ac', '#ffd54f'] },
  contraste: { light: ['#111111', '#555555', '#999999', '#dddddd'], dark: ['#ffffff', '#bbbbbb', '#888888', '#555555'] },
};

/**
 * Cores para séries/categorias (até 8 itens: limites, cofrinhos…), por paleta.
 * "padrao" é null: cada item usa a sua própria cor de sempre.
 */
export const SERIES_PALETTES: Record<PaletteId, { light: string[]; dark: string[] } | null> = {
  padrao: null,
  protan: {
    light: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9', '#d55e00', '#f0e442', '#7f7f7f'],
    dark: ['#56b4e9', '#e69f00', '#009e73', '#cc79a7', '#0072b2', '#d55e00', '#f0e442', '#bbbbbb'],
  },
  tritan: {
    light: ['#d81b60', '#1e88e5', '#004d40', '#ffc107', '#8e24aa', '#f4511e', '#00897b', '#6d4c41'],
    dark: ['#f06292', '#64b5f6', '#4db6ac', '#ffd54f', '#ce93d8', '#ff8a65', '#80cbc4', '#bcaaa4'],
  },
  contraste: {
    light: ['#000000', '#555555', '#888888', '#333333', '#666666', '#999999', '#222222', '#777777'],
    dark: ['#ffffff', '#bbbbbb', '#888888', '#dddddd', '#aaaaaa', '#777777', '#eeeeee', '#999999'],
  },
};
