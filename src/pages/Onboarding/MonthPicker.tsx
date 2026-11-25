import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LuCalendar, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import o from './Onboarding.module.css';

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Quantos anos à frente o calendário deixa escolher. */
const MAX_YEARS = 10;

const parse = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return { y, m: m - 1 };
};
const toIso = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/**
 * Escolha de mês e ano no visual do Paggo (substitui o calendário do navegador,
 * que não segue o tema). Abre um cartão com o ano e os 12 meses.
 * Teclado: setas andam pelos meses, Enter escolhe, Esc fecha.
 */
export const MonthPicker: React.FC<{
  value: string | null;
  /** Primeiro mês que pode ser escolhido ("aaaa-mm"). */
  min: string;
  onChange: (value: string | null) => void;
}> = ({ value, min, onChange }) => {
  const minP = parse(min);
  const maxYear = minP.y + MAX_YEARS;
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => (value ? parse(value).y : minP.y));
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = value ? parse(value) : null;
  const isDisabled = (y: number, m: number) => y < minP.y || (y === minP.y && m < minP.m) || y > maxYear;

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const toggle = () => {
    if (!open) setYear(selected?.y ?? minP.y);
    setOpen((v) => !v);
  };

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Mantém o cartão dentro da tela (no celular o botão pode estar perto da borda)
  useLayoutEffect(() => {
    if (!open || !wrapRef.current || !popRef.current) return;
    const wrap = wrapRef.current.getBoundingClientRect();
    const width = popRef.current.offsetWidth;
    const margin = 12;
    const left = Math.min(0, window.innerWidth - margin - (wrap.left + width));
    setOffset(Math.max(left, margin - wrap.left));
    popRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);

  // Ao abrir, leva o foco ao mês escolhido (ou ao primeiro disponível)
  useEffect(() => {
    if (!open) return;
    popRef.current?.querySelector<HTMLButtonElement>('[data-current="true"], button[data-month]:not(:disabled)')?.focus();
  }, [open]);

  const moveFocus = (e: React.KeyboardEvent<HTMLButtonElement>, m: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (delta === undefined) return;
    e.preventDefault();
    let target = m + delta;
    let y = year;
    if (target < 0) {
      if (y - 1 < minP.y) return;
      y -= 1;
      target += 12;
    } else if (target > 11) {
      if (y + 1 > maxYear) return;
      y += 1;
      target -= 12;
    }
    if (isDisabled(y, target)) return;
    if (y !== year) setYear(y);
    requestAnimationFrame(() =>
      popRef.current?.querySelector<HTMLButtonElement>(`button[data-month="${target}"]`)?.focus(),
    );
  };

  const label = selected ? `${MONTHS_SHORT[selected.m]} de ${selected.y}` : 'Escolher data';

  return (
    <div className={o.mpWrap} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`${o.chip} ${selected ? o.chipSel : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-pressed={Boolean(selected)}
        onClick={toggle}
      >
        <LuCalendar size={15} aria-hidden="true" />
        {label}
      </button>

      {open && (
        <div
          className={o.mp}
          ref={popRef}
          role="dialog"
          aria-label="Escolher mês e ano da meta"
          style={{ left: offset }}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <div className={o.mpHead}>
            <button
              type="button"
              className={o.mpNav}
              onClick={() => setYear((y) => y - 1)}
              disabled={year <= minP.y}
              aria-label="Ano anterior"
            >
              <LuChevronLeft size={18} />
            </button>
            <strong aria-live="polite">{year}</strong>
            <button
              type="button"
              className={o.mpNav}
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= maxYear}
              aria-label="Próximo ano"
            >
              <LuChevronRight size={18} />
            </button>
          </div>

          <div className={o.mpGrid}>
            {MONTHS_SHORT.map((name, m) => {
              const on = selected?.y === year && selected.m === m;
              const disabled = isDisabled(year, m);
              return (
                <button
                  key={name}
                  type="button"
                  data-month={m}
                  data-current={on ? 'true' : undefined}
                  className={`${o.mpMonth} ${on ? o.mpOn : ''}`}
                  disabled={disabled}
                  aria-pressed={on}
                  aria-label={`${MONTHS_LONG[m]} de ${year}`}
                  onKeyDown={(e) => moveFocus(e, m)}
                  onClick={() => {
                    onChange(toIso(year, m));
                    close();
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className={o.mpFoot}>
            <button
              type="button"
              className={o.mpLink}
              disabled={!selected}
              onClick={() => {
                onChange(null);
                close();
              }}
            >
              Limpar
            </button>
            <button type="button" className={o.mpLink} onClick={() => close()}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
