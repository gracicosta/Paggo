import { useEffect, useRef, useState } from 'react';
import { LuBot, LuSend, LuSparkles, LuX } from 'react-icons/lu';
import { sendChat, type AiUiContext, type ChatMsg } from '../../services/aiService';
import styles from './Ai.module.css';

/** Perguntas prontas da demo (Slide 6): um toque já envia. */
const QUICK_QUESTIONS = [
  'Posso pedir pizza hoje?',
  'Quanto falta para a minha meta?',
  'O que acontece se eu atrasar um boleto?',
];

interface Props {
  /** Recorte dos dados da tela para as respostas locais (sem API). */
  ui: AiUiContext;
}

/**
 * Assistente do Paggo: botão flutuante no canto que abre o chat.
 * Responde curto, em linguagem simples — sem "CDI", "amortização" ou "fluxo de caixa".
 */
export function AssistantChat({ ui }: Props) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Rola para a última mensagem quando chega resposta ou abre o painel
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, thinking, open]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || thinking) return;
    setInput('');
    setMsgs((prev) => [...prev, { role: 'user', text: message }]);
    setThinking(true);
    try {
      const history = msgs.slice(-6);
      const reply = await sendChat(message, history, ui);
      setMsgs((prev) => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.chatFab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente do Paggo'}
        aria-expanded={open}
      >
        {open ? <LuX size={22} /> : <LuBot size={24} />}
      </button>

      {open && (
        <section className={styles.chatPanel} role="dialog" aria-label="Assistente do Paggo">
          <header className={styles.chatHead}>
            <span className={styles.chatAvatar} aria-hidden="true"><LuBot size={18} /></span>
            <div>
              <h2>Assistente do Paggo</h2>
              <small>Respostas curtas, sem termos difíceis</small>
            </div>
          </header>

          <div ref={listRef} className={styles.chatList} aria-live="polite">
            {msgs.length === 0 && (
              <div className={styles.chatHello}>
                <p>Oi! Sou o assistente do Paggo. Pode perguntar do seu jeito, sem medo de palavra difícil.</p>
                <div className={styles.quickList}>
                  {QUICK_QUESTIONS.map((q) => (
                    <button key={q} type="button" className={styles.quickBtn} onClick={() => send(q)}>
                      <LuSparkles size={13} aria-hidden="true" /> {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <p key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : ''}`}>
                {m.text}
              </p>
            ))}
            {thinking && <p className={styles.bubbleTyping}>Pensando…</p>}
          </div>

          <form
            className={styles.chatForm}
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              type="text"
              value={input}
              maxLength={300}
              placeholder="Pergunte do seu jeito…"
              onChange={(e) => setInput(e.target.value)}
              aria-label="Sua pergunta"
            />
            <button type="submit" className={styles.chatSend} disabled={!input.trim() || thinking} aria-label="Enviar">
              <LuSend size={17} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
