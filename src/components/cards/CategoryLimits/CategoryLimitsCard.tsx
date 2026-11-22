import { GoArrowRight } from "react-icons/go";
import styles from "./CategoryLimitsCard.module.css"
import { categoryLimitsData } from "../../../data/dashboardData";
import { motion } from "motion/react";
import { smoothSpring } from "../../animations/transitions";

export function CategoryLimitsCard() {

    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.containerCategory}>
            <div className={styles.containerHeader}>
                <p>Limites por categoria</p>
                <a href="#" title="Seguir para página de categorias">Ver todos <GoArrowRight/></a>
            </div>

            <div className={styles.categoryList}>
                {categoryLimitsData.map((item) => {
                    const percentage = Math.round((item.spent / item.limit) * 100)

                    const progress = item.limit ? (item.spent / item.limit) * 100 : 0;

                    return (
                        <motion.div initial="hidden" animate="show" transition={smoothSpring} key={item.id} className={styles.categoryCard}>
                            <div className={styles.categoryItem}>
                                <item.icon color={item.color} />
                                {item.name}
                                <span style={{ color: item.color }} className={styles.percentage}>{percentage}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%`, backgroundColor:item.color }} />
                            </div>
                            <div className={styles.limit}>
                                <span>Limite: R$ {item.limit}</span>
                                <span>Gasto: R$ {item.spent}</span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </motion.section>
    )
}