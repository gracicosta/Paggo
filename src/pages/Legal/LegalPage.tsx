import React, { useEffect, useRef, useState } from 'react';
import {
  LuArrowLeft,
  LuCalendar,
  LuChevronDown,
  LuClock,
  LuFileText,
  LuLock,
  LuBot,
  LuMail,
  LuShield,
  LuTrash2,
  LuCheck,
} from 'react-icons/lu';
import logoOnDark from '../../assets/images/paggo-logo.png';
import logoOnLight from '../../assets/images/paggo-logo-escura.png';
import { AccessibilityBar } from '../Auth/AuthWidgets';
import { FONT_STEPS } from '../../constants/palettes';
import { seriesColor } from '../../utils/palette';
import { usePrefs } from '../../hooks/usePrefs';
import { DOCS, LEGAL_UPDATED_AT, LEGAL_VERSION, SUMMARY, type LegalDoc } from './legalContent';
import { legalHref, type LegalRoute } from './legalRoute';
import styles from './LegalPage.module.css';

interface LegalPageProps {
  route: LegalRoute;
  onSwitchDoc: (doc: LegalDoc) => void;
  onClose: () => void;
}

const OTHER: Record<LegalDoc, LegalDoc> = { termos: 'privacidade', privacidade: 'termos' };

/**
 * Página de Termos de Uso e Política de Privacidade (design opção B, "sem juridiquês").
 * Abre por cima da tela de origem (login, cadastro ou onboarding) sem desmontá-la,
 * então o "Voltar" devolve a pessoa exatamente onde estava, com o formulário preenchido.
 */
