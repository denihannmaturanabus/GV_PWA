-- Migración para actualizar la base de datos existente
-- Ejecuta este script en el SQL Editor de Supabase si ya tienes la base de datos creada

-- 1. Crear tabla de perfil de empresa
CREATE TABLE IF NOT EXISTS perfil_empresa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_empresa TEXT NOT NULL DEFAULT 'Constructor Integral',
  rut_empresa TEXT,
  telefono TEXT DEFAULT '+56 9 XXXX XXXX',
  direccion TEXT DEFAULT 'Villarrica - Ñancul, Chile',
  giro TEXT DEFAULT 'Construcción | Estructuras | Electricidad',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar perfil por defecto
INSERT INTO perfil_empresa (nombre_empresa, telefono, direccion, giro) 
VALUES ('Constructor Integral', '+56 9 XXXX XXXX', 'Villarrica - Ñancul, Chile', 'Construcción | Estructuras | Electricidad')
ON CONFLICT DO NOTHING;

-- Habilitar RLS para perfil_empresa
ALTER TABLE perfil_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo" ON perfil_empresa FOR ALL USING (true);

-- 2. Agregar columna 'nombre' a la tabla cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS nombre TEXT;

-- 3. Actualizar políticas RLS para permitir acceso público
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON clientes;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON cotizaciones;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON items_cotizacion;

-- Eliminar políticas "Permitir todo" si existen (para evitar conflictos)
DROP POLICY IF EXISTS "Permitir todo" ON clientes;
DROP POLICY IF EXISTS "Permitir todo" ON cotizaciones;
DROP POLICY IF EXISTS "Permitir todo" ON items_cotizacion;

-- Crear nuevas políticas
CREATE POLICY "Permitir todo" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON cotizaciones FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON items_cotizacion FOR ALL USING (true);

-- 4. Hacer que los próximos números de cotización empiecen desde 100
-- IMPORTANTE: Solo ejecuta esto si tu contador actual es menor a 100
-- Si ya tienes cotizaciones, ajusta el número según corresponda

-- Opción A: Si NO tienes cotizaciones o quieres reiniciar desde 100
ALTER SEQUENCE cotizaciones_numero_cotizacion_seq RESTART WITH 100;

-- Opción B: Si ya tienes cotizaciones y quieres que las nuevas empiecen desde 100
-- (Solo si tu número actual es menor a 100)
-- SELECT setval('cotizaciones_numero_cotizacion_seq', 100, false);

-- Verificar el estado actual del sequence
SELECT last_value FROM cotizaciones_numero_cotizacion_seq;
