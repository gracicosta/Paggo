import React, { useEffect, useRef, useState } from 'react';
import {
  LuArrowLeft,
  LuArrowRight,
  LuCalendar,
  LuCheck,
  LuCircleAlert,
  LuIdCard,
  LuInfo,
  LuLoader,
  LuLock,
  LuMail,
  LuShield,
  LuUser,
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { isGoogleConfigured, isGoogleMockEnabled, signInWithGoogle, type GoogleProfile } from './googleAuth';
import { pageClassName } from './authPrefs';
import { FONT_STEPS } from '../../constants/palettes';
import { isValidEmail } from '../../utils/validation';
import type { Prefs } from '../../types/prefs';
import { AccessibilityBar, GoogleIcon } from './AuthWidgets';
import {
  PASSWORD_RULES,
  isPasswordValid,
  maskCpf,
  maskDate,
  normalizeName,
  onlyDigits,
  passwordStrength,
  toIsoDate,
  validateBirthDate,
  validateCpf,
  validateFullName,
} from './signupValidation';
import logo from '../../assets/images/paggo-logo.png';
import photo from '../../assets/images/login-cofrinho.jpg';
import styles from './AuthPage.module.css';
import s from './SignupPage.module.css';
import { legalHref } from '../Legal/legalRoute';

type Step = 1 | 2;
type FieldName = 'email' | 'password' | 'confirm' | 'name' | 'cpf' | 'birth' | 'terms';

const STEP_NAMES: Record<Step, string> = { 1: 'Sua conta', 2: 'Sobre você' };

interface SignupPageProps {
  prefs: Prefs;
  onPrefsChange: (next: Partial<Prefs>) => void;
  /** Volta para o login. Recebe o e-mail quando a pessoa já tem conta. */
  onGoToLogin: (email?: string) => void;
  /** Quando a pessoa tentou "Entrar com Google" sem ter conta: o cadastro abre no passo 2. */
  googleProfile?: GoogleProfile | null;
}

/**
 * Tela de cadastro em 2 passos (design aprovado em design/cadastro/).
 *  - Passo 1 "Sua conta": Google ou e-mail + senha.
 *  - Passo 2 "Sobre você": nome completo, CPF, data de nascimento (18+) e aceite dos termos.
 * A escolha do tamanho da letra fica no onboarding (e na barra de acessibilidade, no topo).
 * A renda não é pedida aqui: ela fica no onboarding financeiro, que abre logo depois.
 */
export const SignupPage: React.FC<SignupPageProps> = ({ prefs, onPrefsChange, onGoToLogin, googleProfile }) => {
  const { register, loginWithGoogle, isEmailRegistered, isCpfRegistered } = useAuth();

  const [step, setStep] = useState<Step>(googleProfile ? 2 : 1);
  const [google, setGoogle] = useState<GoogleProfile | null>(googleProfile ?? null);

  // Passo 1
  const [email, setEmail] = useState(googleProfile?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Passo 2
  const [name, setName] = useState(googleProfile?.name ?? '');
  const [cpf, setCpf] = useState('');
  const [birth, setBirth] = useState('');
  const [terms, setTerms] = useState(false);

  // Erros aparecem quando a pessoa sai do campo ou tenta avançar
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<Partial<Record<FieldName, string>>>({});
  const [alert, setAlert] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Ao trocar de passo, leva o foco ao título (leitor de tela anuncia o novo passo)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  /* ----------------------------- Validação ----------------------------- */

  const cleanEmail = email.trim().toLowerCase();

  const errors: Record<FieldName, string | null> = {
    email: !cleanEmail
      ? 'Digite seu e-mail.'
      : !isValidEmail(cleanEmail)
        ? 'Digite um e-mail válido, por exemplo: nome@email.com.'
        : (serverError.email ?? null),
    password: !password
      ? 'Crie uma senha.'
      : !isPasswordValid(password)
        ? 'A senha precisa ter 8 caracteres ou mais, com letra e número.'
        : null,
    confirm: !confirm ? 'Repita a senha.' : confirm !== password ? 'As senhas não são iguais.' : null,
    name: validateFullName(name),
    cpf: validateCpf(cpf) ?? serverError.cpf ?? null,
    birth: validateBirthDate(birth),
    terms: terms ? null : 'Para criar a conta, você precisa aceitar os termos.',
  };

  const STEP_FIELDS: Record<Step, FieldName[]> = {
    1: ['email', 'password', 'confirm'],
    2: ['name', 'cpf', 'birth', 'terms'],
  };

  const showError = (f: FieldName) => (touched[f] ? errors[f] : null);
  const boxState = (f: FieldName, value: string) =>
    showError(f) ? s.bad : value && !errors[f] ? s.ok : '';
  const touch = (f: FieldName) => setTouched((t) => ({ ...t, [f]: true }));

  const focusFirstInvalid = (fields: FieldName[]) => {
    const first = fields.find((f) => errors[f]);
    if (first) document.getElementById(`signup-${first}`)?.focus();
  };

  /* ------------------------------- Ações ------------------------------- */

  const handleGoogle = async () => {
    setAlert(null);
    if (!isGoogleConfigured() && !isGoogleMockEnabled()) {
      setAlert({
        type: 'info',
        text: 'O cadastro com Google ainda não foi configurado neste ambiente. Use seu e-mail e uma senha.',
      });
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const outcome = await loginWithGoogle(
        result.accessToken
          ? { accessToken: result.accessToken }
          : { mockProfile: { name: result.profile.name, email: result.profile.email } },
      );
      if (outcome.status === 'logged_in') return;
      setGoogle(result.profile);
      setEmail(outcome.profile.email);
      setName((current) => current || outcome.profile.name);
      setStep(2);
    } catch (e) {
      setAlert({ type: 'error', text: e instanceof Error ? e.message : 'Não foi possível usar o Google agora.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setTouched((t) => ({ ...t, email: true, password: true, confirm: true }));

    if (STEP_FIELDS[1].some((f) => errors[f])) {
      focusFirstInvalid(STEP_FIELDS[1]);
      return;
    }
    setSubmitting(true);
    try {
      if (await isEmailRegistered(cleanEmail)) {
        setServerError((se) => ({ ...se, email: 'Já existe uma conta com esse e-mail.' }));
        document.getElementById('signup-email')?.focus();
        return;
      }
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setTouched((t) => ({ ...t, name: true, cpf: true, birth: true, terms: true }));

    if (STEP_FIELDS[2].some((f) => errors[f])) {
      focusFirstInvalid(STEP_FIELDS[2]);
      return;
    }
    const cpfDigits = onlyDigits(cpf);
    setSubmitting(true);
    try {
      if (await isCpfRegistered(cpfDigits)) {
        setServerError((se) => ({ ...se, cpf: 'Esse CPF já tem uma conta no Paggo.' }));
        document.getElementById('signup-cpf')?.focus();
        return;
      }

      await register(normalizeName(name), google?.email ?? cleanEmail, google ? '' : password, {
        cpf: cpfDigits,
        birthDate: toIsoDate(birth),
        termsAcceptedAt: new Date().toISOString(),
        provider: google ? 'google' : 'email',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível criar sua conta agora.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setAlert(null);
    if (google) {
      // Quem veio pelo Google volta para escolher outra forma de cadastro
      setGoogle(null);
      setEmail('');
    }
    setStep(1);
  };

  /* ------------------------------- Render ------------------------------ */

  const strength = passwordStrength(password);

  const renderError = (f: FieldName, extra?: React.ReactNode) =>
    showError(f) ? (
      <span id={`signup-${f}-msg`} className={s.err} role="alert">
        <LuCircleAlert size={16} aria-hidden="true" />
        <span>
          {errors[f]}
          {extra}
        </span>
      </span>
    ) : null;

  const describedBy = (f: FieldName) => `signup-${f}-msg`;

  return (
    <div
      className={pageClassName(prefs, [s.signup, prefs.dark ? s.dark : '', prefs.contrast ? s.highContrast : ''].join(' '))}
      style={{ '--fs': FONT_STEPS[prefs.fontStep] } as React.CSSProperties}
    >
      {/* ------------------------- Painel da marca ------------------------- */}
      <aside className={styles.hero}>
        <div className={styles.heroTop}>
          <img src={logo} alt="Paggo" className={styles.logo} />
          <AccessibilityBar variant="hero" prefs={prefs} onChange={onPrefsChange} />
        </div>

        <div className={styles.heroCopy}>
          <h1 className={styles.heroTitle}>
            Sua conta em
            <br />
            <span className={styles.heroTitleAccent}>2 passos simples.</span>
          </h1>
          <p className={styles.heroText}>Leva só 1 minuto. Depois, o Paggo monta com você um plano para o seu dinheiro.</p>
        </div>

        <ol className={s.steps} aria-label="Etapas do cadastro">
          {([1, 2] as Step[]).map((n) => {
            const state = n < step ? 'done' : n === step ? 'current' : 'todo';
            return (
              <li
                key={n}
                className={state === 'done' ? s.stepDone : state === 'current' ? s.stepCurrent : ''}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <b aria-hidden="true">{state === 'done' ? <LuCheck size={16} strokeWidth={3} /> : n}</b>
                <span>
                  {STEP_NAMES[n]}
                  <span className="sr-only">{state === 'done' ? ' (concluído)' : state === 'current' ? ' (passo atual)' : ''}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className={`${styles.visual} ${s.visual}`} aria-hidden="true">
          <div className={styles.photoFrame}>
            <div className={`${styles.photo} ${s.photo}`}>
              <img src={photo} alt="" className={styles.photoImg} />
              <div className={`${styles.floatCard} ${s.cardDone}`}>
                <span className={styles.cardLabel}>Conta criada</span>
                <strong className={s.cardStrong}>
                  <span className={s.cardCheck}>✓</span>Tudo certo!
                </strong>
              </div>
              <div className={`${styles.floatCard} ${s.cardPlan}`}>
                <span className={styles.cardLabel}>Seu plano</span>
                <strong className={s.cardStrong}>Pronto em 1 min</strong>
              </div>
            </div>
          </div>
        </div>

        <ul className={styles.heroBadges}>
          <li>
            <span aria-hidden="true">🔒</span> <strong>Dados protegidos</strong> pela LGPD
          </li>
          <li>
            <span aria-hidden="true">✅</span> <strong>Só maiores</strong> de 18 anos
          </li>
        </ul>
      </aside>

      {/* ---------------------------- Formulário --------------------------- */}
      <main className={styles.formSide}>
        <AccessibilityBar variant="page" prefs={prefs} onChange={onPrefsChange} />

        <div className={`${styles.formWrap} ${s.formWrap}`}>
          <div className={s.progress}>
            <span className={s.progressLabel}>
              Passo <b>{step} de 2</b> · {STEP_NAMES[step]}
            </span>
            <div className={s.bars} aria-hidden="true">
              <i className={s.barOn} />
              <i className={step === 2 ? s.barOn : ''} />
            </div>
          </div>

          <h2 className={styles.title} ref={titleRef} tabIndex={-1}>
            {step === 1 ? 'Crie sua conta grátis' : 'Agora, conte um pouco sobre você'}
          </h2>
          <p className={styles.subtitle}>
            {step === 1
              ? 'Use o Google ou seu e-mail. É com eles que você vai entrar no Paggo.'
              : 'Esses dados deixam sua conta segura. Só você vê.'}
          </p>

          {alert && (
            <div
              className={`${alert.type === 'error' ? styles.alertError : styles.alertInfo} ${s.alert}`}
              role={alert.type === 'error' ? 'alert' : 'status'}
            >
              {alert.type === 'error' ? <LuCircleAlert size={18} /> : <LuInfo size={18} />}
              <span>{alert.text}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogle}
                disabled={googleLoading}
                aria-busy={googleLoading}
              >
                {googleLoading ? <LuLoader className={styles.spin} size={20} /> : <GoogleIcon />}
                Cadastrar com Google
              </button>

              <div className={styles.divider}>
                <span>ou crie com seu e-mail</span>
              </div>

              <form onSubmit={handleStep1} noValidate className={styles.form}>
                {/* E-mail */}
                <div className={styles.field}>
                  <label htmlFor="signup-email">E-mail</label>
                  <div className={`${styles.inputBox} ${boxState('email', email)}`}>
                    <LuMail size={20} aria-hidden="true" />
                    <input
                      id="signup-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seu.nome@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setServerError((se) => ({ ...se, email: undefined }));
                      }}
                      onBlur={() => email && touch('email')}
                      aria-invalid={!!showError('email')}
                      aria-describedby={describedBy('email')}
                    />
                  </div>
                  {renderError(
                    'email',
                    serverError.email && (
                      <>
                        {' '}
                        <button type="button" className={styles.linkBtn} onClick={() => onGoToLogin(cleanEmail)}>
                          Entrar com ele
                        </button>
                      </>
                    ),
                  ) ?? (
                    <span id={describedBy('email')} className={s.hint}>
                      <LuInfo size={15} aria-hidden="true" />
                      Você vai usar esse e-mail para entrar e receber avisos importantes.
                    </span>
                  )}
                </div>

                {/* Senha */}
                <div className={styles.field}>
                  <label htmlFor="signup-password">Crie uma senha</label>
                  <div className={`${styles.inputBox} ${boxState('password', password)}`}>
                    <LuLock size={20} aria-hidden="true" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => password && touch('password')}
                      aria-invalid={!!showError('password')}
                      aria-describedby="signup-password-rules signup-password-msg"
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

                  {password && (
                    <>
                      <div className={`${s.meter} ${s[`meter_${strength.tone}`]}`} aria-hidden="true">
                        {[1, 2, 3, 4].map((i) => (
                          <i key={i} className={i <= strength.level ? s.meterOn : ''} />
                        ))}
                      </div>
                      <div className={s.meterLabel} aria-live="polite">
                        <span>Força da senha</span>
                        <b className={s[`tone_${strength.tone}`]}>{strength.label}</b>
                      </div>
                    </>
                  )}

                  <ul id="signup-password-rules" className={s.rules} aria-label="O que a senha precisa ter">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li key={rule.id} className={ok ? s.ruleOk : ''}>
                          <span className={s.ruleDot} aria-hidden="true">
                            {ok && <LuCheck size={11} strokeWidth={3.5} />}
                          </span>
                          {rule.label}
                          <span className="sr-only">{ok ? ' (feito)' : ' (falta)'}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {renderError('password')}
                </div>

                {/* Repetir senha */}
                <div className={styles.field}>
                  <label htmlFor="signup-confirm">Repita a senha</label>
                  <div className={`${styles.inputBox} ${boxState('confirm', confirm)}`}>
                    <LuLock size={20} aria-hidden="true" />
                    <input
                      id="signup-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Digite a mesma senha"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => confirm && touch('confirm')}
                      aria-invalid={!!showError('confirm')}
                      aria-describedby={describedBy('confirm')}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Ocultar senha repetida' : 'Mostrar senha repetida'}
                      aria-pressed={showConfirm}
                    >
                      {showConfirm ? <LuEyeOff size={20} /> : <LuEye size={20} />}
                    </button>
                  </div>
                  {renderError('confirm') ??
                    (confirm && confirm === password ? (
                      <span id={describedBy('confirm')} className={s.okMsg}>
                        <LuCheck size={15} aria-hidden="true" /> As senhas são iguais.
                      </span>
                    ) : (
                      <span id={describedBy('confirm')} className={s.hint}>
                        <LuInfo size={15} aria-hidden="true" />
                        Repetir a senha evita erro de digitação.
                      </span>
                    ))}
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <LuLoader className={styles.spin} size={20} /> : null}
                  Continuar <LuArrowRight size={20} aria-hidden="true" />
                </button>
              </form>

              <p className={styles.switchText}>
                Já tem conta?{' '}
                <button type="button" className={styles.linkBtn} onClick={() => onGoToLogin()}>
                  Entrar
                </button>
              </p>
            </>
          ) : (
            <form onSubmit={handleStep2} noValidate className={`${styles.form} ${s.form2}`}>
              {google && (
                <div className={s.googleChip}>
                  <GoogleIcon />
                  <span>
                    Conta Google: <b>{google.email}</b>
                  </span>
                </div>
              )}

              {/* Nome completo */}
              <div className={styles.field}>
                <label htmlFor="signup-name">Nome completo</label>
                <div className={`${styles.inputBox} ${boxState('name', name)}`}>
                  <LuUser size={20} aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    placeholder="Como está no seu documento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => name && touch('name')}
                    aria-invalid={!!showError('name')}
                    aria-describedby={describedBy('name')}
                  />
                </div>
                {renderError('name') ?? (
                  <span id={describedBy('name')} className={s.hint}>
                    <LuInfo size={15} aria-hidden="true" />
                    Nome e sobrenome, como no documento. Vamos te chamar pelo primeiro nome.
                  </span>
                )}
              </div>

              <div className={s.row2}>
                {/* CPF */}
                <div className={styles.field}>
                  <label htmlFor="signup-cpf">CPF</label>
                  <div className={`${styles.inputBox} ${boxState('cpf', cpf)}`}>
                    <LuIdCard size={20} aria-hidden="true" />
                    <input
                      id="signup-cpf"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={cpf}
                      onChange={(e) => {
                        setCpf(maskCpf(e.target.value));
                        setServerError((se) => ({ ...se, cpf: undefined }));
                      }}
                      onBlur={() => cpf && touch('cpf')}
                      aria-invalid={!!showError('cpf')}
                      aria-describedby={describedBy('cpf')}
                    />
                  </div>
                  {renderError(
                    'cpf',
                    serverError.cpf && (
                      <>
                        {' '}
                        <button type="button" className={styles.linkBtn} onClick={() => onGoToLogin()}>
                          Quer entrar?
                        </button>
                      </>
                    ),
                  ) ?? (
                    <span id={describedBy('cpf')} className={s.hint}>
                      <LuShield size={15} aria-hidden="true" />
                      Confirma que a conta é sua. Fica guardado em segurança. Só você vê.
                    </span>
                  )}
                </div>

                {/* Data de nascimento */}
                <div className={styles.field}>
                  <label htmlFor="signup-birth">Data de nascimento</label>
                  <div className={`${styles.inputBox} ${boxState('birth', birth)}`}>
                    <LuCalendar size={20} aria-hidden="true" />
                    <input
                      id="signup-birth"
                      type="text"
                      inputMode="numeric"
                      autoComplete="bday"
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      value={birth}
                      onChange={(e) => setBirth(maskDate(e.target.value))}
                      onBlur={() => birth && touch('birth')}
                      aria-invalid={!!showError('birth')}
                      aria-describedby={describedBy('birth')}
                    />
                  </div>
                  {renderError('birth') ?? (
                    <span id={describedBy('birth')} className={s.hint}>
                      <LuInfo size={15} aria-hidden="true" />O Paggo é só para maiores de 18 anos.
                    </span>
                  )}
                </div>
              </div>

              {/* Termos */}
              <div className={styles.field}>
                <label className={`${s.terms} ${showError('terms') ? s.termsBad : ''}`}>
                  <input
                    id="signup-terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      touch('terms');
                    }}
                    aria-invalid={!!showError('terms')}
                    aria-describedby={describedBy('terms')}
                  />
                  <span className={s.termsBox} aria-hidden="true">
                    <LuCheck size={16} strokeWidth={3} />
                  </span>
                  <span>
                    Li e aceito os{' '}
                    <a href={legalHref('termos')}>
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href={legalHref('privacidade')}>
                      Política de Privacidade
                    </a>{' '}
                    do Paggo.
                  </span>
                </label>
                {renderError('terms')}
              </div>

              <div className={s.buttons}>
                <button type="button" className={s.backBtn} onClick={handleBack}>
                  <LuArrowLeft size={18} aria-hidden="true" /> Voltar
                </button>
                <button type="submit" className={`${styles.submitBtn} ${s.createBtn}`} disabled={submitting}>
                  {submitting ? <LuLoader className={styles.spin} size={20} /> : null}
                  Criar minha conta <LuArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </div>

        <footer className={styles.footer}>
          <LuShield size={15} aria-hidden="true" />
          <span>Conexão segura</span>
          <span aria-hidden="true">·</span>
          <a href={legalHref('termos')}>Termos</a>
          <span aria-hidden="true">·</span>
          <a href={legalHref('privacidade')}>Privacidade</a>
        </footer>
      </main>
    </div>
  );
};
