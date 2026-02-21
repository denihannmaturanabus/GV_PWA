import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileText, Plus, ChevronRight, Phone, MapPin, Calendar, Clock, AlertTriangle, Settings, Edit, Trash2, Eye, PhoneCall, X, Copy, MoreVertical, Search, ArrowUpDown } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Cliente, Cotizacion } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onNewQuote: () => void;
  onProfile: () => void;
  onEditQuote: (quote: Cotizacion) => void;
  onDuplicateQuote: (quote: Cotizacion) => void;
}

export const Dashboard = ({ onNewQuote, onProfile, onEditQuote, onDuplicateQuote }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'clients'>('quotes');
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientQuotes, setClientQuotes] = useState<Cotizacion[]>([]);
  const [showClientQuotes, setShowClientQuotes] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [showQuoteMenu, setShowQuoteMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchData();
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showQuoteMenu) {
        setShowQuoteMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showQuoteMenu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const client = getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }
      
      const { data: quotesData } = await client
        .from('cotizaciones')
        .select('*, cliente:clientes(*)')
        .order('created_at', { ascending: false });
      
      const { data: clientsData } = await client
        .from('clientes')
        .select('*')
        .order('nombre');

      if (quotesData) setQuotes(quotesData);
      if (clientsData) setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  // Filtrar y ordenar cotizaciones
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes;
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = quotes.filter(quote => 
        quote.cliente?.nombre?.toLowerCase().includes(term) ||
        quote.nombre?.toLowerCase().includes(term) ||
        quote.numero_cotizacion?.toString().includes(term)
      );
    }
    
    // Ordenar por fecha
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [quotes, searchTerm, sortOrder]);

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = clients.filter(client =>
        client.nombre?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.telefono?.includes(term) ||
        client.rut?.toLowerCase().includes(term)
      );
    }
    
    // Ordenar alfabéticamente
    return [...filtered].sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [clients, searchTerm]);

  const handleViewClientQuotes = async (client: Cliente) => {
    setSelectedClient(client);
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });
      
      if (data) setClientQuotes(data);
      setShowClientQuotes(true);
    } catch (error) {
      console.error('Error fetching client quotes:', error);
    }
  };

  const handleEditClient = (client: Cliente) => {
    setEditingClient({ ...client });
    setShowEditClient(true);
  };

  const handleSaveEditClient = async () => {
    if (!editingClient) return;
    
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: editingClient.nombre,
          rut: editingClient.rut,
          telefono: editingClient.telefono,
          direccion: editingClient.direccion,
          email: editingClient.email
        })
        .eq('id', editingClient.id);
      
      if (!error) {
        setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
        setShowEditClient(false);
        setEditingClient(null);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente');
    }
  };

  const handleDeleteClient = async (client: Cliente) => {
    if (!confirm(`¿Estás seguro de eliminar a ${client.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', client.id);
      
      if (!error) {
        setClients(clients.filter(c => c.id !== client.id));
      } else {
        alert('Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const handleCallClient = (telefono: string) => {
    window.location.href = `tel:${telefono}`;
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      <header className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Panel de Control</h1>
            <p className="text-amber-50 text-sm">Bienvenido Gonzalo</p>
          </div>
          <button 
            onClick={onProfile}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 shadow-sm active:bg-white/30 transition-all hover:bg-white/25"
            title="Mi Perfil"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="bg-brand-accent/10 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold text-brand-primary">{quotes.length}</p>
          <p className="text-xs font-bold text-stone-400 uppercase">Cotizaciones</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-brand-primary">{clients.length}</p>
          <p className="text-xs font-bold text-stone-400 uppercase">Clientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('quotes')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'quotes' ? 'bg-white text-brand-primary shadow-sm' : 'text-stone-500'}`}
        >
          Cotizaciones
        </button>
        <button 
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'clients' ? 'bg-white text-brand-primary shadow-sm' : 'text-stone-500'}`}
        >
          Clientes
        </button>
      </div>

      {/* Búsqueda y Ordenamiento */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'quotes' ? 'Buscar cotización...' : 'Buscar cliente...'}
            className="w-full pl-9 pr-3 py-2 border-2 border-stone-300 rounded-xl focus:outline-none focus:border-brand-accent text-sm"
          />
        </div>
        {activeTab === 'quotes' && (
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="bg-white border-2 border-stone-300 p-2 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center gap-2"
            title={sortOrder === 'newest' ? 'Más reciente primero' : 'Más antiguo primero'}
          >
            <ArrowUpDown className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-semibold text-stone-600">
              {sortOrder === 'newest' ? 'Nuevas' : 'Antiguas'}
            </span>
          </button>
        )}
      </div>

      {/* List Content */}
      <div className="space-y-3">
        {!import.meta.env.VITE_SUPABASE_URL ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-amber-900">Configuración Requerida</h3>
            <p className="text-sm text-amber-800">
              Para ver tus datos, debes configurar las variables de Supabase en los <b>Secrets</b> de AI Studio.
            </p>
            <div className="text-[10px] text-amber-700 bg-white/50 p-2 rounded font-mono text-left">
              VITE_SUPABASE_URL<br/>
              VITE_SUPABASE_ANON_KEY
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-stone-400">Cargando datos...</div>
        ) : activeTab === 'quotes' ? (
          filteredAndSortedQuotes.length > 0 ? (
            filteredAndSortedQuotes.map((quote) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={quote.id}
                className="bg-white p-4 rounded-2xl border-2 border-stone-300 shadow-sm relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1" onClick={() => onEditQuote(quote)} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">N° {quote.numero_cotizacion}</span>
                      {quote.estado === 'borrador' && (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Borrador</span>
                      )}
                      <span className="text-[10px] font-bold uppercase text-stone-400">{format(new Date(quote.fecha), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                    {quote.nombre && (
                      <p className="text-sm text-stone-600">{quote.nombre}</p>
                    )}
                    <p className="font-bold text-brand-primary">{quote.cliente?.nombre}</p>
                    <p className="text-brand-accent font-black">{formatCurrency(quote.total)}</p>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuoteMenu(showQuoteMenu === quote.id ? null : quote.id);
                      }}
                      className="p-2 rounded-lg hover:bg-stone-100 active:bg-stone-200 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-stone-400" />
                    </button>
                    
                    <AnimatePresence>
                      {showQuoteMenu === quote.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-10 min-w-[160px]"
                        >
                          <button
                            onClick={() => {
                              onEditQuote(quote);
                              setShowQuoteMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              onDuplicateQuote(quote);
                              setShowQuoteMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300 text-stone-400">
              {searchTerm ? 'No se encontraron cotizaciones' : 'No hay cotizaciones aún'}
            </div>
          )
        ) : (
          filteredAndSortedClients.length > 0 ? (
            filteredAndSortedClients.map((client) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={client.id}
                className="bg-white p-4 rounded-2xl border-2 border-stone-300 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-bold text-brand-primary text-lg">{client.nombre}</p>
                    <div className="flex flex-col gap-1 text-xs text-stone-500">
                      {client.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {client.telefono}
                        </span>
                      )}
                      {client.rut && (
                        <span className="flex items-center gap-1">
                          RUT: {client.rut}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1 truncate">
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`grid ${client.telefono ? 'grid-cols-4' : 'grid-cols-3'} gap-2 pt-2 border-t border-stone-100`}>
                    <button
                      onClick={() => handleViewClientQuotes(client)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-50 text-blue-600 active:bg-blue-100 transition-colors"
                      title="Ver Cotizaciones"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Ver</span>
                    </button>
                    
                    {client.telefono && (
                      <button
                        onClick={() => handleCallClient(client.telefono!)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-50 text-green-600 active:bg-green-100 transition-colors"
                        title="Llamar"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Llamar</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditClient(client)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50 text-amber-600 active:bg-amber-100 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Editar</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Eliminar</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300 text-stone-400">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </div>
          )
        )}
      </div>

      {/* Modal: Ver Cotizaciones del Cliente */}
      <AnimatePresence>
        {showClientQuotes && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowClientQuotes(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-brand-primary">Cotizaciones</h3>
                  <p className="text-sm text-stone-500">{selectedClient.nombre}</p>
                </div>
                <button
                  onClick={() => setShowClientQuotes(false)}
                  className="p-2 rounded-lg bg-stone-100 active:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {clientQuotes.length > 0 ? (
                  clientQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-4 bg-stone-50 rounded-xl border border-stone-200 relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => {
                          onEditQuote(quote);
                          setShowClientQuotes(false);
                        }} style={{ cursor: 'pointer' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-stone-200">
                                N° {quote.numero_cotizacion}
                              </span>
                              {quote.estado === 'borrador' && (
                                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                  Borrador
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-stone-400">
                              {format(new Date(quote.fecha), 'dd/MM/yy')}
                            </span>
                          </div>
                          {quote.nombre && (
                            <p className="text-sm text-stone-600 mb-1">{quote.nombre}</p>
                          )}
                          <p className="text-lg font-black text-brand-accent">
                            {formatCurrency(quote.total)}
                          </p>
                        </div>
                        
                        <div className="relative ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQuoteMenu(showQuoteMenu === quote.id ? null : quote.id);
                            }}
                            className="p-2 rounded-lg hover:bg-white active:bg-stone-100 transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-stone-400" />
                          </button>
                          
                          <AnimatePresence>
                            {showQuoteMenu === quote.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-10 min-w-[160px]"
                              >
                                <button
                                  onClick={() => {
                                    onEditQuote(quote);
                                    setShowQuoteMenu(null);
                                    setShowClientQuotes(false);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => {
                                    onDuplicateQuote(quote);
                                    setShowQuoteMenu(null);
                                    setShowClientQuotes(false);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-sm"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicar
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400">
                    No hay cotizaciones para este cliente
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Cliente */}
      <AnimatePresence>
        {showEditClient && editingClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditClient(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-brand-primary">Editar Cliente</h3>
                <button
                  onClick={() => setShowEditClient(false)}
                  className="p-2 rounded-lg bg-stone-100 active:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1"
                    value={editingClient.nombre}
                    onChange={(e) => setEditingClient({ ...editingClient, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1">RUT</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1"
                    value={editingClient.rut || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, rut: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1">Teléfono</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1"
                    value={editingClient.telefono || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, telefono: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1">Dirección</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1"
                    value={editingClient.direccion || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, direccion: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleSaveEditClient}
                  className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold active:scale-95 transition-transform mt-4"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button 
        onClick={onNewQuote}
        className="fixed bottom-6 right-6 bg-brand-accent text-white w-14 h-14 rounded-full shadow-xl shadow-brand-accent/40 flex items-center justify-center active:scale-90 transition-transform z-50"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};
