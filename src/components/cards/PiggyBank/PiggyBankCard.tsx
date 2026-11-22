/* eslint-disable react-hooks/rules-of-hooks */
import { piggyBankData } from "../../../data/dashboardData";
import { motion } from "motion/react";
import styles from "./PiggyBankCard.module.css"

import { PiPiggyBankLight } from "react-icons/pi";
import { GoArrowRight } from "react-icons/go";
import { PiEyeBold, PiEyeClosedBold } from "react-icons/pi";
import { smoothSpring } from "../../animations/transitions";
import { BiChevronRight } from "react-icons/bi";
import { useState } from "react";


export function PiggyBankCard() {
    return (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut",}} className={styles.containerPiggyBank}>

            <div className={styles.containerHeader}>
                <PiPiggyBankLight className={styles.iconPiggy}/>
                <p className={styles.title}>Cofrinhos</p>
                <a href="#" title="Seguir para página do cofrinho">Ver todos <GoArrowRight/></a>
            </div>

            <div className={styles.piggyBankList}>
                {piggyBankData.map((item) => {
                    const percentage = Math.round((item.savedAmount / item.goalAmount) * 100)

                    const progress = item.goalAmount ? (item.savedAmount / item.goalAmount) * 100 : 0;

                    const [isVisible, setIsVisible] = useState(false);

                    return (
                        <motion.div className={styles.piggyBankCard} whileHover={{ scale: 1.03, y: -4, }} transition={smoothSpring}> 
                            <div className={styles.iconCard} style={{ background: item.iconBackground }}>
                                <item.icon size={30} style={{ color: item.iconColor }} />
                            </div>
                            <div className={styles.goalInfo}>
                                <h2>{item.title}</h2>
                                <p>{item.description}</p>
                            </div>
                            <div className={styles.progressCard}>
                                <span style={{ color: item.progressColor }} className={styles.percentage}>{percentage}%</span>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%`, backgroundColor:item.progressColor }} />
                                </div>
                            </div>
                            <div className={styles.savingsInfo}>
                                <div className={styles.savedAmount}>
                                    <span>R$ {isVisible ? item.savedAmount.toFixed(2) : "•••••"}</span>
                                    {isVisible ? (
                                        <PiEyeBold size={15} onClick={() => setIsVisible(false)} />

                                    ) : (
                                        <PiEyeClosedBold size={15} onClick={() => setIsVisible(true)} />
                                    )}
                                </div>
                                <div className={styles.goalAmount}>
                                    <p>de R$ {item.goalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className={styles.chevron}>
                                <BiChevronRight/>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

        </motion.section>
    )
}