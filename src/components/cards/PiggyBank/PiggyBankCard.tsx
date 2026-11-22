import { useState } from "react";
import { useFinance } from "../../../context/FinanceContext";
import { motion } from "motion/react";
import styles from "./PiggyBankCard.module.css";
import { PiPiggyBankLight, PiAirplaneTiltFill, PiStudentFill, PiEyeBold, PiEyeClosedBold } from "react-icons/pi";
import { FaHouseChimney } from "react-icons/fa6";
import { GoArrowRight } from "react-icons/go";
import { smoothSpring } from "../../animations/transitions";
import { BiChevronRight } from "react-icons/bi";
import type { PiggyBankItemModel } from "../../../types/auth";

function PiggyBankItem({ item }: { item: PiggyBankItemModel }) {
  const [isVisible, setIsVisible] = useState(false);
  const percentage = Math.round(((item.savedAmount || 0) / (item.goalAmount || 1)) * 100);
  const progress = item.goalAmount ? ((item.savedAmount || 0) / item.goalAmount) * 100 : 0;

  const isTrip = item.title.toLowerCase().includes('viagem') || item.title.toLowerCase().includes('férias');
  const isHouse = item.title.toLowerCase().includes('casa') || item.title.toLowerCase().includes('moradia');

  return (
    <motion.div
      className={styles.piggyBankCard}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={smoothSpring}
    >
      <div
        className={styles.iconCard}
        style={{ background: `${item.progressColor}18` }}
      >
        {isTrip ? (
          <PiAirplaneTiltFill size={30} style={{ color: item.progressColor }} />
        ) : isHouse ? (
          <FaHouseChimney size={30} style={{ color: item.progressColor }} />
        ) : (
          <PiStudentFill size={30} style={{ color: item.progressColor }} />
        )}
      </div>
      <div className={styles.goalInfo}>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </div>
      <div className={styles.progressCard}>
        <span style={{ color: item.progressColor }} className={styles.percentage}>
          {percentage}%
        </span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: item.progressColor,
            }}
          />
        </div>
      </div>
      <div className={styles.savingsInfo}>
        <div className={styles.savedAmount}>
          <span>
            R$ {isVisible ? Number(item.savedAmount).toFixed(2) : "•••••"}
          </span>
          {isVisible ? (
            <PiEyeBold size={15} onClick={() => setIsVisible(false)} />
          ) : (
            <PiEyeClosedBold size={15} onClick={() => setIsVisible(true)} />
          )}
        </div>
        <div className={styles.goalAmount}>
          <p>de R$ {Number(item.goalAmount).toFixed(2)}</p>
        </div>
      </div>
      <div className={styles.chevron}>
        <BiChevronRight />
      </div>
    </motion.div>
  );
}

export function PiggyBankCard() {
  const { piggyBanks } = useFinance();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={styles.containerPiggyBank}
    >
      <div className={styles.containerHeader}>
        <PiPiggyBankLight className={styles.iconPiggy} />
        <p className={styles.title}>Cofrinhos</p>
        <a href="#" title="Seguir para página do cofrinho">
          Ver todos <GoArrowRight />
        </a>
      </div>

      <div className={styles.piggyBankList}>
        {piggyBanks.map((item) => (
          <PiggyBankItem key={item.id} item={item} />
        ))}
      </div>
    </motion.section>
  );
}
