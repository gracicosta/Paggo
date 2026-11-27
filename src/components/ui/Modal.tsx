import { useEffect, useRef } from 'react';
import { LuX } from 'react-icons/lu';
import styles from './Modal.module.css';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "alert" para a confirmação de excluir (leitores de tela anunciam na hora). */
  role?: 'dialog' | 'alertdialog';
  size?: 'sm' | 'md';
}

/** Janela por cima da tela. Fecha com Esc, no X ou clicando fora; o foco volta para onde estava. */
export function Modal({ title, onClose, children, role = 'dialog', size = 'md' }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    // Foca o primeiro campo (ou o botão marcado com data-autofocus)
    const first =
      box?.querySelector<HTMLElement>('[data-autofocus]') ??
      box?.querySelector<HTMLElement>('input, select, button:not([data-close])');
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key !== 'Tab' || !box) return;
      // Mantém o Tab dentro da janela
      const items = [...box.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]')].filter(
        (el) => !el.hasAttribute('disabled'),
      );
      if (!items.length) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={boxRef}
        className={`${styles.modal} ${size === 'sm' ? styles.modalSm : ''}`}
        role={role}
        aria-modal="true"
        aria-labelledby="paggo-modal-title"
      >
        <header className={styles.modalHead}>
          <h2 id="paggo-modal-title">{title}</h2>
          <button type="button" data-close className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <LuX size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
