import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuoteForm } from './components/QuoteForm';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Cotizacion } from './types';

type View = 'dashboard' | 'new-quote' | 'profile';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [editingQuote, setEditingQuote] = useState<Cotizacion | null>(null);
  const [duplicatingQuote, setDuplicatingQuote] = useState<Cotizacion | null>(null);

  useEffect(() => {
    // Verificar si ya está autenticado
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleEditQuote = (quote: Cotizacion) => {
    setEditingQuote(quote);
    setDuplicatingQuote(null);
    setView('new-quote');
  };

  const handleDuplicateQuote = (quote: Cotizacion) => {
    setDuplicatingQuote(quote);
    setEditingQuote(null);
    setView('new-quote');
  };

  const handleBackToDashboard = () => {
    setEditingQuote(null);
    setDuplicatingQuote(null);
    setView('dashboard');
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setView('dashboard');
  };

  // Mostrar pantalla de carga mientras verifica autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {view === 'dashboard' ? (
        <Dashboard 
          onNewQuote={() => {
            setEditingQuote(null);
            setDuplicatingQuote(null);
            setView('new-quote');
          }}
          onProfile={() => setView('profile')}
          onEditQuote={handleEditQuote}
          onDuplicateQuote={handleDuplicateQuote}
        />
      ) : view === 'new-quote' ? (
        <QuoteForm 
          onBack={handleBackToDashboard}
          editingQuote={editingQuote}
          duplicatingQuote={duplicatingQuote}
        />
      ) : (
        <Profile 
          onBack={() => setView('dashboard')} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
