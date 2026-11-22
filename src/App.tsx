import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { NavBar } from './components/layout/NavBar/NavBar';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { AuthPage } from './pages/Auth/AuthPage';
import { OnboardingWizard } from './components/auth/OnboardingWizard/OnboardingWizard';

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
    return <OnboardingWizard />;
  }

  return (
    <FinanceProvider>
      <div className="layout">
        <NavBar />
        <div className="content">
          <Dashboard />
        </div>
      </div>
    </FinanceProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
