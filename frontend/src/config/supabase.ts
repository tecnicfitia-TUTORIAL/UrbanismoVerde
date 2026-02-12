/**
 * Supabase Client Configuration
 * 
 * Configures the Supabase client with the provided credentials.
 * This client is used for all database operations and authentication.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ecourbe-auth-token',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'EcoUrbe AI',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database table names
export const TABLES = {
  ZONAS_VERDES: 'zonas_verdes',
  ANALISIS: 'analisis',
  ANALISIS_ESPECIALIZADOS: 'analisis_especializados',
  ESPECIES: 'especies',
  MUNICIPIOS: 'municipios',
  INFORMES: 'informes',
} as const;

// Helper function to check connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLES.ZONAS_VERDES).select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Type definitions for database tables
export interface ZonaVerde {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'azotea' | 'solar_vacio' | 'parque_degradado' | 'espacio_abandonado' | 'zona_industrial' | 'otro';
  coordenadas: any; // GeoJSON
  area_m2: number;
  nivel_viabilidad: 'alta' | 'media' | 'baja' | 'nula';
  estado: 'propuesta' | 'en_analisis' | 'aprobada' | 'en_ejecucion' | 'completada' | 'rechazada';
  municipio_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Analisis {
  id: string;
  zona_verde_id: string;
  tipo_suelo: string;
  exposicion_solar: number;
  coste_estimado: number;
  especies_recomendadas: string[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Especie {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  tipo: string;
  altura_max_m: number;
  requerimientos_agua: 'bajo' | 'medio' | 'alto';
  requerimientos_sol: 'sombra' | 'media_sombra' | 'pleno_sol';
  coste_unidad: number;
  created_at: string;
}

export interface Municipio {
  id: string;
  nombre: string;
  provincia: string;
  comunidad_autonoma: string;
  codigo_postal?: string;
  created_at: string;
}

export interface Informe {
  id: string;
  analisis_id: string;
  formato: 'pdf' | 'html' | 'json';
  contenido?: string;
  url_pdf?: string;
  generado_por?: string;
  created_at: string;
  updated_at: string;
}
