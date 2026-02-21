import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { PerfilEmpresa } from '../types';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const client = getSupabase();
      if (!client) {
        setLoadingPerfil(false);
        return;
      }
      const { data } = await client.from('perfil_empresa').select('*').single();
      if (data) setPerfil(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingPerfil(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'gonzalo123';
    setTimeout(() => {
      if (password === correctPassword) {
        localStorage.setItem('isAuthenticated', 'true');
        onLogin();
      } else {
        setError('ACCESO DENEGADO: CONTRASEÑA INVÁLIDA');
        setPassword('');
      }
      setLoading(false);
    }, 600);
  };

  const blobStyle = (delay: string) => ({
    animation: `blob-animation 8s infinite alternate-reverse`,
    animationDelay: delay,
  });

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <style>{`
        @keyframes blob-animation {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(70px, -90px) scale(1.3) rotate(10deg); }
          66% { transform: translate(-60px, 50px) scale(0.7) rotate(-10deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-industrial-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

      {/* --- FONDO DINÁMICO TÉCNICO --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{ 
            backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px' 
          }} 
        />
        
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[100px]" style={blobStyle('0s')} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px]" style={blobStyle('-3s')} />
      </div>

      <div className="max-w-md w-full space-y-10 relative z-10">
        {/* Logo Agrandado y Cabecera Industrial */}
        <div className="text-center space-y-8">
          <div className="relative inline-block group">
            {loadingPerfil ? (
              <div className="w-40 h-40 bg-stone-300 rounded-full animate-pulse" />
            ) : perfil?.logo_url ? (
              <div className="relative">
                <div className="absolute inset-0 bg-black/10 blur-3xl rounded-full scale-150" />
                <img 
                  src={perfil.logo_url} 
                  alt="Logo"
                  className="w-48 h-48 mx-auto object-contain relative transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)]"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto bg-stone-900 flex items-center justify-center rounded-none rotate-3 border-4 border-stone-800 shadow-2xl transition-transform group-hover:rotate-0">
                <Lock className="w-16 h-16 text-white" />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-5xl font-[900] text-stone-900 tracking-tighter uppercase leading-none italic">
              ¡Hola Gonzalo!
            </h1>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-[0.4em] pl-2">
              PWA
            </p>
          </div>
        </div>

        {/* Formulario Estilo Panel de Control */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-10 rounded-none shadow-[20px_20px_0px_rgba(28,25,23,0.1)] border-t-8 border-emerald-600 space-y-8 relative overflow-hidden">
            {/* Indicador visual de estado */}
            <div className="absolute top-2 right-4 flex gap-1">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <div className="w-2 h-2 rounded-full bg-stone-200" />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-stone-500 uppercase tracking-widest">
                Credencial de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-5 bg-stone-100 border-b-4 border-stone-200 focus:border-emerald-600 focus:bg-stone-50 transition-all outline-none font-mono text-xl tracking-widest"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900 text-white p-4 text-[10px] font-black uppercase tracking-tighter animate-industrial-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="group relative w-full bg-stone-900 text-white font-black py-6 px-4 rounded-none shadow-lg hover:bg-emerald-700 active:translate-y-1 transition-all disabled:opacity-50 overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-4 text-lg uppercase tracking-tighter">
                {loading ? 'Sincronizando...' : 'Iniciar Operaciones'}
                <ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" />
              </div>
              {/* Efecto de brillo al pasar el mouse */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};