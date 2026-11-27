import type { GoalView } from '../../data/goalSummary';
import { brlInt } from '../../utils/format';

export interface GoalPlanStep {
  /** Texto com ** ** para negrito (veja components/ui/RichText). */
  text: string;
  /** Passo que já está feito (aparece com ✓). */
  done?: boolean;
}

export interface GoalPlanContext {
  /** Dia em que o salário cai (do onboarding); sem ele, dia 5. */
  payday: number;
  /** Mês escolhido no topo, em minúsculas: "novembro". */
  monthName: string;
  today?: Date;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Nome curto da meta para títulos e botões: "Viagem para Salvador" → "Viagem". */
export const shortGoalTitle = (title: string) => (title.length > 16 ? title.split(' ')[0] : title);

/**
 * "Plano do Paggo" de uma meta: até 4 passos curtos, em linguagem simples, montados com as contas da meta.
 * Quando a IA do back-end existir, ela pode trocar este texto; a tela não muda.
 */
export function goalPlan(v: GoalView, { payday, monthName, today = new Date() }: GoalPlanContext): GoalPlanStep[] {
  if (v.done) {
    return [
      { done: true, text: `Meta completa! Você juntou **${brlInt(v.saved)}** para ${v.title.toLowerCase()}.` },
      { text: 'Que tal começar a próxima meta? Quem já tem o hábito de guardar chega mais rápido.' },
    ];
  }

  const steps: GoalPlanStep[] = [];
  const when = v.monthsLeft !== null && v.monthsLeft > 0 ? ` em ${plural(v.monthsLeft, 'mês', 'meses')}` : '';
  steps.push(
    v.saved > 0
      ? { done: true, text: `Você já tem **${brlInt(v.saved)}**. Faltam **${brlInt(v.left)}**${when}.` }
      : { text: `Faltam **${brlInt(v.left)}**${when}. O primeiro depósito é o mais importante, mesmo que pequeno.` },
  );

  if (v.perMonth > 0) {
    steps.push({
      text: `Guarde **${brlInt(v.perMonth)} todo dia ${payday}**, logo depois do salário. Dá uns ${brlInt(v.perMonth / 30)} por dia.`,
    });
  } else {
    steps.push({ text: 'Escolha um valor fixo por mês, mesmo pequeno. Guardar todo mês vale mais que guardar muito de uma vez.' });
  }

  if (v.missedMonth) {
    steps.push({
      text: `Em ${v.missedMonth} ficou sem depósito. Coloque **${brlInt(Math.min(v.perMonth || 100, v.left))} hoje** para voltar ao ritmo.`,
    });
  } else if (v.perMonth > 0 && v.inMonth < v.perMonth) {
    steps.push({ text: `Em ${monthName} faltam **${brlInt(v.perMonth - Math.max(0, v.inMonth))}** para o combinado do mês.` });
  } else if (v.perMonth > 0) {
    steps.push({ done: true, text: `O combinado de ${monthName} já está guardado. Boa!` });
  }

  // Fim do ano: lembrar do 13º
  const extra = Math.min(500, v.left);
  const ahead = v.perMonth > 0 ? Math.floor(extra / v.perMonth) : 0;
  if (today.getMonth() >= 9 && ahead >= 1) {
    steps.push({
      text: `Em dezembro vem o 13º. Mandar **${brlInt(extra)}** pra cá adianta a meta em ${plural(ahead, 'mês', 'meses')}.`,
    });
  } else {
    steps.push({ text: 'Sobrou dinheiro no fim do mês? Mande para cá: cada real adianta a meta.' });
  }

  return steps;
}
