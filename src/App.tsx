import './App.css'
import { NavBar } from './components/layout/NavBar/NavBar'
import { Dashboard } from './pages/Dashboard/Dashboard';

export function App() {
  return (
    <div className="layout">
      <NavBar />
      <div className="content">
        <Dashboard />
      </div>
    </div>
  )
}