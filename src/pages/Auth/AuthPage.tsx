import React, { useEffect, useState } from 'react';
import {
  LuArrowRight,
  LuCheck,
  LuCircleAlert,
  LuEye,
  LuEyeOff,
  LuInfo,
  LuLoader,
  LuLock,
  LuMail,
  LuShield,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { isGoogleConfigured, signInWithGoogle, type GoogleProfile } from './googleAuth';
import logo from '../../assets/images/paggo-logo.png';
import photo from '../../assets/images/login-cofrinho.jpg';
import { loadPrefs, isValidEmail, pageClassName, PREFS_KEY, REMEMBER_KEY, FONT_STEPS, type Prefs } from './authPrefs';
import { AccessibilityBar, GoogleIcon } from './AuthWidgets';
import { SignupPage } from './SignupPage';
import styles from './AuthPage.module.css';

/** Credenciais fictícias para entrar no protótipo (abrem o perfil demonstrativo). */
const TEST_CREDENTIALS = {
  email: 'teste@paggo.com',
  password: 'paggo123',
} as const;

export const AuthPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSignup, setGoogleSignup] = useState<GoogleProfile | null>(null);

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
      // Conta já existente neste navegador → entra. Se não existe, abre o cadastro já no
      // passo 2 ("Sobre você") com nome e e-mail do Google preenchidos.
      if (!login(profile.email, '')) {
        setGoogleSignup(profile);
        switchMode('register');
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

  const handleForgot = () => {
    resetMessages();
    setInfo(
      `A recuperação de senha ainda não está disponível no protótipo. Para testar, use ${TEST_CREDENTIALS.email} com a senha ${TEST_CREDENTIALS.password}.`,
    );
  };

  // "Criar conta grátis" abre a tela de cadastro em 2 passos (mesmas preferências de acessibilidade).
  if (mode === 'register') {
    return (
      <SignupPage
        prefs={prefs}
        onPrefsChange={updatePrefs}
        googleProfile={googleSignup}
        onGoToLogin={(registeredEmail) => {
          if (registeredEmail) setEmail(registeredEmail);
          setGoogleSignup(null);
          switchMode('login');
        }}
      />
    );
  }

  const wrapperClass = pageClassName(prefs);

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
            Bem-vindo de volta <span aria-hidden="true">👋</span>
          </h2>
          <p className={styles.subtitle}>
            Entre para ver seus gastos, metas e o plano que a IA preparou para você.
          </p>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={googleLoading}
            aria-busy={googleLoading}
          >
            {googleLoading ? <LuLoader className={styles.spin} size={20} /> : <GoogleIcon />}
            Entrar com Google
          </button>

          <div className={styles.divider}>
            <span>ou entre com seu e-mail</span>
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

          <form onSubmit={handleLogin} noValidate className={styles.form}>
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
                  autoComplete="current-password"
                  placeholder="Sua senha"
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

            <button type="submit" className={styles.submitBtn}>
              Entrar <LuArrowRight size={20} aria-hidden="true" />
            </button>
          </form>

          <p className={styles.switchText}>
            Ainda não tem conta?{' '}
            <button type="button" className={styles.linkBtn} onClick={() => switchMode('register')}>
              Criar conta grátis
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
