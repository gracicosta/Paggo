/**
 * Entrada suave dos blocos das páginas, um pouco depois do outro
 * (usada no Dashboard e em Transações). `i` = posição do bloco na tela.
 */
export const fade = (i: number, duration = 0.35) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay: i * 0.04, ease: 'easeOut' as const },
});
