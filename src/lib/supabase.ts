import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validamos que las variables existan y no sean los placeholders del .env.example
  const isValidConfig = 
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-project-id');

  if (!isValidConfig) {
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
    return null;
  }
};

// Proxy para mantener la compatibilidad con el código existente que usa 'supabase' directamente
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    if (!client) {
      console.warn('Supabase no está configurado. La operación "' + String(prop) + '" no se ejecutará.');
      // Retornamos una función vacía o un objeto que no rompa las llamadas encadenadas comunes
      return () => ({
        from: () => ({
          select: () => ({ order: () => Promise.resolve({ data: null, error: null }) }),
          insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
        }),
        storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
      });
    }
    return (client as any)[prop];
  }
});
