import { motion } from "motion/react";
import styles from './BillsToPay.module.css'
import { GoArrowRight } from "react-icons/go";
import { billsToPayData, getDueText } from "../../../data/dashboardData";
import { smoothSpring } from "../../animations/transitions";

export function BillsToPay() {
    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.containerBillsToPay}>
            <div className={styles.containerHeader}>
                <p>Boletos a Vencer</p>
                <a href="#" title="Seguir para página de assinaturas">Ver todas <GoArrowRight/></a>
            </div>

            <div className={styles.billsToPayList}>
                {billsToPayData.map((item) => {
                    return (
                        <motion.div className={styles.billsToPayCard} whileHover={{ scale: 1.03, y: -4, }} transition={smoothSpring}>
                            <div className={styles.billsToPayIcon} style={{ background: item.iconBackground}}>
                                <item.icon color={item.iconColor}/>
                            </div>
                            <div className={styles.billsToPayInfo}>
                                <p>{item.title}</p>
                                <p>{getDueText(item.date)}</p>
                            </div>
                            <div className={styles.billsToPayPrice}>
                                <p className={styles.paymentAmount}> R$ {item.value.toFixed(2)}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

        </motion.section>
    )
}