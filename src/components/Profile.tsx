import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, Building2, Phone, MapPin, Briefcase, FileText, Image as ImageIcon, AlertCircle, LogOut } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { PerfilEmpresa } from '../types';
import { motion } from 'motion/react';

interface ProfileProps {
  onBack: () => void;
  onLogout?: () => void;
}

export const Profile = ({ onBack, onLogout }: ProfileProps) => {
  const [perfil, setPerfil] = useState<PerfilEmpresa>({
    id: '',
    nombre_empresa: 'Constructor Integral',
    rut_empresa: '',
    telefono: '+56 9 XXXX XXXX',
    direccion: 'Villarrica - Ñancul, Chile',
    giro: 'Construcción | Estructuras | Electricidad',
    logo_url: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const client = getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }

      const { data, error } = await client
        .from('perfil_empresa')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setPerfil(data);
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return perfil.logo_url || null;

    try {
      setIsUploading(true);
      const client = getSupabase();
      if (!client) {
        alert('Supabase no está configurado');
        return null;
      }

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await client.storage
        .from('perfil')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = client.storage
        .from('perfil')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo. Asegúrate de que el bucket "perfil" existe y es público.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const client = getSupabase();
      if (!client) {
        alert('Supabase no está configurado');
        setIsSaving(false);
        return;
      }

      // Subir logo si hay uno nuevo
      let logoUrl = perfil.logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      const perfilData = {
        nombre_empresa: perfil.nombre_empresa,
        rut_empresa: perfil.rut_empresa,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
        giro: perfil.giro,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      if (perfil.id) {
        // Actualizar existente
        const { error } = await client
          .from('perfil_empresa')
          .update(perfilData)
          .eq('id', perfil.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { data, error } = await client
          .from('perfil_empresa')
          .insert([perfilData])
          .select()
          .single();

        if (error) throw error;
        if (data) setPerfil(data);
      }

      alert('Perfil guardado exitosamente');
      onBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-32 space-y-6">
      <header className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/30 shadow-sm active:bg-white/30 transition-all hover:bg-white/25"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mi Perfil</h1>
        </div>
      </header>

      {!import.meta.env.VITE_SUPABASE_URL ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-amber-900">Configuración Requerida</h3>
          <p className="text-sm text-amber-800">
            Configura las variables de Supabase en los <b>Secrets</b> de AI Studio.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-stone-400">Cargando perfil...</div>
      ) : (
        <>
          {/* Logo Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border-2 border-stone-300 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Logo de la Empresa</h2>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {logoPreview ? (
                <div className="relative w-32 h-32 border-2 border-stone-200 rounded-xl overflow-hidden bg-white">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center bg-stone-50">
                  <Building2 className="w-12 h-12 text-stone-300" />
                </div>
              )}
              
              <label className="cursor-pointer bg-brand-accent text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
                <Upload className="w-5 h-5" />
                {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs font-semibold text-stone-600 text-center">
                Formatos: JPG, PNG, SVG. Máx 2MB
              </p>
            </div>
          </section>

          {/* Company Info */}
          <section className="bg-white p-4 rounded-2xl shadow-sm border-2 border-stone-300 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Datos de la Empresa</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-stone-600 uppercase ml-1">Nombre de la Empresa</label>
                <input 
                  type="text"
                  placeholder="Constructor Integral"
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1 text-stone-900"
                  value={perfil.nombre_empresa}
                  onChange={e => setPerfil({...perfil, nombre_empresa: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-black text-stone-600 uppercase ml-1">RUT de la Empresa</label>
                <input 
                  type="text"
                  placeholder="12.345.678-9"
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1 text-stone-900"
                  value={perfil.rut_empresa || ''}
                  onChange={e => setPerfil({...perfil, rut_empresa: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-black text-stone-600 uppercase ml-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </label>
                <input 
                  type="text"
                  placeholder="+56 9 XXXX XXXX"
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1 text-stone-900"
                  value={perfil.telefono}
                  onChange={e => setPerfil({...perfil, telefono: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-black text-stone-600 uppercase ml-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Dirección
                </label>
                <input 
                  type="text"
                  placeholder="Ciudad, Región, País"
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none mt-1 text-stone-900"
                  value={perfil.direccion || ''}
                  onChange={e => setPerfil({...perfil, direccion: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-black text-stone-600 uppercase ml-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Giro / Servicios
                </label>
                <textarea 
                  placeholder="Construcción | Estructuras | Electricidad"
                  rows={2}
                  className="w-full p-3 bg-stone-50 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none resize-none mt-1 text-stone-900"
                  value={perfil.giro}
                  onChange={e => setPerfil({...perfil, giro: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Logout Section */}
          {onLogout && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-300 space-y-4">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">Sesión</h2>
              </div>
              
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    onLogout();
                  }
                }}
                className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-bold py-3 px-4 rounded-xl border-2 border-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </section>
          )}

          {/* Save Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 pb-6 shadow-lg z-40">
            <button 
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving || isUploading ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Perfil</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
