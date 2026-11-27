import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { TransactionsProvider } from './context/TransactionsContext';
import { HomeLayout } from './components/layout/HomeLayout/HomeLayout';
import { AuthPage } from './pages/Auth/AuthPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { LegalPage } from './pages/Legal/LegalPage';
import { useLegalRoute } from './pages/Legal/legalRoute';
import { LoadingScreen } from './components/ui/LoadingScreen';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.isConfigured) {
    return <OnboardingPage />;
  }

  // Fonte única dos dados do painel: transações (entradas e saídas) + perfil (boletos, limites, metas).
  return (
    <TransactionsProvider>
      <FinanceProvider>
        <HomeLayout />
      </FinanceProvider>
    </TransactionsProvider>
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
