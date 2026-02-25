import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Send, UserPlus, Search, FileText, Eye, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Cliente, ItemCotizacion, Cotizacion, PerfilEmpresa } from '../types';
import { getSupabase } from '../lib/supabase';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';
import { motion, AnimatePresence } from 'motion/react';
import { Toast, useToast } from './Toast';

interface QuoteFormProps {
  onBack: () => void;
  editingQuote?: Cotizacion | null;
  duplicatingQuote?: Cotizacion | null;
}

export const QuoteForm = ({ onBack, editingQuote, duplicatingQuote }: QuoteFormProps) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Cliente>>({ 
    nombre: '', 
    telefono: '', 
    rut: '', 
    direccion: '',
    email: '' 
  });
  
  const [items, setItems] = useState<ItemCotizacion[]>([
    { id: uuidv4(), descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }
  ]);
  
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [validez, setValidez] = useState(15);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [esTotalManual, setEsTotalManual] = useState(false);
  const [valorTotalManual, setValorTotalManual] = useState(0);
  const [modoCliente, setModoCliente] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  
  const { toasts, closeToast, success, error, info } = useToast();

  useEffect(() => {
    fetchClientes();
    fetchPerfil();
  }, []);

  // Cargar datos de cotización en edición
  useEffect(() => {
    if (editingQuote) {
      setIsEditing(true);
      setIsDuplicating(false);
      setEditingQuoteId(editingQuote.id);
      setSelectedClienteId(editingQuote.cliente_id);
      setNombreProyecto(editingQuote.nombre || '');
      setObservaciones(editingQuote.observaciones || '');
      setValidez(editingQuote.validez_dias);
      
      // Cargar items desde la base de datos
      const loadQuoteItems = async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          
          const { data: itemsData } = await client
            .from('items_cotizacion')
            .select('*')
            .eq('cotizacion_id', editingQuote.id);
          
          if (itemsData && itemsData.length > 0) {
            setItems(itemsData.map(item => ({
              id: item.id,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal
            })));
          }
        } catch (error) {
          console.error('Error loading items:', error);
        }
      };
      
      loadQuoteItems();
    }
  }, [editingQuote]);

  // Cargar datos de cotización para duplicar
  useEffect(() => {
    if (duplicatingQuote) {
      setIsDuplicating(true);
      setIsEditing(false);
      setEditingQuoteId(null);
      setSelectedClienteId(''); // NO cargar el cliente, dejar vacío para seleccionar uno nuevo
      setNombreProyecto(duplicatingQuote.nombre || '');
      setObservaciones(duplicatingQuote.observaciones || '');
      setValidez(duplicatingQuote.validez_dias);
      
      // Cargar items desde la base de datos
      const loadQuoteItems = async () => {
        try {
          const client = getSupabase();
          if (!client) return;
          
          const { data: itemsData } = await client
            .from('items_cotizacion')
            .select('*')
            .eq('cotizacion_id', duplicatingQuote.id);
          
          if (itemsData && itemsData.length > 0) {
            setItems(itemsData.map(item => ({
              id: uuidv4(), // Nuevo ID para cada item duplicado
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal
            })));
          }
        } catch (error) {
          console.error('Error loading items:', error);
        }
      };
      
      loadQuoteItems();
    }
  }, [duplicatingQuote]);

  const fetchClientes = async () => {
    try {
      const client = getSupabase();
      if (!client) return;
      const { data, error } = await client.from('clientes').select('*').order('nombre');
      if (data) setClientes(data);
    } catch (e) {
      console.error("Supabase not configured");
    }
  };

  const fetchPerfil = async () => {
    try {
      const client = getSupabase();
      if (!client) return;
      const { data, error } = await client
        .from('perfil_empresa')
        .select('*')
        .limit(1)
        .single();
      if (data) setPerfil(data);
    } catch (e) {
      console.error("Error fetching perfil:", e);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof ItemCotizacion, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'cantidad' || field === 'precio_unitario') {
          updatedItem.subtotal = updatedItem.cantidad * updatedItem.precio_unitario;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const totalCalculado = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = esTotalManual ? valorTotalManual : totalCalculado;

  const getCurrentQuoteData = (): Cotizacion => {
    const cliente = clientes.find(c => c.id === selectedClienteId);
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return {
      id: editingQuoteId || uuidv4(),
      cliente_id: selectedClienteId,
      nombre: nombreProyecto,
      fecha: localDate.toISOString().split('T')[0],
      total,
      estado: 'pendiente',
      validez_dias: validez,
      observaciones,
      items,
      cliente
    };
  };

  const handleCreateClient = async () => {
    if (!newClient.nombre) {
      error('El nombre del cliente es obligatorio.');
      return;
    }
    
    try {
      const client = getSupabase();
      if (!client) {
        error('Configuración de Supabase no encontrada. Revisa los Secrets.');
        return;
      }

      const { data, error: dbError } = await client.from('clientes').insert([newClient]).select();
      
      if (dbError) {
        console.error('Error de Supabase:', dbError);
        error('Error al guardar cliente: ' + dbError.message);
        return;
      }

      if (data && data.length > 0) {
        setClientes([...clientes, data[0]]);
        setSelectedClienteId(data[0].id);
        setShowNewClientForm(false);
        setNewClient({ 
          nombre: '', 
          telefono: '', 
          rut: '', 
          direccion: '',
          email: '' 
        });
        success('Cliente guardado exitosamente');
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      error('Error técnico al intentar guardar el cliente.');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedClienteId) {
      error('Por favor selecciona un cliente para guardar el borrador');
      return;
    }

    setIsSavingDraft(true);
    try {
      const client = getSupabase();
      if (!client) {
        error('Error: Supabase no está configurado.');
        setIsSavingDraft(false);
        return;
      }

      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const fechaLocal = localDate.toISOString().split('T')[0];

      let cotizacionId = editingQuoteId;

      if (isEditing && editingQuoteId) {
        // Actualizar cotización existente
        const { error: quoteError } = await client
          .from('cotizaciones')
          .update({
            cliente_id: selectedClienteId,
            nombre: nombreProyecto,
            total,
            validez_dias: validez,
            observaciones,
            estado: 'borrador',
            fecha: fechaLocal
          })
          .eq('id', editingQuoteId);

        if (quoteError) throw quoteError;

        // Eliminar items antiguos
        await client.from('items_cotizacion').delete().eq('cotizacion_id', editingQuoteId);
      } else {
        // Guardar cotización nueva como borrador
        const { data: quoteResult, error: quoteError } = await client
          .from('cotizaciones')
          .insert([{
            cliente_id: selectedClienteId,
            nombre: nombreProyecto,
            total,
            validez_dias: validez,
            observaciones,
            estado: 'borrador',
            fecha: fechaLocal
          }])
          .select();

        if (quoteError) throw quoteError;
        cotizacionId = quoteResult[0].id;
      }

      // Guardar Items
      const itemsToInsert = items.map(item => ({
        cotizacion_id: cotizacionId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));

      await client.from('items_cotizacion').insert(itemsToInsert);

      success('Borrador guardado exitosamente');
      setTimeout(() => onBack(), 1500);

    } catch (err) {
      console.error('Error saving draft:', err);
      error('Hubo un error al guardar el borrador.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveAndShare = async () => {
    if (!selectedClienteId) {
      error('Por favor selecciona un cliente');
      return;
    }

    setIsSaving(true);
    try {
      const client = getSupabase();
      if (!client) {
        error('Error: Supabase no está configurado.');
        setIsSaving(false);
        return;
      }

      const quoteData = getCurrentQuoteData();
      const cliente = quoteData.cliente;

      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const fechaLocal = localDate.toISOString().split('T')[0];

      let cotizacionId = editingQuoteId;
      let numeroQuote;

      if (isEditing && editingQuoteId) {
        // Actualizar cotización existente
        const { data: quoteResult, error: quoteError } = await client
          .from('cotizaciones')
          .update({
            cliente_id: quoteData.cliente_id,
            nombre: quoteData.nombre,
            total: quoteData.total,
            validez_dias: quoteData.validez_dias,
            observaciones: quoteData.observaciones,
            estado: 'pendiente',
            fecha: fechaLocal
          })
          .eq('id', editingQuoteId)
          .select();

        if (quoteError) throw quoteError;
        numeroQuote = quoteResult[0].numero_cotizacion;

        // Eliminar items antiguos
        await client.from('items_cotizacion').delete().eq('cotizacion_id', editingQuoteId);
      } else {
        // 1. Guardar nueva cotización en Supabase
        const { data: quoteResult, error: quoteError } = await client
          .from('cotizaciones')
          .insert([{
            cliente_id: quoteData.cliente_id,
            nombre: quoteData.nombre,
            total: quoteData.total,
            validez_dias: quoteData.validez_dias,
            observaciones: quoteData.observaciones,
            estado: 'pendiente',
            fecha: fechaLocal
          }])
          .select();

        if (quoteError) throw quoteError;

        cotizacionId = quoteResult[0].id;
        numeroQuote = quoteResult[0].numero_cotizacion;
      }

      // 2. Guardar Items
      const itemsToInsert = items.map(item => ({
        cotizacion_id: cotizacionId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));

      await client.from('items_cotizacion').insert(itemsToInsert);

      // 3. Generar PDF Blob
      const blob = await pdf(<QuotePDF quote={{ ...quoteData, numero_cotizacion: numeroQuote }} perfil={perfil || undefined} mostrarPrecios={!modoCliente} />).toBlob();
      
      // 4. Subir a Storage
      const fileName = `cotizacion_${numeroQuote}.pdf`;
      const { data: uploadData, error: uploadError } = await client.storage
        .from('cotizaciones')
        .upload(fileName, blob, {
          upsert: true
        });

      let publicUrl = '';
      if (!uploadError) {
        const { data: urlData } = client.storage.from('cotizaciones').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      // 5. WhatsApp - Usar window.open para no cerrar la PWA
      const message = `Hola ${cliente?.nombre}, adjunto la cotización por los trabajos conversados. %0A%0ATotal: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total)} %0A%0APuedes ver el detalle aquí: ${publicUrl || 'Generado localmente'}`;
      const whatsappUrl = `https://wa.me/${cliente?.telefono?.replace(/\+/g, '')}?text=${message}`;
      
      // Abrir WhatsApp en nueva ventana para evitar cerrar la PWA en Android
      window.open(whatsappUrl, '_blank');
      success('Cotización guardada y enviada a WhatsApp');

    } catch (err) {
      console.error('Error saving quote:', err);
      error('Hubo un error al guardar. Asegúrate de configurar Supabase correctamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!selectedClienteId) {
      error('Por favor selecciona un cliente');
      return;
    }

    try {
      const client = getSupabase();
      if (!client) {
        error('Error: Supabase no está configurado.');
        return;
      }

      const quoteData = getCurrentQuoteData();
      const cliente = quoteData.cliente;

      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const fechaLocal = localDate.toISOString().split('T')[0];

      let cotizacionId = editingQuoteId;
      let numeroQuote;

      if (isEditing && editingQuoteId) {
        // Actualizar cotización existente
        const { data: quoteResult, error: quoteError } = await client
          .from('cotizaciones')
          .update({
            cliente_id: quoteData.cliente_id,
            nombre: quoteData.nombre,
            total: quoteData.total,
            validez_dias: quoteData.validez_dias,
            observaciones: quoteData.observaciones,
            estado: 'pendiente',
            fecha: fechaLocal
          })
          .eq('id', editingQuoteId)
          .select();

        if (quoteError) throw quoteError;
        numeroQuote = quoteResult[0].numero_cotizacion;

        await client.from('items_cotizacion').delete().eq('cotizacion_id', editingQuoteId);
      } else {
        // Nueva cotización
        const { data: quoteResult, error: quoteError } = await client
          .from('cotizaciones')
          .insert([{
            cliente_id: quoteData.cliente_id,
            nombre: quoteData.nombre,
            total: quoteData.total,
            validez_dias: quoteData.validez_dias,
            observaciones: quoteData.observaciones,
            estado: 'pendiente',
            fecha: fechaLocal
          }])
          .select();

        if (quoteError) throw quoteError;
        cotizacionId = quoteResult[0].id;
        numeroQuote = quoteResult[0].numero_cotizacion;
      }

      // Guardar Items
      const itemsToInsert = items.map(item => ({
        cotizacion_id: cotizacionId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));

      await client.from('items_cotizacion').insert(itemsToInsert);

      // Generar PDF Blob
      const blob = await pdf(<QuotePDF quote={{ ...quoteData, numero_cotizacion: numeroQuote }} perfil={perfil || undefined} mostrarPrecios={!modoCliente} />).toBlob();
      
      // Subir a Storage
      const fileName = `cotizacion_${numeroQuote}.pdf`;
      const { data: uploadData, error: uploadError } = await client.storage
        .from('cotizaciones')
        .upload(fileName, blob, {
          upsert: true
        });

      let publicUrl = '';
      if (!uploadError) {
        const { data: urlData } = client.storage.from('cotizaciones').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      // Intentar compartir usando Web Share API
      if (navigator.share) {
        try {
          // Crear archivo PDF para compartir
          const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
          const shareText = `Cotización #${numeroQuote}\n\nCliente: ${cliente?.nombre}\nTotal: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total)}`;
          
          // Verificar si puede compartir archivos
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            // Compartir con archivo PDF
            await navigator.share({
              title: `Cotización #${numeroQuote}`,
              text: shareText,
              files: [pdfFile]
            });
          } else {
            // Compartir solo texto y URL
            await navigator.share({
              title: `Cotización #${numeroQuote}`,
              text: shareText + `\n\nVer PDF: ${publicUrl}`,
              url: publicUrl
            });
          }
        } catch (shareError: any) {
          // Si falla compartir, ofrecer descargar
          if (shareError.name !== 'AbortError') {
            // Descargar el PDF
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            success('PDF descargado. Puedes compartirlo desde tu galería/descargas.');
          }
        }
      } else {
        // Fallback: Descargar el archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        success('PDF descargado. Puedes compartirlo desde tu galería/descargas.');
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Usuario canceló el compartir, no hacer nada
        return;
      }
      console.error('Error sharing quote:', err);
      error('Hubo un error al compartir: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handlePreview = async () => {
    try {
      // Limpiar Blob URL anterior si existe
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      // Generar PDF Blob
      const quoteData = getCurrentQuoteData();
      const blob = await pdf(<QuotePDF quote={quoteData} perfil={perfil || undefined} mostrarPrecios={!modoCliente} />).toBlob();
      
      // Crear Blob URL
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generating preview:', err);
      error('Error al generar la vista previa del PDF');
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // Limpiar Blob URL después de un pequeño delay para que la animación termine
    setTimeout(() => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }, 300);
  };

  // Cleanup del Blob URL al desmontar el componente
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div className="max-w-md mx-auto p-4 pb-64 space-y-6 min-h-screen">
      <Toast toasts={toasts} onClose={closeToast} />
      
      <header className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/30 shadow-sm active:bg-white/30 transition-all hover:bg-white/25"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isEditing ? 'Editar Cotización' : isDuplicating ? 'Duplicar Cotización' : 'Nueva Cotización'}
          </h1>
        </div>
      </header>

      {/* Sección Cliente */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Cliente {isDuplicating && <span className="text-brand-accent ml-2">(Selecciona un nuevo cliente)</span>}
          </h2>
          <button 
            onClick={() => setShowNewClientForm(!showNewClientForm)}
            className="text-brand-accent flex items-center gap-1 text-sm font-medium"
          >
            {showNewClientForm ? 'Cancelar' : <><UserPlus className="w-4 h-4" /> Nuevo</>}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showNewClientForm ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-stone-900"
                value={newClient.nombre}
                onChange={e => setNewClient({...newClient, nombre: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Teléfono (Opcional)" 
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-stone-900"
                value={newClient.telefono || ''}
                onChange={e => setNewClient({...newClient, telefono: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Dirección (Opcional)" 
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-stone-900"
                value={newClient.direccion || ''}
                onChange={e => setNewClient({...newClient, direccion: e.target.value})}
              />
              <button 
                onClick={handleCreateClient}
                className="w-full bg-brand-primary text-white p-3 rounded-xl font-bold"
              >
                Guardar Cliente
              </button>
            </motion.div>
          ) : (
            <div className="relative">
              <select 
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl appearance-none focus:ring-2 focus:ring-brand-accent outline-none text-stone-900 font-medium"
                value={selectedClienteId}
                onChange={e => setSelectedClienteId(e.target.value)}
              >
                <option value="">Seleccionar Cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <Search className="absolute right-3 top-3.5 w-5 h-5 text-stone-400 pointer-events-none" />
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Nombre del Proyecto */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Descripción del Proyecto</h2>
        <input 
          type="text" 
          placeholder="Ej: Ampliación de segundo piso, Remodelación baño, etc."
          className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-stone-900"
          value={nombreProyecto}
          onChange={e => setNombreProyecto(e.target.value)}
        />
      </section>

      {/* Sección Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Trabajos / Materiales</h2>
          <span className="text-xs font-semibold text-stone-600">{items.length} ítems</span>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-3 relative"
            >
              <button 
                onClick={() => handleRemoveItem(item.id)}
                className="absolute -top-2 -right-2 bg-red-50 text-red-500 p-1.5 rounded-full border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <input 
                type="text" 
                placeholder="Ítem" 
                className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none focus:border-brand-accent text-stone-900"
                value={item.descripcion}
                onChange={e => handleItemChange(item.id, 'descripcion', e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-stone-600 ml-1">Cantidad</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none text-stone-900 font-semibold"
                    value={item.cantidad}
                    onChange={e => handleItemChange(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-stone-600 ml-1">Precio Unit.</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none font-mono text-stone-900 font-semibold"
                    value={item.precio_unitario}
                    onChange={e => handleItemChange(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="text-right text-sm font-bold text-stone-800">
                Subtotal: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.subtotal)}
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleAddItem}
          className="w-full py-4 border-2 border-dashed border-stone-400 rounded-2xl text-stone-600 flex items-center justify-center gap-2 font-bold active:bg-stone-100 transition-colors"
        >
          <Plus className="w-5 h-5" /> Añadir Ítem
        </button>
      </section>

      {/* Observaciones */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Observaciones</h2>
        <textarea 
          placeholder="Condiciones de pago, plazos, etc."
          rows={3}
          className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none resize-none text-stone-900"
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-stone-700 whitespace-nowrap">Validez (días):</label>
          <input 
            type="number" 
            className="w-20 p-2 bg-stone-50 border-2 border-stone-300 rounded-lg outline-none text-stone-900 font-semibold"
            value={validez}
            onChange={e => setValidez(parseInt(e.target.value) || 0)}
          />
        </div>
      </section>

      {/* Control de Total Manual */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={esTotalManual}
              onChange={e => {
                setEsTotalManual(e.target.checked);
                if (e.target.checked && valorTotalManual === 0) {
                  setValorTotalManual(totalCalculado);
                }
              }}
              className="w-5 h-5 rounded border-2 border-stone-300 text-brand-accent focus:ring-2 focus:ring-brand-accent cursor-pointer"
            />
            Definir precio total manualmente
          </label>
        </div>
        
        <AnimatePresence>
          {esTotalManual && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-xs uppercase font-black text-stone-600 ml-1">Precio Total</label>
              <input 
                type="number" 
                className="w-full p-3 bg-amber-50 border-2 border-amber-400 rounded-xl outline-none text-stone-900 font-bold text-lg"
                value={valorTotalManual}
                onChange={e => setValorTotalManual(parseFloat(e.target.value) || 0)}
                placeholder="Ingrese el precio total"
              />
              <p className="text-xs text-stone-500 ml-1">
                Total calculado: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalCalculado)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Modo Cliente (Ocultar precios en PDF) */}
      <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">Ocultar precios unitarios en PDF</h3>
            <p className="text-xs text-stone-500">Solo mostrará descripciones y el total final</p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={modoCliente}
              onChange={e => setModoCliente(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-stone-300 rounded-full peer peer-checked:bg-brand-accent transition-colors"></div>
            <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
          </div>
        </label>
      </section>

      {/* Footer Fijo con Total y Botones */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-300 p-4 pb-6 safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase font-black text-stone-600">Total Cotización</p>
            <p className="text-xl font-black text-brand-primary">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total)}</p>
          </div>
          <button 
            onClick={handlePreview}
            className="bg-stone-100 text-stone-600 p-3 rounded-xl font-bold flex items-center gap-2 active:bg-stone-200"
          >
            <Eye className="w-5 h-5" /> Previsualizar
          </button>
        </div>
        <div className="space-y-3">
          <button 
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="w-full bg-stone-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSavingDraft ? 'Guardando...' : (
              isEditing ? 
                <><Save className="w-5 h-5" /> Actualizar Borrador</> : 
                <><Save className="w-5 h-5" /> Guardar Borrador</>
            )}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleShare}
              className="bg-blue-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
            >
              <FileText className="w-5 h-5" /> Compartir
            </button>
            <button 
              onClick={handleSaveAndShare}
              disabled={isSaving}
              className="bg-brand-accent text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving ? 'Enviando...' : (
                <><Send className="w-5 h-5" /> WhatsApp</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Previsualización */}
      <AnimatePresence>
        {showPreview && pdfBlobUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="p-4 flex items-center justify-between text-white bg-black/50 backdrop-blur-sm">
              <h3 className="font-bold text-lg">Vista Previa PDF</h3>
              <button 
                onClick={handleClosePreview}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-none"
                title="Vista previa de cotización"
              />
            </div>
            <div className="p-3 text-center text-white/60 text-xs bg-black/50">
              Usa los controles del visor para navegar el documento
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
