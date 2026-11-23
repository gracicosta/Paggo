import React, { useEffect, useState } from 'react';
import {
  LuArrowRight,
  LuCheck,
  LuCircleAlert,
  LuContrast,
  LuEye,
  LuEyeOff,
  LuInfo,
  LuLoader,
  LuLock,
  LuMail,
  LuMoon,
  LuShield,
  LuUser,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { isGoogleConfigured, signInWithGoogle } from './googleAuth';
import logo from '../../assets/images/paggo-logo.png';
import photo from '../../assets/images/login-cofrinho.jpg';
import styles from './AuthPage.module.css';

/** Credenciais fictícias para entrar no protótipo (abrem o perfil demonstrativo). */
const TEST_CREDENTIALS = {
  email: 'teste@paggo.com',
  password: 'paggo123',
} as const;

const PREFS_KEY = 'paggo_login_prefs';
const REMEMBER_KEY = 'paggo_remember_email';
const FONT_STEPS = [0.875, 1, 1.125, 1.25, 1.375];

interface Prefs {
  dark: boolean;
  contrast: boolean;
  readable: boolean;
  fontStep: number;
}

function loadPrefs(): Prefs {
  const fallback: Prefs = {
    dark: typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    contrast: false,
    readable: false,
    fontStep: 1,
  };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** Barra de acessibilidade: A−, A+, fonte legível, alto contraste e modo escuro. */
const AccessibilityBar: React.FC<{
  variant: 'page' | 'hero';
  prefs: Prefs;
  onChange: (next: Partial<Prefs>) => void;
}> = ({ variant, prefs, onChange }) => (
  <div
    className={`${styles.a11yBar} ${variant === 'hero' ? styles.a11yHero : styles.a11yPage}`}
    role="toolbar"
    aria-label="Acessibilidade"
  >
    <button
      type="button"
      className={styles.a11yBtn}
      onClick={() => onChange({ fontStep: Math.max(0, prefs.fontStep - 1) })}
      disabled={prefs.fontStep === 0}
      aria-label="Diminuir tamanho do texto"
      title="Diminuir texto"
    >
      A−
    </button>
    <button
      type="button"
      className={styles.a11yBtn}
      onClick={() => onChange({ fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) })}
      disabled={prefs.fontStep === FONT_STEPS.length - 1}
      aria-label="Aumentar tamanho do texto"
      title="Aumentar texto"
    >
      A+
    </button>
    <button
      type="button"
      className={`${styles.a11yBtn} ${styles.a11yReadable} ${prefs.readable ? styles.a11yOn : ''}`}
      onClick={() => onChange({ readable: !prefs.readable })}
      aria-pressed={prefs.readable}
      aria-label="Fonte de leitura facilitada"
      title="Fonte de leitura facilitada"
    >
      Aa
    </button>
    <button
      type="button"
      className={`${styles.a11yBtn} ${prefs.contrast ? styles.a11yOn : ''}`}
      onClick={() => onChange({ contrast: !prefs.contrast })}
      aria-pressed={prefs.contrast}
      aria-label="Alto contraste"
      title="Alto contraste"
    >
      <LuContrast size={18} />
    </button>
    <button
      type="button"
      className={`${styles.a11yBtn} ${styles.a11yTheme} ${prefs.dark ? styles.a11yThemeOn : ''}`}
      onClick={() => onChange({ dark: !prefs.dark })}
      aria-pressed={prefs.dark}
      aria-label="Modo escuro"
      title="Modo escuro"
    >
      <LuMoon size={17} />
      <span className={styles.a11yThemeLabel}>{prefs.dark ? 'Escuro ativo' : 'Escuro'}</span>
    </button>
  </div>
);

export const AuthPage: React.FC = () => {
  const { login, register, loginAsDemo } = useAuth();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* preferências são opcionais */
    }
  }, [prefs]);

  const updatePrefs = (next: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...next }));

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const switchMode = (next: 'login' | 'register') => {
    resetMessages();
    setPassword('');
    setShowPassword(false);
    setMode(next);
  };

  const persistRemember = (value: string) => {
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, value);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignora */
    }
  };

  const handleGoogle = async () => {
    resetMessages();
    if (!isGoogleConfigured()) {
      setInfo(
        'O login com Google ainda não foi configurado neste ambiente. Use o acesso de teste por e-mail e senha.',
      );
      return;
    }
    setGoogleLoading(true);
    try {
      const profile = await signInWithGoogle();
      // Conta já existente neste navegador → entra; senão cria o perfil e segue para o onboarding.
      if (!login(profile.email, '')) {
        register(profile.name, profile.email, '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Digite um e-mail válido, por exemplo: nome@email.com.');
      return;
    }

    if (cleanEmail === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      persistRemember(cleanEmail);
      loginAsDemo();
      return;
    }

    // Contas criadas neste navegador pelo "Criar conta grátis".
    if (cleanEmail !== TEST_CREDENTIALS.email && login(cleanEmail, password)) {
      persistRemember(cleanEmail);
      return;
    }

    setError('E-mail ou senha incorretos. Confira os dados e tente de novo.');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim() || !cleanEmail || !password) {
      setError('Preencha nome, e-mail e senha para criar sua conta.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Digite um e-mail válido, por exemplo: nome@email.com.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    persistRemember(cleanEmail);
    register(name.trim(), cleanEmail, password);
  };

  const handleForgot = () => {
    resetMessages();
    setInfo(
      `A recuperação de senha ainda não está disponível no protótipo. Para testar, use ${TEST_CREDENTIALS.email} com a senha ${TEST_CREDENTIALS.password}.`,
    );
  };

  const wrapperClass = [
    styles.page,
    prefs.dark ? styles.dark : '',
    prefs.contrast ? styles.highContrast : '',
    prefs.readable ? styles.readable : '',
  ].join(' ');

  const isLogin = mode === 'login';

  return (
    <div className={wrapperClass} style={{ '--fs': FONT_STEPS[prefs.fontStep] } as React.CSSProperties}>
      {/* Painel da marca */}
      <aside className={styles.hero}>
        <div className={styles.heroTop}>
          <img src={logo} alt="Paggo" className={styles.logo} />
          <AccessibilityBar variant="hero" prefs={prefs} onChange={updatePrefs} />
        </div>

        <div className={styles.heroCopy}>
          <h1 className={styles.heroTitle}>
            Seu dinheiro,
            <br />
            <span className={styles.heroTitleAccent}>do seu jeito.</span>
          </h1>
          <p className={styles.heroText}>
            Veja para onde vai cada real, crie metas para os seus sonhos e receba um plano de ação com IA, tudo em
            linguagem simples.
          </p>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.photoFrame}>
            <div className={styles.photo}>
              <img src={photo} alt="" className={styles.photoImg} />

              <div className={`${styles.floatCard} ${styles.cardSaldo}`}>
                <span className={styles.cardLabel}>Saldo do mês</span>
                <strong className={styles.cardValue}>R$ 4.280,90</strong>
                <span className={styles.cardBadge}>▲ 12%</span>
                <svg className={styles.sparkline} viewBox="0 0 200 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="paggoSpark" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 42 L30 36 L55 40 L85 28 L110 32 L140 20 L165 22 L200 8 L200 50 L0 50 Z" fill="url(#paggoSpark)" />
                  <path
                    d="M0 42 L30 36 L55 40 L85 28 L110 32 L140 20 L165 22 L200 8"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className={`${styles.floatCard} ${styles.cardMeta}`}>
                <div className={styles.cardMetaHead}>
                  <div>
                    <span className={styles.cardLabel}>Meta: Viagem</span>
                    <strong className={styles.cardValue}>68%</strong>
                  </div>
                  <span className={styles.cardMetaIcon}>✈️</span>
                </div>
                <div className={styles.progress}>
                  <span style={{ width: '68%' }} />
                </div>
              </div>

              <div className={`${styles.floatCard} ${styles.cardCofrinho}`}>
                <span className={styles.coin}>R$</span>
                <div>
                  <span className={styles.cardLabel}>Cofrinho</span>
                  <strong className={styles.cardValueSm}>+ R$ 150,00 hoje</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className={styles.heroBadges}>
          <li>
            <span aria-hidden="true">🔒</span> <strong>Dados protegidos</strong> pela LGPD
          </li>
          <li>
            <span aria-hidden="true">⭐</span> <strong>Grátis</strong> para começar
          </li>
        </ul>
      </aside>

      {/* Formulário */}
      <main className={styles.formSide}>
        <AccessibilityBar variant="page" prefs={prefs} onChange={updatePrefs} />

        <div className={styles.formWrap}>
          <h2 className={styles.title}>
            {isLogin ? (
              <>
                Bem-vindo de volta <span aria-hidden="true">👋</span>
              </>
            ) : (
              'Crie sua conta grátis'
            )}
          </h2>
          <p className={styles.subtitle}>
            {isLogin
              ? 'Entre para ver seus gastos, metas e o plano que a IA preparou para você.'
              : 'Leva menos de um minuto. Depois, vamos montar seu plano financeiro juntos.'}
          </p>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={googleLoading}
            aria-busy={googleLoading}
          >
            {googleLoading ? <LuLoader className={styles.spin} size={20} /> : <GoogleIcon />}
            {isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}
          </button>

          <div className={styles.divider}>
            <span>ou {isLogin ? 'entre' : 'cadastre-se'} com seu e-mail</span>
          </div>

          {error && (
            <div className={styles.alertError} role="alert">
              <LuCircleAlert size={18} />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className={styles.alertInfo} role="status">
              <LuInfo size={18} />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} noValidate className={styles.form}>
            {!isLogin && (
              <div className={styles.field}>
                <label htmlFor="auth-name">Nome</label>
                <div className={styles.inputBox}>
                  <LuUser size={20} aria-hidden="true" />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Como prefere ser chamado(a)?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="auth-email">E-mail</label>
              <div className={styles.inputBox}>
                <LuMail size={20} aria-hidden="true" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu.nome@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error && !email.trim()}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="auth-password">Senha</label>
              <div className={styles.inputBox}>
                <LuLock size={20} aria-hidden="true" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Sua senha' : 'Mínimo de 6 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error && !password}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className={styles.row}>
                <label className={styles.checkbox}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className={styles.checkboxBox} aria-hidden="true">
                    <LuCheck size={14} strokeWidth={3} />
                  </span>
                  Lembrar de mim
                </label>
                <button type="button" className={styles.linkBtn} onClick={handleForgot}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              {isLogin ? 'Entrar' : 'Criar conta'} <LuArrowRight size={20} aria-hidden="true" />
            </button>
          </form>

          <p className={styles.switchText}>
            {isLogin ? 'Ainda não tem conta? ' : 'Já tem conta? '}
            <button type="button" className={styles.linkBtn} onClick={() => switchMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Criar conta grátis' : 'Entrar'}
            </button>
          </p>
        </div>

        <footer className={styles.footer}>
          <LuShield size={15} aria-hidden="true" />
          <span>Conexão segura</span>
          <span className={styles.footerAdult}>· Somente maiores de 18 anos</span>
          <span aria-hidden="true">·</span>
          <a href="#termos">Termos</a>
          <span aria-hidden="true">·</span>
          <a href="#privacidade">Privacidade</a>
        </footer>
      </main>
    </div>
  );
};
