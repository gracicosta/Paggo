import { useEffect, useRef, useState } from 'react';
import { MdBarChart, MdSwapHoriz, MdLightbulbOutline, MdOutlineDarkMode } from 'react-icons/md';
import { LuPiggyBank, LuLogOut, LuContrast, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { GoGear } from 'react-icons/go';
import { FaCalendar } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import { CiUser } from 'react-icons/ci';
import { useAuth } from '../../../context/AuthContext';
import logoLight from '../../../assets/images/paggo-logo.png';
import logoDark from '../../../assets/images/paggo-logo-escura.png';
import styles from './TopNav.module.css';

const TABS = [
  { label: 'Dashboard', icon: MdBarChart },
  { label: 'Transações', icon: MdSwapHoriz },
  { label: 'Metas', icon: LuPiggyBank },
  { label: 'Insights', icon: MdLightbulbOutline },
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface TopNavProps {
  dark: boolean;
  onToggleTheme: () => void;
  colorblind: boolean;
  onToggleColorblind: () => void;
  month: string;
  onMonthChange: (month: string) => void;
}

export function TopNav({ dark, onToggleTheme, colorblind, onToggleColorblind, month, onMonthChange }: TopNavProps) {
  const { user, logout } = useAuth();
  const [active, setActive] = useState('Dashboard');
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const thisYear = now.getFullYear();
  const [selName, selYearRaw] = month.split(' ');
  const selYear = Number(selYearRaw) || thisYear;
  const [pickerYear, setPickerYear] = useState(selYear);
  const displayName = user?.name || 'Visitante';

  // Fecha o seletor de meses ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!monthOpen) return;
    const close = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setMonthOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMonthOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [monthOpen]);

  const openPicker = () => {
    setPickerYear(selYear);
    setMonthOpen((o) => !o);
  };

  return (
    <header className={styles.topNav}>
      <img src={dark ? logoLight : logoDark} alt="Paggo" className={styles.logo} />

      <nav className={styles.tabs} aria-label="Navegação principal">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`${styles.tab} ${active === label ? styles.tabActive : ''}`}
            aria-current={active === label ? 'page' : undefined}
            onClick={() => setActive(label)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.actions}>
        <div className={styles.monthWrap} ref={monthRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={openPicker}
            aria-haspopup="dialog"
            aria-expanded={monthOpen}
          >
            <FaCalendar size={14} className={styles.calendarIcon} />
            <span className={`${styles.monthLabel} ${styles.monthLong}`}>{month}</span>
            <span className={`${styles.monthLabel} ${styles.monthShort}`}>
              {selName.slice(0, 3)} {selYear}
            </span>
            <FiChevronDown size={16} className={monthOpen ? styles.chevronOpen : ''} />
          </button>

          {monthOpen && (
            <div className={styles.picker} role="dialog" aria-label="Escolher mês">
              <div className={styles.pickerHead}>
                <button
                  type="button"
                  className={styles.pickerNav}
                  onClick={() => setPickerYear((y) => y - 1)}
                  aria-label="Ano anterior"
                >
                  <LuChevronLeft size={18} />
                </button>
                <b>{pickerYear}</b>
                <button
                  type="button"
                  className={styles.pickerNav}
                  onClick={() => setPickerYear((y) => y + 1)}
                  disabled={pickerYear >= thisYear}
                  aria-label="Próximo ano"
                >
                  <LuChevronRight size={18} />
                </button>
              </div>
              <div className={styles.pickerGrid}>
                {MONTH_NAMES.map((name, i) => {
                  const future = pickerYear > thisYear || (pickerYear === thisYear && i > now.getMonth());
                  const selected = name === selName && pickerYear === selYear;
                  const isNow = pickerYear === thisYear && i === now.getMonth();
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={future}
                      aria-pressed={selected}
                      className={`${styles.pickerMonth} ${selected ? styles.pickerSelected : ''} ${isNow && !selected ? styles.pickerNow : ''}`}
                      onClick={() => {
                        onMonthChange(`${name} ${pickerYear}`);
                        setMonthOpen(false);
                      }}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button type="button" className={styles.iconBtn} title="Notificações" aria-label="Notificações">
          <IoMdNotificationsOutline size={21} />
          <span className={styles.dot} />
        </button>
        <button type="button" className={`${styles.iconBtn} ${styles.hideSm}`} title="Configurações" aria-label="Configurações">
          <GoGear size={19} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${colorblind ? styles.iconBtnOn : ''}`}
          title="Contraste para daltônicos"
          aria-label="Contraste para daltônicos"
          aria-pressed={colorblind}
          onClick={onToggleColorblind}
        >
          <LuContrast size={19} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${dark ? styles.iconBtnOn : ''}`}
          title="Modo escuro"
          aria-label="Modo escuro"
          aria-pressed={dark}
          onClick={onToggleTheme}
        >
          <MdOutlineDarkMode size={20} />
        </button>
        <button type="button" className={`${styles.iconBtn} ${styles.profileBtn}`} title={`${displayName} · Perfil calibrado`} aria-label={`Perfil de ${displayName}`}>
          <CiUser size={22} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.logout}`}
          title="Sair da conta"
          aria-label="Sair da conta"
          onClick={logout}
        >
          <LuLogOut size={18} />
        </button>
      </div>
    </header>
  );
}
