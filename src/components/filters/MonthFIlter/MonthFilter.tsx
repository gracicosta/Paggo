import { useState } from "react"
import styles from './MonthFilter.module.css'
import { FiChevronDown } from "react-icons/fi"
import { AnimatePresence, motion } from "motion/react";
import { smoothSpring } from "../../animations/transitions"

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

const months = Array.from(
  { length: currentMonth + 1 },
  (_, index) => `${monthNames[index]} ${currentYear}`
);

months.push("Todos os meses");

export function MonthFilter() {
    const [open, setOpen] = useState(false)
    const [select, setSelect] = useState("Janeiro 2026")

    return (
        <motion.section whileHover={{scale: 1.03, y: -2,}} transition={smoothSpring} className={styles.monthFilterContainer}>
            <button className={styles.buttonFilter} type="button" title="button" onClick={() => setOpen(!open)}>
                <span>{select}</span>
                <motion.div animate={{ rotate: open ? 180 : 0, y: open ? -2 : 0, }} transition={smoothSpring}> 
                    <FiChevronDown />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                <motion.nav initial={{ opacity: 0, y: -10, scale: 0.96, }}animate={{ opacity: 1, y: 0, scale: 1, }} exit={{ opacity: 0, y: -10, scale: 0.96, }} transition={{ duration: 0.2, ease: "easeOut",}} className={styles.navMonthFilter}>
                    <ul>
                        {months.map((month) => (
                            <li key={month}>
                                <button type="button" title="button" onClick={() => {setSelect(month); setOpen(false)}} className={styles.buttonMonth}>
                                {month}
                                </button>
                            </li>
                        ))}
                    </ul>
                </motion.nav>
                )}
            </AnimatePresence>
        </motion.section>
    )
}