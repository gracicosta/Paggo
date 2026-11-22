import { GoArrowRight } from "react-icons/go";
import { useFinance } from "../../../context/FinanceContext";
import styles from "./SubscriptionCard.module.css";
import { motion } from "motion/react";
import { smoothSpring } from "../../animations/transitions";
import { SiNetflix, SiSpotify } from "react-icons/si";
import { FaAmazon } from "react-icons/fa6";
import { LuSparkles } from "react-icons/lu";

export function SubscriptionCard() {
  const { subscriptions } = useFinance();

  const getSubIcon = (service: string) => {
    switch (service) {
      case 'netflix':
        return SiNetflix;
      case 'spotify':
        return SiSpotify;
      case 'amazon':
        return FaAmazon;
      default:
        return LuSparkles;
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={styles.containerSubscription}
    >
      <div className={styles.containerHeader}>
        <p>Assinaturas</p>
        <a href="#" title="Seguir para página de assinaturas">
          Ver todos <GoArrowRight />
        </a>
      </div>

      <div className={styles.subscriptionsList}>
        {subscriptions.map((item) => {
          const Icon = getSubIcon(item.service);
          const color = item.color || '#3b82f6';

          return (
            <motion.div
              key={item.id}
              className={styles.subscriptionCard}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={smoothSpring}
            >
              <div className={styles.subscriptionContent}>
                <Icon className={styles.icon} color={color} />
                {item.name}
                <div className={styles.contentDescription}>
                  <span className={styles.subscriptionDate}>Dia {item.dueDay}</span>
                  <span className={styles.subscriptionName}>
                    R$ {Number(item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
