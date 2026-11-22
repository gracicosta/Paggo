import { useState } from 'react'
import styles from './NavBar.module.css'
import { NAV_SECTIONS } from './navItems'
import { useAuth } from '../../../context/AuthContext'

import logotipo from '../../../assets/images/logotipo-dark.png'

import { motion, AnimatePresence } from "motion/react";
import { smoothSpring, itemVariants, sidebarVariants } from "../../animations/transitions"

import { IoMdNotificationsOutline } from "react-icons/io";
import { GoGear } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { LuLogOut } from "react-icons/lu";

export function NavBar() {
    const { user, logout } = useAuth();
    const [active, setActive] = useState("Dashboard");
    const [collapsed, setCollapsed] = useState(false);
    
    const displayName = user?.name ? user.name : "Visitante";

    return (
        <motion.aside initial={{ width: 96, opacity: 0 }} animate={{ width: collapsed ? 84 : 240, opacity: 1 }} transition={smoothSpring} className={!collapsed ? styles.asideBar : styles.asideBarCollapsed }>
            <motion.div variants={sidebarVariants} initial="hidden" animate="show" className={styles.asideInner}>
                <section className={!collapsed ? styles.sidebarHeader : styles.sidebarHeaderCollapsed}>
                    <article className={!collapsed ? styles.brandContainer : styles.brandContainerCollapsed}>
                        <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={smoothSpring} className={styles.brandBox}>
                            <img src={logotipo} alt="Logotipo do ConsumIQ" className={styles.logotipo} />
                        </motion.div>

                        <AnimatePresence initial={false}>
                            {!collapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.50, ease: "easeOut" }} className={styles.brandTextWrap}>
                                    <h2 className={styles.title}>ConsumIQ</h2>
                                    <p className={styles.subTitle}>Finanças Inteligentes</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </article>
                    
                    <motion.button onClick={() => setCollapsed(!collapsed)} className={styles.buttonToggle} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        {collapsed ? <HiChevronRight size={14} /> : <HiChevronLeft size={14} />}
                    </motion.button>
                </section>

                <motion.nav variants={itemVariants} className={styles.nav}>
                    {NAV_SECTIONS.map((nav) => (
                        <motion.div transition={smoothSpring} key={nav.title} className={!collapsed ? styles.containerNav : styles.containerNavCollapsed}>
                            <AnimatePresence initial={false}>
                                {!collapsed && (
                                    <motion.p layout className={styles.categoryTitle}>{nav.title}</motion.p>
                                )}
                            </AnimatePresence>
                            {nav.items.map((item) => (
                                <motion.button layout="position" transition={smoothSpring} whileTap={{ scale: 0.98 }} key={item.label} title={collapsed ? item.label : undefined} className={`${styles.buttonList} ${active === item.label ? styles.buttonListActive : styles.buttonListDisabled} ${collapsed ? styles.centerButton : styles.justifyStartButton}`} onClick={() => setActive(item.label)}>
                                    <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`${styles.iconButtonNav} ${active === item.label ? styles.iconButtonNavActive : ''}`}>
                                        {item.icon}
                                    </motion.span>

                                    <AnimatePresence initial={false} mode="popLayout">
                                        {!collapsed && (
                                            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ 
                                                width: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                                                opacity: { duration: 0.16 },
                                            }} className={styles.textCollapse}>
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ))} 
                        </motion.div>
                    ))}
                </motion.nav>

                <motion.section variants={itemVariants} className={styles.navContainerProfile}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={!collapsed ? styles.containerButtonsActions : styles.containerButtonsActionsCollapsed}>
                        <motion.button layout title='Notificações' className={styles.buttonActions}>
                            <IoMdNotificationsOutline size={collapsed ? 25 : 24} />
                        </motion.button>
                        <motion.button layout title='Configurações' className={styles.buttonActions}>
                            <GoGear size={collapsed ? 25 : 24} />
                        </motion.button>
                        <motion.button layout title='Dark Mode' className={styles.buttonActions}>
                            <MdOutlineDarkMode size={collapsed ? 25 : 24} />
                        </motion.button>
                        <motion.button 
                            layout 
                            title='Sair da conta' 
                            onClick={logout}
                            className={styles.buttonActions}
                            style={{ color: '#f87171' }}
                        >
                            <LuLogOut size={collapsed ? 23 : 22} />
                        </motion.button>
                    </motion.div>

                    <div className={!collapsed ? styles.containerProfile : styles.containerProfileCollapsed}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.imageProfile}>
                            <CiUser className={styles.logoProfile} />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={smoothSpring} className={`${styles.infoProfile} ${styles.textCollapse} ${!collapsed ? styles.text : styles.textDisabled}`}>
                            <p className={styles.nameProfile} title={displayName}>
                                {displayName.length > 15 ? `${displayName.slice(0, 15)}...` : displayName}
                            </p>
                            <p className={styles.versionProfile}>Perfil Calibrado</p>
                        </motion.div>
                    </div>
                </motion.section>
            </motion.div>
        </motion.aside>
    )
}
