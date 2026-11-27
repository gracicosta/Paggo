import type { PillTone } from '../../components/finance/Pill';
import type { GoalStatus } from '../../data/goalSummary';

/** Selo de cada situação da meta. O símbolo ajuda quem não distingue as cores. */
export const GOAL_STATUS: Record<GoalStatus, { label: string; symbol: string; tone: PillTone }> = {
  done: { label: 'Concluída', symbol: '✓', tone: 'ok' },
  onTrack: { label: 'No ritmo', symbol: '✓', tone: 'ok' },
  behind: { label: 'Um pouco atrás', symbol: '!', tone: 'warn' },
  starting: { label: 'Começando', symbol: '•', tone: 'info' },
  noDeadline: { label: 'Sem prazo', symbol: '•', tone: 'info' },
};
