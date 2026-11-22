import styles from "./MonthlyChart.module.css";

import { FaCalendar } from "react-icons/fa";

interface TooltipPayload {
  value: number;
  dataKey: string;
  name?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export function CustomTooltip( {
    active,
    payload,
    label
}: TooltipProps) {
    const receitas = payload?.find(item => item.dataKey === "receitas")?.value ?? 0;
    const despesas = payload?.find(item => item.dataKey === "despesas")?.value ?? 0;
    const maior = Math.max(receitas, despesas);
    const porcentagemReceitas = maior ? (receitas / maior) * 100 : 0;
    const porcentagemDespesas = maior ? (despesas / maior) * 100 : 0;

    if(active && payload && payload.length) {
        return (
            <section className={styles.containerTooltip}>
                <div className={styles.containerMonth}>
                    <div className={styles.containerIconCalendar}>
                        <FaCalendar className={styles.iconTooltipCalendar}/>
                    </div>
                    <p>{label}</p>
                </div>

                <div className={styles.containerInfoMonthly}>
                    <div className={styles.balanceContainer}>
                        <div className={styles.info}>
                            <p>Receitas</p>
                            <p>R$ {receitas}</p>
                        </div>
                        <div className={styles.progress}>
                            <div className={styles.revenues} style={{ width: `${Math.min(porcentagemReceitas, 100)}%` }} />
                        </div>
                    </div>

                    <div className={styles.balanceContainer}>
                        <div className={styles.info}>
                            <p>Despesas</p>
                            <p>R$ {despesas}</p>
                        </div>
                        <div className={styles.progress}>
                            <div className={styles.expenses} style={{ width: `${Math.min(porcentagemDespesas, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return null;
}