import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LuCalendar, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { toIsoDate } from '../../context/TransactionsContext';
import styles from './Transactions.module.css';

const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const WEEK_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEK_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Altura aproximada do cartão aberto, para decidir se abre para cima. */
const POP_HEIGHT = 380;

const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};

/** "Hoje, 27/11", "Ontem, 26/11" ou "25/11/2026" */
function shortLabel(iso: string) {
  const today = toIsoDate(new Date());
  const [y, m, d] = iso.split('-');
  if (iso === today) return `Hoje, ${d}/${m}`;
  if (iso === toIsoDate(addDays(new Date(), -1))) return `Ontem, ${d}/${m}`;
  return `${d}/${m}/${y}`;
}

/**
 * Calendário de dias no visual do Paggo (mesmo estilo do calendário de mês do onboarding e do topo),
 * no lugar do calendário do navegador. Não deixa escolher datas depois de `max`.
 * Teclado: setas mudam o dia (←→ 1 dia, ↑↓ 1 semana), PageUp/PageDown mudam o mês,
 * Enter escolhe, Esc fecha só o calendário.
 */
export function DatePicker({
  value,
  max,
  onChange,
  label = 'Data',
}: {
  value: string;
  max: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // Dia com foco dentro do calendário (o mês mostrado é o dele)
  const [focusDay, setFocusDay] = useState(() => fromIso(value));
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });

  const maxDate = fromIso(max);
  const clampMax = (d: Date) => (d > maxDate ? maxDate : d);
  const viewY = focusDay.getFullYear();
  const viewM = focusDay.getMonth();

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const toggle = () => {
    if (!open) setFocusDay(fromIso(value));
    setOpen((v) => !v);
  };

  const choose = (d: Date) => {
    onChange(toIsoDate(d));
    close();
  };

  // Posição fixa na tela (não é cortado pela janela); abre para cima se faltar espaço
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left, window.innerWidth - 12 - width));
    const below = window.innerHeight - r.bottom;
    setPos(below < POP_HEIGHT && r.top > below ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 });
  }, [open]);

  // Fecha ao clicar fora, rolar a página ou mudar o tamanho da janela
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // O foco acompanha o dia destacado
  useEffect(() => {
    if (!open) return;
    popRef.current?.querySelector<HTMLButtonElement>(`button[data-day="${toIsoDate(focusDay)}"]`)?.focus();
  }, [open, focusDay]);

  const onDayKey = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      PageUp: () => addMonths(focusDay, -1),
      PageDown: () => addMonths(focusDay, 1),
      Home: () => addDays(focusDay, -focusDay.getDay()),
      End: () => addDays(focusDay, 6 - focusDay.getDay()),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocusDay(clampMax(moves[e.key]()));
    }
  };

  // Semanas do mês mostrado, começando no domingo
  const first = new Date(viewY, viewM, 1);
  const start = addDays(first, -first.getDay());
  const lastOfMonth = new Date(viewY, viewM + 1, 0);
  const weeks = Math.ceil((first.getDay() + lastOfMonth.getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const todayIso = toIsoDate(new Date());
  const canNext = new Date(viewY, viewM + 1, 1) <= maxDate;

  return (
    <div className={styles.dpWrap}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.dpTrigger} ${open ? styles.dpTriggerOpen : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${shortLabel(value)}. Mudar data`}
        onClick={toggle}
      >
        <LuCalendar size={16} aria-hidden="true" />
        <span>{shortLabel(value)}</span>
      </button>

      {open && (
        <div
          ref={popRef}
          className={`${styles.dp} ${pos.bottom !== undefined ? styles.dpUp : ''}`}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
          role="dialog"
          aria-label="Escolher data"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // Fecha só o calendário, não a janela de transação
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className={styles.dpHead}>
            <button
              type="button"
              className={styles.dpNav}
              onClick={() => setFocusDay(addMonths(focusDay, -1))}
              aria-label="Mês anterior"
            >
              <LuChevronLeft size={18} />
            </button>
            <strong aria-live="polite">
              {MONTHS_LONG[viewM]} de {viewY}
            </strong>
            <button
              type="button"
              className={styles.dpNav}
              onClick={() => setFocusDay(clampMax(addMonths(focusDay, 1)))}
              disabled={!canNext}
              aria-label="Próximo mês"
            >
              <LuChevronRight size={18} />
            </button>
          </div>

          <div className={styles.dpGrid} role="grid" aria-label={`${MONTHS_LONG[viewM]} de ${viewY}`}>
            {WEEK_SHORT.map((w, i) => (
              <span key={i} className={styles.dpWeek} aria-hidden="true">
                {w}
              </span>
            ))}
            {days.map((d) => {
              const iso = toIsoDate(d);
              const outside = d.getMonth() !== viewM;
              const future = d > maxDate;
              const selected = iso === value;
              const focused = iso === toIsoDate(focusDay);
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  tabIndex={focused ? 0 : -1}
                  disabled={future}
                  aria-pressed={selected}
                  aria-label={`${WEEK_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}${iso === todayIso ? ' (hoje)' : ''}`}
                  className={[
                    styles.dpDay,
                    outside ? styles.dpOutside : '',
                    iso === todayIso ? styles.dpToday : '',
                    selected ? styles.dpOn : '',
                  ].join(' ')}
                  onKeyDown={onDayKey}
                  onClick={() => choose(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.dpFoot}>
            <button type="button" className={styles.dpLink} onClick={() => choose(addDays(new Date(), -1))}>
              Ontem
            </button>
            <button type="button" className={styles.dpLink} onClick={() => choose(new Date())}>
              Hoje
            </button>
            <button type="button" className={`${styles.dpLink} ${styles.dpLinkMuted}`} onClick={() => close()}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