export const LegalPage: React.FC<LegalPageProps> = ({ route, onSwitchDoc, onClose }) => {
  const { doc, section } = route;
  const content = DOCS[doc];

  const [open, setOpen] = useState<Set<string>>(() => new Set([section ?? content.sections[0].id]));
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Mesmas preferências de acessibilidade do resto do app (salvas e avisadas para a tela de origem).
  const { prefs, updatePrefs } = usePrefs({ sync: 'broadcast' });

  // Ao abrir ou trocar de documento (App.tsx remonta a página com outra "key"):
  // rola até o tópico pedido e leva o foco ao título.
  useEffect(() => {
    document.title = `${DOCS[doc].label} · Paggo`;
    requestAnimationFrame(() => {
      const target = section ? document.getElementById(`legal-${doc}-${section}`) : null;
      if (target) {
        target.scrollIntoView({ block: 'start' });
        target.querySelector('button')?.focus({ preventScroll: true });
      } else {
        window.scrollTo(0, 0);
        titleRef.current?.focus({ preventScroll: true });
      }
    });
  }, [doc, section]);

  useEffect(() => () => void (document.title = 'Paggo'), []);

  // Esc volta para a tela anterior.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = open.size === content.sections.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(content.sections.map((s) => s.id)));

  const goToSection = (id: string) => {
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      const el = document.getElementById(`legal-${doc}-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.querySelector('button')?.focus({ preventScroll: true });
    });
  };

  const className = [styles.legal, prefs.dark ? styles.dark : '', prefs.contrast ? styles.highContrast : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} style={{ '--fs': FONT_STEPS[prefs.fontStep] } as React.CSSProperties}>
      <header className={styles.nav}>
        <div className={styles.navLeft}>
          <img src={prefs.dark ? logoOnDark : logoOnLight} alt="Paggo" className={styles.logo} />
          <nav className={styles.tabs} aria-label="Documentos">
            <button type="button" className={styles.backLink} onClick={onClose}>
              <LuArrowLeft size={18} aria-hidden="true" /> Voltar
            </button>
            {(['termos', 'privacidade'] as LegalDoc[]).map((d) => (
              <a
                key={d}
                href={legalHref(d)}
                className={`${styles.tab} ${d === doc ? styles.tabOn : ''}`}
                aria-current={d === doc ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (d !== doc) onSwitchDoc(d);
                }}
              >
                {DOCS[d].label}
              </a>
            ))}
          </nav>
        </div>
        <div className={styles.a11y}>
          <AccessibilityBar variant="inline" prefs={prefs} onChange={updatePrefs} />
        </div>
      </header>

      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="legal-title">
          <div className={styles.heroCopy}>
            <span className={styles.heroTag}>
              {doc === 'termos' ? <LuFileText aria-hidden="true" /> : <LuShield aria-hidden="true" />}
              {content.tag}
            </span>
            <h1 id="legal-title" ref={titleRef} tabIndex={-1} className={styles.heroTitle}>
              {content.title}
              <br />
              <em>{content.titleAccent}</em>
            </h1>
            <p className={styles.heroText}>{content.intro}</p>
            <div className={styles.heroMeta}>
              <span>
                <LuCalendar aria-hidden="true" /> Atualizada em {LEGAL_UPDATED_AT}
              </span>
              <span>
                <LuClock aria-hidden="true" /> {content.readTime}
              </span>
            </div>
          </div>

          <div className={styles.art} aria-hidden="true">
            <div className={styles.shield}>
              {doc === 'termos' ? <LuFileText /> : <LuLock />}
            </div>
            {doc === 'privacidade' ? (
              <>
                <div className={`${styles.chip} ${styles.chip1}`}>
                  <i className={styles.chipOk}><LuCheck /></i>
                  <div>CPF ***.482.***-07<small>Guardado com segurança</small></div>
                </div>
                <div className={`${styles.chip} ${styles.chip2}`}>
                  <i className={styles.chipInfo}><LuBot /></i>
                  <div>IA sem dados pessoais<small>Só números anônimos</small></div>
                </div>
                <div className={`${styles.chip} ${styles.chip3}`}>
                  <i className={styles.chipDanger}><LuTrash2 /></i>
                  <div>Excluir conta<small>Quando você quiser</small></div>
                </div>
              </>
            ) : (
              <>
                <div className={`${styles.chip} ${styles.chip1}`}>
                  <i className={styles.chipOk}><LuCheck /></i>
                  <div>Maiores de 18 anos<small>Uma conta por pessoa</small></div>
                </div>
                <div className={`${styles.chip} ${styles.chip2}`}>
                  <i className={styles.chipInfo}><LuBot /></i>
                  <div>A IA orienta<small>Quem decide é você</small></div>
                </div>
                <div className={`${styles.chip} ${styles.chip3}`}>
                  <i className={styles.chipDanger}><LuTrash2 /></i>
                  <div>Premium sem multa<small>Cancele quando quiser</small></div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className={styles.h2row}>
          <h2>Em 30 segundos</h2>
          <span>O essencial antes de você aceitar</span>
        </div>
        <ul className={styles.cards}>
          {SUMMARY[doc].map((c, i) => (
            <li
              key={c.title}
              className={styles.card}
              style={{ '--accent': seriesColor(prefs.palette, prefs.dark, i, c.color) } as React.CSSProperties}
            >
              <span className={styles.cardIcon} aria-hidden="true">
                <c.icon />
              </span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <div className={styles.cardTags}>
                {c.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.h2row}>
          <h2>Versão completa</h2>
          <button type="button" className={styles.toggleAll} onClick={toggleAll}>
            {allOpen ? 'Fechar todos os tópicos' : 'Abrir todos os tópicos'}
          </button>
        </div>

        <div className={styles.split}>
          <div className={styles.accordion}>
            {content.sections.map((s, i) => {
              const isOpen = open.has(s.id);
              const panelId = `legal-${doc}-${s.id}-panel`;
              return (
                <section
                  key={`${doc}-${s.id}`}
                  id={`legal-${doc}-${s.id}`}
                  className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
                >
                  <h3 className={styles.itemHeading}>
                    <button
                      type="button"
                      className={styles.itemBtn}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(s.id)}
                    >
                      <span className={styles.itemIcon} aria-hidden="true">
                        <s.icon />
                      </span>
                      <span className={styles.itemTitle}>
                        {i + 1}. {s.title}
                      </span>
                      <LuChevronDown className={styles.chev} aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={panelId} className={styles.itemBody} hidden={!isOpen}>
                    {s.body}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className={styles.side} aria-label="Nesta página">
            <h3>Nesta página</h3>
            <ol className={styles.toc}>
              {content.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={legalHref(doc, s.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      goToSection(s.id);
                    }}
                  >
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
            <div className={styles.sideBox}>
              <p>
                {doc === 'termos'
                  ? 'Quer saber como cuidamos dos seus dados?'
                  : 'Quer ver as regras de uso do app?'}
              </p>
              <button type="button" className={styles.ghostBtn} onClick={() => onSwitchDoc(OTHER[doc])}>
                {doc === 'termos' ? <LuShield aria-hidden="true" /> : <LuFileText aria-hidden="true" />}
                Ler {doc === 'termos' ? 'a Política de Privacidade' : 'os Termos de Uso'}
              </button>
              <a
                className={styles.ghostBtn}
                href={doc === 'termos' ? 'mailto:contato@paggo.com.br' : 'mailto:privacidade@paggo.com.br'}
              >
                <LuMail aria-hidden="true" /> {doc === 'termos' ? 'Falar com a gente' : 'Falar com o DPO'}
              </a>
            </div>
          </aside>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.primaryBtn} onClick={onClose}>
            <LuArrowLeft size={20} aria-hidden="true" /> Voltar para onde eu estava
          </button>
          <p>
            Versão {LEGAL_VERSION} · Atualizada em {LEGAL_UPDATED_AT}. Texto de exemplo para o protótipo do hackathon: os
            e-mails de contato são fictícios.
          </p>
        </footer>
      </main>
    </div>
  );
};
