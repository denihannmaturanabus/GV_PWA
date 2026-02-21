import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuoteForm } from './components/QuoteForm';
import { Profile } from './components/Profile';
import { Cotizacion } from './types';

type View = 'dashboard' | 'new-quote' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [editingQuote, setEditingQuote] = useState<Cotizacion | null>(null);
  const [duplicatingQuote, setDuplicatingQuote] = useState<Cotizacion | null>(null);

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
        <Profile onBack={() => setView('dashboard')} />
      )}
    </div>
  );
}
