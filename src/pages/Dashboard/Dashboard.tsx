import styles from "./Dashboard.module.css";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";

import { MonthFilter } from "../../components/filters/MonthFIlter/MonthFilter";
import { StatsCard } from "../../components/cards/StatsCard/StatsCard";
import { MdOutlineTrendingDown, MdOutlineTrendingUp } from "react-icons/md";
import { LuWallet } from "react-icons/lu";
import { MonthlyChart } from "../../components/charts/MonthlyChart/MonthlyChart";
import { CategoryLimitsCard } from "../../components/cards/CategoryLimits/CategoryLimitsCard";
import { SubscriptionCard } from "../../components/cards/Subscription/SubscriptionCard";
import { TransitionCard } from "../../components/cards/Transitions/TransitionCard";
import { PiggyBankCard } from "../../components/cards/PiggyBank/PiggyBankCard";
import { BillsToPay } from "../../components/cards/BillsToPay/BillsToPay";

export function Dashboard() {
  const { user } = useAuth();
  const { totalIncome, totalExpenses, currentBalance } = useFinance();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Visitante';
  const formattedIncome = `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formattedExpenses = `R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formattedBalance = `R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={styles.main}
    >
      <section className={styles.headerMain}>
        <div>
          <h2 className={styles.titleHeader}>
            <span>Boa tarde, </span>
            <span className={styles.spanTitleHeader}>{firstName}!</span>
          </h2>
          <p className={styles.subtitleHeader}>
            Sistema Inteligente de Análise Financeira
          </p>
        </div>

        <MonthFilter />
      </section>

      <section className={styles.statsContainer}>
        <StatsCard
          title="Receitas"
          trendIcon={MdOutlineTrendingUp}
          value={formattedIncome}
          percentage="+4%"
          description="Entradas do período"
          icon={MdOutlineTrendingUp}
          variant="green"
        />
        <StatsCard
          title="Despesas"
          trendIcon={MdOutlineTrendingDown}
          value={formattedExpenses}
          percentage="-5%"
          description="Saídas e compromissos"
          icon={MdOutlineTrendingDown}
          variant="red"
        />
        <StatsCard
          title="Saldo Atual"
          trendIcon={LuWallet}
          value={formattedBalance}
          description={currentBalance >= 0 ? "Saldo positivo" : "Saldo em atenção"}
          icon={LuWallet}
          variant="blue"
        />
      </section>

      <section className={styles.containerGrafic}>
        <MonthlyChart />
      </section>

      <section className={styles.containerCategory}>
        <CategoryLimitsCard />
        <div className={styles.widgetsGrid}>
          <SubscriptionCard />
          <PiggyBankCard />
        </div>
      </section>

      <section className={styles.containerTransition}>
        <TransitionCard />
        <BillsToPay />
      </section>
    </motion.main>
  );
}
