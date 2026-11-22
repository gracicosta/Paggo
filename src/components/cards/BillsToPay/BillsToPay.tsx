import { motion } from "motion/react";
import styles from "./BillsToPay.module.css";
import { GoArrowRight } from "react-icons/go";
import { useFinance } from "../../../context/FinanceContext";
import { smoothSpring } from "../../animations/transitions";
import { PiStudentBold } from "react-icons/pi";
import { TbWorld } from "react-icons/tb";
import { LuLightbulb } from "react-icons/lu";
import { IoWaterOutline } from "react-icons/io5";
import { LuReceipt } from "react-icons/lu";

export function BillsToPay() {
  const { fixedBills } = useFinance();

  const getBillIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('faculdade') || t.includes('estudo') || t.includes('escola')) {
      return { icon: PiStudentBold, color: '#DC2626', bg: '#FEF2F2' };
    }
    if (t.includes('internet') || t.includes('fibra') || t.includes('wifi')) {
      return { icon: TbWorld, color: '#2563EB', bg: '#EFF6FF' };
    }
    if (t.includes('luz') || t.includes('energia') || t.includes('enel')) {
      return { icon: LuLightbulb, color: '#EAB308', bg: '#FEFCE8' };
    }
    if (t.includes('água') || t.includes('agua') || t.includes('saneamento')) {
      return { icon: IoWaterOutline, color: '#14B8A6', bg: '#F0FDFA' };
    }
    return { icon: LuReceipt, color: '#8B5CF6', bg: '#F5F3FF' };
  };

  const calculateDueText = (dueDay: number) => {
    const today = new Date().getDate();
    const diff = dueDay - today;
    if (diff === 0) return 'Vence hoje';
    if (diff === 1) return 'Vence amanhã';
    if (diff > 1) return `Vence em ${diff} dias`;
    return `Vencido há ${Math.abs(diff)} dias`;
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={styles.containerBillsToPay}
    >
      <div className={styles.containerHeader}>
        <p>Boletos a Vencer</p>
        <a href="#" title="Seguir para página de faturas">
          Ver todas <GoArrowRight />
        </a>
      </div>

      <div className={styles.billsToPayList}>
        {fixedBills.map((item) => {
          const { icon: Icon, color, bg } = getBillIcon(item.title);
          const dueText = calculateDueText(item.dueDay);

          return (
            <motion.div
              key={item.id}
              className={styles.billsToPayCard}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={smoothSpring}
            >
              <div className={styles.billsToPayIcon} style={{ background: bg }}>
                <Icon color={color} />
              </div>
              <div className={styles.billsToPayInfo}>
                <p>{item.title}</p>
                <p>{dueText}</p>
              </div>
              <div className={styles.billsToPayPrice}>
                <p className={styles.paymentAmount}>
                  R$ {Number(item.value).toFixed(2)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
