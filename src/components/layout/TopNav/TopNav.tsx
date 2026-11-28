import { useRef, useState } from 'react';
import { MdBarChart, MdSwapHoriz, MdLightbulbOutline, MdOutlineDarkMode } from 'react-icons/md';
import { LuPiggyBank, LuLogOut, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { GoGear } from 'react-icons/go';
import { FaCalendar } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import { CiUser } from 'react-icons/ci';
import { useAuth } from '../../../context/AuthContext';
import { useDismiss } from '../../../hooks/useDismiss';
import { usePrefs } from '../../../hooks/usePrefs';
import { CHART_PALETTES, FONT_STEPS } from '../../../constants/palettes';
import type { PaletteId } from '../../../types/prefs';
import { MONTH_NAMES, MONTHS_SHORT, parseMonthLabel } from '../../../utils/dates';
import logoLight from '../../../assets/images/paggo-logo.png';
import logoDark from '../../../assets/images/paggo-logo-escura.png';
import styles from './TopNav.module.css';

/** Abas do menu principal. Só Dashboard e Transações têm tela por enquanto. */
export type PageId = 'Dashboard' | 'Transações' | 'Metas' | 'Insights';

const TABS: { label: PageId; icon: typeof MdBarChart }[] = [
  { label: 'Dashboard', icon: MdBarChart },
  { label: 'Transações', icon: MdSwapHoriz },
  { label: 'Metas', icon: LuPiggyBank },
  { label: 'Insights', icon: MdLightbulbOutline },
];

/** Paletas de acessibilidade (Slide 7): cores para daltônicos e alto contraste. */
const PALETTE_OPTIONS: { id: PaletteId; name: string }[] = [
  { id: 'padrao', name: 'Padrão' },
  { id: 'protan', name: 'Vermelho/verde' },
  { id: 'tritan', name: 'Azul/amarelo' },
  { id: 'contraste', name: 'Alto contraste' },
];

interface TopNavProps {
  dark: boolean;
  onToggleTheme: () => void;
  month: string;
  onMonthChange: (month: string) => void;
  active: PageId;
  onNavigate: (page: PageId) => void;
}

export function TopNav({ dark, onToggleTheme, month, onMonthChange, active, onNavigate }: TopNavProps) {
  const { user, logout } = useAuth();
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  // Acessibilidade (Slide 7): menu da engrenagem com letra A±, fonte de leitura e cores
  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yRef = useRef<HTMLDivElement>(null);
  const { prefs, updatePrefs } = usePrefs();

  const now = new Date();
  const thisYear = now.getFullYear();
  const { y: selYear, m: selMonth } = parseMonthLabel(month);
  const [pickerYear, setPickerYear] = useState(selYear);
  const displayName = user?.name || 'Visitante';

  // Fecha o seletor de meses ao clicar fora ou apertar Esc
  useDismiss(monthOpen, [monthRef], () => setMonthOpen(false), { escape: true });
  useDismiss(a11yOpen, [a11yRef], () => setA11yOpen(false), { escape: true });

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
            // No celular só o ícone aparece: o nome continua para leitores de tela
            aria-label={label}
            onClick={() => onNavigate(label)}
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
              {MONTHS_SHORT[selMonth]} {selYear}
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
                  const selected = i === selMonth && pickerYear === selYear;
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
                      {MONTHS_SHORT[i]}
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
        <div className={styles.monthWrap} ref={a11yRef}>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.hideSm}`}
            title="Acessibilidade"
            aria-label="Acessibilidade"
            aria-haspopup="dialog"
            aria-expanded={a11yOpen}
            onClick={() => setA11yOpen((o) => !o)}
          >
            <GoGear size={19} />
          </button>
          {a11yOpen && (
            <div className={`${styles.picker} ${styles.a11y}`} role="dialog" aria-label="Acessibilidade">
              <div className={styles.a11yRow}>
                <span>Tamanho da letra</span>
                <div className={styles.a11yBtns}>
                  <button
                    type="button"
                    disabled={prefs.fontStep <= 0}
                    onClick={() => updatePrefs({ fontStep: Math.max(0, prefs.fontStep - 1) })}
                    aria-label="Diminuir letra"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    disabled={prefs.fontStep >= FONT_STEPS.length - 1}
                    onClick={() => updatePrefs({ fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) })}
                    aria-label="Aumentar letra"
                  >
                    A+
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={`${styles.a11yToggle} ${prefs.readable ? styles.a11yOn : ''}`}
                aria-pressed={prefs.readable}
                onClick={() => updatePrefs({ readable: !prefs.readable })}
              >
                <b>Aa</b> Letra para dislexia
                <small>{prefs.readable ? 'Ligada' : 'Desligada'}</small>
              </button>
              <div className={styles.a11yRow}>
                <span>Cores</span>
              </div>
              <div className={styles.a11yPals}>
                {PALETTE_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.a11yPal} ${prefs.palette === p.id ? styles.a11yPalSel : ''}`}
                    aria-pressed={prefs.palette === p.id}
                    title={p.name}
                    onClick={() => updatePrefs({ palette: p.id })}
                  >
                    <span className={styles.a11ySwatch} aria-hidden="true">
                      {CHART_PALETTES[p.id].light.slice(0, 3).map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
