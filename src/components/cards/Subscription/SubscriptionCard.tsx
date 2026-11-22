import { GoArrowRight } from "react-icons/go"
import { subscriptionsData } from "../../../data/dashboardData"
import styles from "./SubscriptionCard.module.css"
import { motion } from "motion/react"
import { smoothSpring } from "../../animations/transitions"

export function SubscriptionCard() {
    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.containerSubscription}>
            <div className={styles.containerHeader}>
                <p>Assinaturas</p>
                <a href="#" title="Seguir para página de assinaturas">Ver todos <GoArrowRight/></a>
            </div>

            <div className={styles.subscriptionsList}>
                {subscriptionsData.map((item) => {
                    return (
                        <motion.div className={styles.subscriptionCard} whileHover={{ scale: 1.03, y: -4, }} transition={smoothSpring}>
                            <div className={styles.subscriptionContent}>
                                <item.icon className={styles.icon} color={item.color}/>
                                {item.name}
                                <div className={styles.contentDescription}>
                                    <span className={styles.subscriptionDate}>Dia {item.data}</span>
                                    <span className={styles.subscriptionName}>R$ {item.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.section>
    )
}