export interface Cliente {
  id: string;
  nombre: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  created_at?: string;
}

export interface ItemCotizacion {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Cotizacion {
  id: string;
  numero_cotizacion?: number;
  nombre?: string;
  cliente_id: string;
  fecha: string;
  total: number;
  estado: 'borrador' | 'pendiente' | 'aceptada' | 'rechazada';
  validez_dias: number;
  observaciones?: string;
  pdf_url?: string;
  items: ItemCotizacion[];
  cliente?: Cliente;
}

export interface PerfilEmpresa {
  id: string;
  nombre_empresa: string;
  rut_empresa?: string;
  telefono: string;
  direccion?: string;
  giro: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}
