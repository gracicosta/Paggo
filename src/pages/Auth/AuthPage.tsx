import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LuMail, LuLock, LuUser, LuArrowRight, LuSparkles } from 'react-icons/lu';
import { FaCircleCheck, FaCircleExclamation } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import logotipo from '../../assets/images/logotipo-dark.png';
import styles from './AuthPage.module.css';

export const AuthPage: React.FC = () => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Formulário Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulário Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    const success = login(loginEmail.trim(), loginPassword);
    if (!success) {
      setErrorMessage('Conta não encontrada ou senha incorreta. Se for seu primeiro acesso, clique em "Criar Perfil".');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Por favor, preencha todos os campos para iniciar seu cadastro.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    register(regName.trim(), regEmail.trim(), regPassword);
  };

  return (
    <div className={styles.authPageWrapper}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={styles.authContainer}
      >
        {/* Painel Esquerdo: Identidade do ConsumIQ */}
        <div className={styles.heroPanel}>
          <div className={styles.heroBrand}>
            <img src={logotipo} alt="ConsumIQ" className={styles.brandLogo} />
            <div className={styles.brandText}>
              <h1 className={styles.brandTitle}>ConsumIQ</h1>
              <span className={styles.brandSubtitle}>Finanças Inteligentes</span>
            </div>
          </div>

          <div className={styles.heroContent}>
            <h2 className={styles.heroHeading}>
              Seu dinheiro sob controle com{' '}
              <span className={styles.heroGradientText}>possibilidades reais.</span>
            </h2>
            <p className={styles.heroParagraph}>
              Adeus suposições. O ConsumIQ calibra suas despesas fixas, tetos por categoria e objetivos de poupança com base na sua renda líquida real.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <FaCircleCheck className={styles.checkIcon} size={18} />
                <span>Onboarding financeiro em 4 etapas guiadas</span>
              </div>
              <div className={styles.featureItem}>
                <FaCircleCheck className={styles.checkIcon} size={18} />
                <span>Sugestão de limites proporcionais à sua renda</span>
              </div>
              <div className={styles.featureItem}>
                <FaCircleCheck className={styles.checkIcon} size={18} />
                <span>Acompanhamento de metas e cofrinhos sem aperto</span>
              </div>
            </div>
          </div>

          <div className={styles.heroFooter}>
            ConsumIQ © 2026 · Sistema Inteligente de Análise Financeira
          </div>
        </div>

        {/* Painel Direito: Formulário com Alternância */}
        <div className={styles.formPanel}>
          <div className={styles.tabSwitch}>
            <button
              type="button"
              className={`${styles.tabButton} ${mode === 'login' ? styles.tabButtonActive : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${mode === 'register' ? styles.tabButtonActive : ''}`}
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
            >
              Criar Perfil Financeiro
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className={styles.formArea}
              >
                <div>
                  <h3 className={styles.formHeaderTitle}>Bem-vindo de volta!</h3>
                  <p className={styles.formHeaderSubtitle}>
                    Acesse seus números, limites e progresso de economias.
                  </p>
                </div>

                {errorMessage && (
                  <div className={styles.errorMessage}>
                    <FaCircleExclamation size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className={styles.inputField}>
                  <label htmlFor="login-email">Seu e-mail</label>
                  <div className={styles.inputWithIcon}>
                    <LuMail size={18} />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="login-password">Sua senha</label>
                  <div className={styles.inputWithIcon}>
                    <LuLock size={18} />
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitButton}>
                  Acessar Dashboard <LuArrowRight size={18} />
                </button>

                <div className={styles.dividerRow}>OU ACESSO RÁPIDO</div>

                <button
                  type="button"
                  onClick={loginAsDemo}
                  className={styles.demoButton}
                >
                  <LuSparkles size={16} /> Experimentar com Perfil Demonstrativo
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit}
                className={styles.formArea}
              >
                <div>
                  <h3 className={styles.formHeaderTitle}>Crie seu Perfil</h3>
                  <p className={styles.formHeaderSubtitle}>
                    Inicie o cadastro para calibrarmos suas possibilidades reais de gastos.
                  </p>
                </div>

                {errorMessage && (
                  <div className={styles.errorMessage}>
                    <FaCircleExclamation size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className={styles.inputField}>
                  <label htmlFor="reg-name">Como prefere ser chamado?</label>
                  <div className={styles.inputWithIcon}>
                    <LuUser size={18} />
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Ex: Mariana Silva"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="reg-email">Seu melhor e-mail</label>
                  <div className={styles.inputWithIcon}>
                    <LuMail size={18} />
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="mariana@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="reg-password">Crie uma senha de acesso</label>
                  <div className={styles.inputWithIcon}>
                    <LuLock size={18} />
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitButton}>
                  Continuar para Configuração Financeira <LuArrowRight size={18} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
