import { LuTrendingDown, LuTrendingUp, LuWallet } from 'react-icons/lu';
import type { HTMLMotionProps } from 'motion/react';
import type { MonthSummary } from '../../data/financeSummary';
import { brl, signedBrl } from '../../utils/format';
import { DeltaBadge } from './DeltaBadge';
import { SummaryCard } from './SummaryCard';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface CardProps {
  summary: MonthSummary;
  className?: string;
  motionProps?: HTMLMotionProps<'article'>;
}

/** Selo do saldo: diferença para o mês anterior. Também usado no cartão grande do Dashboard. */
export const BalanceDelta = ({ summary: s, onHero = true }: { summary: MonthSummary; onHero?: boolean }) => (
  <DeltaBadge
    now={s.balance}
    before={s.prevIn - s.prevOut}
    goodWhen="up"
    prevName={s.keys.prevName}
    hint={s.vsPrevHint}
    onHero={onHero}
  />
);

/** "Saldo do mês" (cartão roxo). */
export const BalanceCard = ({ summary, className, motionProps }: CardProps) => (
  <SummaryCard title="Saldo do mês" icon={LuWallet} hero value={signedBrl(summary.balance)} className={className} motionProps={motionProps}>
    <BalanceDelta summary={summary} />
  </SummaryCard>
);

/** "Entrou": receitas do mês. */
export const IncomeCard = ({ summary: s, className, motionProps }: CardProps) => (
  <SummaryCard title="Entrou" icon={LuTrendingUp} tone="ok" value={brl(s.totalIn)} className={className} motionProps={motionProps}>
    <DeltaBadge
      now={s.totalIn}
      before={s.prevIn}
      goodWhen="up"
      prevName={s.keys.prevName}
      hint={s.vsPrevHint}
      detail={plural(s.incomes.length, 'receita', 'receitas')}
    />
  </SummaryCard>
);

/** "Saiu": despesas do mês. */
export const ExpenseCard = ({ summary: s, className, motionProps }: CardProps) => (
  <SummaryCard title="Saiu" icon={LuTrendingDown} tone="bad" value={brl(s.totalOut)} className={className} motionProps={motionProps}>
    <DeltaBadge
      now={s.totalOut}
      before={s.prevOut}
      goodWhen="down"
      prevName={s.keys.prevName}
      hint={s.vsPrevHint}
      detail={plural(s.expenses.length, 'despesa', 'despesas')}
    />
  </SummaryCard>
);
