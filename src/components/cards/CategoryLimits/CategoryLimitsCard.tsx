import { GoArrowRight } from "react-icons/go";
import styles from "./CategoryLimitsCard.module.css";
import { useFinance } from "../../../context/FinanceContext";
import { motion } from "motion/react";
import { smoothSpring } from "../../animations/transitions";
import type { IconType } from "react-icons";
import {
  FaUtensils,
  FaHeartPulse,
  FaGamepad,
  FaCarSide,
  FaGraduationCap,
  FaHouse,
  FaUser,
  FaBox,
  FaQuestion,
} from "react-icons/fa6";

const iconMap: Record<string, IconType> = {
  alimentacao: FaUtensils,
  lazer: FaGamepad,
  transporte: FaCarSide,
  saude: FaHeartPulse,
  educacao: FaGraduationCap,
  casa: FaHouse,
  despesasPessoais: FaUser,
  outros: FaBox,
};

export function CategoryLimitsCard() {
  const { categoryBudgets } = useFinance();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={styles.containerCategory}
    >
      <div className={styles.containerHeader}>
        <p>Limites por categoria</p>
        <a href="#" title="Seguir para página de categorias">
          Ver todos <GoArrowRight />
        </a>
      </div>

      <div className={styles.categoryList}>
        {categoryBudgets.map((item) => {
          const limit = item.limit || 1;
          const spent = item.spent || 0;
          const percentage = Math.round((spent / limit) * 100);
          const progress = (spent / limit) * 100;
          const Icon = iconMap[item.id] || FaQuestion;

          return (
            <motion.div
              initial="hidden"
              animate="show"
              transition={smoothSpring}
              key={item.id}
              className={styles.categoryCard}
            >
              <div className={styles.categoryItem}>
                <Icon color={item.color} />
                {item.name}
                <span style={{ color: item.color }} className={styles.percentage}>
                  {percentage}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className={styles.limit}>
                <span>Limite: R$ {limit.toLocaleString('pt-BR')}</span>
                <span>Gasto: R$ {spent.toLocaleString('pt-BR')}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
