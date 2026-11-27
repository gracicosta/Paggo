import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useDismiss } from '../../hooks/useDismiss';
import type { IconType } from 'react-icons';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import styles from './Pickers.module.css';

export interface SelectOption<T extends string> {
  id: T;
  label: string;
  icon?: IconType;
  color?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

/** Altura máxima da lista aberta (em px), usada para decidir se abre para cima ou para baixo. */
const MENU_MAX = 300;

/**
 * Lista suspensa no visual do Paggo (troca o <select> nativo, que abre branco com azul do sistema).
 * Teclado: Enter/Espaço/↓ abre, ↑↓ Home End andam, Enter escolhe, Esc fecha, letra pula para a opção.
 */
export function SelectMenu<T extends string>({ label, value, options, onChange }: Props<T>) {
  const uid = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number }>({ left: 0, width: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const selected = options[selectedIndex];

  const openMenu = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].id);
    setOpen(false);
    btnRef.current?.focus();
  };

  // A lista fica "fixa" na tela para não ser cortada pela janela; abre para cima se faltar espaço embaixo
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setPos(
      below < Math.min(MENU_MAX, options.length * 46 + 12) && r.top > below
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6 }
        : { left: r.left, width: r.width, top: r.bottom + 6 },
    );
  }, [open, options.length]);

  // Fecha ao clicar fora, rolar a página ou mudar o tamanho da janela
  useDismiss(open, [btnRef, listRef], () => setOpen(false), { scrollAndResize: true });

  // Mantém a opção destacada visível
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        // Fecha só a lista, não a janela de transação
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const letter = e.key.toLowerCase();
          const order = [...options.slice(active + 1), ...options.slice(0, active + 1)];
          const hit = order.find((o) => o.label.toLowerCase().startsWith(letter));
          if (hit) setActive(options.indexOf(hit));
        }
    }
  };

  const Icon = selected?.icon;

  return (
    <div className={styles.selectWrap}>
      <span className={styles.metaLabel} id={`${uid}-label`}>
        {label}
      </span>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        className={`${styles.selectBtn} ${open ? styles.selectBtnOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-labelledby={`${uid}-label ${uid}-value`}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {Icon && (
          <span className={styles.selectIcon} style={{ color: selected.color }} aria-hidden="true">
            <Icon size={15} />
          </span>
        )}
        <span id={`${uid}-value`} className={styles.selectValue}>
          {selected?.label}
        </span>
        <LuChevronDown size={18} className={styles.selectChevron} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${uid}-list`}
          role="listbox"
          aria-labelledby={`${uid}-label`}
          className={`${styles.selectList} ${pos.bottom !== undefined ? styles.selectListUp : ''}`}
          style={{ left: pos.left, width: Math.max(pos.width, 220), top: pos.top, bottom: pos.bottom, maxHeight: MENU_MAX }}
        >
          {options.map((o, i) => {
            const OptIcon = o.icon;
            const isSel = o.id === value;
            return (
              <li
                key={o.id}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={isSel}
                className={`${styles.selectOption} ${i === active ? styles.selectOptionActive : ''} ${isSel ? styles.selectOptionOn : ''}`}
                onMouseEnter={() => setActive(i)}
                // mousedown + preventDefault: o foco não sai do botão
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                {OptIcon && (
                  <span
                    className={styles.selectIcon}
                    style={{ color: o.color, background: o.color ? `${o.color}22` : undefined }}
                    aria-hidden="true"
                  >
                    <OptIcon size={15} />
                  </span>
                )}
                <span className={styles.selectValue}>{o.label}</span>
                {isSel && <LuCheck size={17} className={styles.selectCheck} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
