import { motion } from "motion/react";
import styles from "./TransitionCard.module.css"
import { GoArrowRight } from "react-icons/go";
import { transitionData } from "../../../data/dashboardData";
import { smoothSpring } from "../../animations/transitions";

export function TransitionCard() {

    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.containerTransition}>
            <div className={styles.containerHeader}>
                <p>Transações Recentes</p>
                <a href="#" title="Seguir para página de assinaturas">Ver todas <GoArrowRight/></a>
            </div>

            <div className={styles.transitionList}>
                {transitionData.slice(0, 4).map((item) => {
                    return (
                        <motion.div className={styles.transitionCard} whileHover={{ scale: 1.03, y: -4, }} transition={smoothSpring}>
                            <div className={styles.transitionIcon} style={{ background: item.category.background}}>
                                <item.category.icon color={item.category.color}/>
                            </div>
                            <div className={styles.transitionInfo}>
                                <p>{item.title}</p>
                                <p>{item.category.name} &bull; {item.data}</p>
                            </div>
                            <div className={styles.transitionPrice}>
                                <p className={item.type === "income" ? styles.positive : styles.negative}>{item.type === "income" ? "+" : "-"} R$ {item.value.toFixed(2)}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.section>
    )
}