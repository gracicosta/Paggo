import { motion } from 'motion/react';
import styles from './StatsCard.module.css';
import type { IconType } from "react-icons"
import { smoothSpring } from '../../animations/transitions';

interface StatsCardProps {
    title: string
    value: string
    percentage?: string
    description: string
    icon: IconType
    trendIcon: IconType
    variant: 'green' | 'red' | 'blue'
}

export function StatsCard({
    title,
    value, 
    percentage,
    description,
    icon: Icon,
    trendIcon: TrendIcon,
    variant
}: StatsCardProps) {
    return (
        <motion.article whileHover={{ y: -6, boxShadow: "0px 18px 40px rgba(0,0,0,0.12)",}} transition={smoothSpring} className={`${styles.statsCardContent} ${styles[variant]}`}>
            <div className={styles.floatingIcon}>
                <Icon />
            </div>

            <div className={styles.statsCardInfo}>
                <p className={styles.statsTitle}>{title}</p>

                <div className={styles.valueSection}>
                    <h2 className={styles.totalValue}>{value}</h2>

                    <div className={styles.trendIndicator}>
                        <TrendIcon className={styles.trendIcon}/>

                        <p className={styles.trendDescription}><span className={styles.percentageValue}>{percentage}</span>{description}</p>
                    </div>
                </div>
            </div>
        </motion.article>
    )
}