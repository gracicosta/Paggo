import React, { useState } from 'react';
import { LuCheck, LuEye, LuEyeOff, LuKeyRound, LuMail, LuUser } from 'react-icons/lu';
import { PASSWORD_RULES } from './passwordRules';
import styles from './OnboardingWizard.module.css';

interface StepAccountProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  onPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
}

/**
 * Última etapa de dados do cadastro: a pessoa cria a senha.
 * Os outros dados da conta (CPF, data de nascimento etc.) podem entrar aqui depois.
 */
export const StepAccount: React.FC<StepAccountProps> = ({
  name,
  email,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  const [show, setShow] = useState(false);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <div className={styles.iconBadge}>
          <LuKeyRound size={24} />
        </div>
        <div>
          <h3 className={styles.stepTitle}>Falta pouco! Crie sua senha</h3>
          <p className={styles.stepDescription}>
            É com ela que você vai entrar no Paggo junto com o seu e-mail.
          </p>
        </div>
      </div>

      <div className={styles.accountInfo}>
        <span>
          <LuUser size={16} aria-hidden="true" /> {name}
        </span>
        <span>
          <LuMail size={16} aria-hidden="true" /> {email}
        </span>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="onb-password">
            Senha
          </label>
          <div className={styles.currencyInputWrapper}>
            <input
              id="onb-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className={styles.passwordInput}
              autoFocus
            />
            <button
              type="button"
              className={styles.eyeToggle}
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={show}
            >
              {show ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="onb-password-confirm">
            Confirme a senha
          </label>
          <div className={styles.currencyInputWrapper}>
            <input
              id="onb-password-confirm"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Digite a senha de novo"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className={styles.passwordInput}
              aria-invalid={mismatch}
              aria-describedby="onb-password-match"
            />
          </div>
          <span id="onb-password-match" className={mismatch ? styles.passwordError : styles.inputHint}>
            {mismatch ? 'As senhas não são iguais.' : 'Repita a senha para não errar na digitação.'}
          </span>
        </div>
      </div>

      <ul className={styles.ruleList} aria-label="Regras da senha">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={ok ? styles.ruleOk : ''}>
              <span className={styles.ruleDot} aria-hidden="true">
                {ok && <LuCheck size={12} strokeWidth={3} />}
              </span>
              {rule.label}
              <span className="sr-only">{ok ? ' (cumprida)' : ' (pendente)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
