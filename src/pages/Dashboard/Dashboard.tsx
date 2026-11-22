import styles from "./Dashboard.module.css";

import { motion } from "motion/react";

import { MonthFilter } from "../../components/filters/MonthFIlter/MonthFilter"
import { StatsCard } from "../../components/cards/StatsCard/StatsCard";
import { MdOutlineTrendingDown } from "react-icons/md";
import { MdOutlineTrendingUp } from "react-icons/md";
import { LuWallet } from "react-icons/lu";
import { MonthlyChart } from "../../components/charts/MonthlyChart/MonthlyChart";
import { CategoryLimitsCard } from "../../components/cards/CategoryLimits/CategoryLimitsCard";
import { SubscriptionCard } from "../../components/cards/Subscription/SubscriptionCard";
import { TransitionCard } from "../../components/cards/Transitions/TransitionCard";
import { PiggyBankCard } from "../../components/cards/PiggyBank/PiggyBankCard";
import { BillsToPay } from "../../components/cards/BillsToPay/BillsToPay";

export function Dashboard() {
    return (
        <>
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.main}>
            <section className={styles.headerMain}>
                <div>
                    <h2 className={styles.titleHeader}><span>Boa tarde, </span><span className={styles.spanTitleHeader}>Visitante!</span></h2>
                    <p className={styles.subtitleHeader}>Sistema Inteligente de Análise Financeira</p>
                </div>

                <MonthFilter/>
            </section>

            <section className={styles.statsContainer}>
                <StatsCard title="Receitas" trendIcon={MdOutlineTrendingUp} value="R$ 8.450,00" percentage="+4%" description="Entradas do período" icon={MdOutlineTrendingUp} variant="green" />
                <StatsCard title="Despesas" trendIcon={MdOutlineTrendingDown} value="R$ 3.000,00" percentage="-5%" description="Saídas do período" icon={MdOutlineTrendingDown} variant="red"/>
                <StatsCard title="Saldo Atual" trendIcon={LuWallet} value="R$ 5.345,00" description="Saldo positivo" icon={LuWallet} variant="blue"/>
            </section>
            <section className={styles.containerGrafic}>
                <MonthlyChart />
            </section>
            <section className={styles.containerCategory}>
                <CategoryLimitsCard/>
                <div className={styles.widgetsGrid}>
                    <SubscriptionCard/>
                    <PiggyBankCard/>
                </div>
            </section>
            <section className={styles.containerTransition}>
                <TransitionCard/>
                <BillsToPay/>
            </section>
        </motion.main>
        </>
    )
}

// O que fazer: Cofrinho | insights | faturas 