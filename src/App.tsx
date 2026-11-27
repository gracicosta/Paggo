import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { HomeLayout } from './components/layout/HomeLayout/HomeLayout';
import { AuthPage } from './pages/Auth/AuthPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { LegalPage } from './pages/Legal/LegalPage';
import { useLegalRoute } from './pages/Legal/legalRoute';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: '#38bdf8',
          fontSize: '1.1rem',
          fontWeight: 600,
        }}
      >
        Carregando Paggo...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.isConfigured) {
    return <OnboardingPage />;
  }

  return (
    <FinanceProvider>
      <HomeLayout />
    </FinanceProvider>
  );
}

export function App() {
  // Termos e Privacidade abrem por cima de qualquer tela (#termos / #privacidade).
  // A tela de origem fica montada e só escondida, então o "Voltar" não perde nada do que foi preenchido.
  const legal = useLegalRoute();

  return (
    <AuthProvider>
      <div style={{ display: legal.route ? 'none' : 'contents' }}>
        <AppContent />
      </div>
      {legal.route && <LegalPage
          key={`${legal.route.doc}-${legal.route.section ?? ''}`}
          route={legal.route} onSwitchDoc={legal.switchDoc} onClose={legal.close} />}
    </AuthProvider>
  );
}
