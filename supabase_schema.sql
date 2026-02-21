-- Esquema para Supabase (PostgreSQL)

-- Tabla de Perfil de Empresa
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

-- Insertar perfil por defecto (solo una fila)
INSERT INTO perfil_empresa (nombre_empresa, telefono, direccion, giro) 
VALUES ('Constructor Integral', '+56 9 XXXX XXXX', 'Villarrica - Ñancul, Chile', 'Construcción | Estructuras | Electricidad')
ON CONFLICT DO NOTHING;

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  rut TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_cotizacion SERIAL,
  nombre TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE DEFAULT CURRENT_DATE,
  total DECIMAL(12,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente', -- borrador, pendiente, aceptada, rechazada
  validez_dias INTEGER DEFAULT 15,
  observaciones TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Hacer que numero_cotizacion empiece desde 100
ALTER SEQUENCE cotizaciones_numero_cotizacion_seq RESTART WITH 100;

-- Tabla de Items de Cotización
CREATE TABLE IF NOT EXISTS items_cotizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security) - Ajustar según necesidad
ALTER TABLE perfil_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_cotizacion ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Permitir todo para acceso público/anónimo)
CREATE POLICY "Permitir todo" ON perfil_empresa FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON cotizaciones FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON items_cotizacion FOR ALL USING (true);
