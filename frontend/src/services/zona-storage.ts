/**
 * Zona Storage Service
 * 
 * Unified service for all zona verde storage operations.
 * Provides a single source of truth for creating, reading, updating zones.
 */

import { supabase, TABLES, ZonaVerde, getCurrentUser } from '../config/supabase';
import { GeoJSONPolygon } from '../types';

export interface CreateZonaVerdeInput {
  nombre: string;
  tipo: 'azotea' | 'solar_vacio' | 'parque_degradado' | 'espacio_abandonado' | 'zona_industrial' | 'otro';
  coordenadas: GeoJSONPolygon;
  area_m2: number;
  nivel_viabilidad?: 'alta' | 'media' | 'baja' | 'nula';
  estado?: 'propuesta' | 'en_analisis' | 'aprobada' | 'en_ejecucion' | 'completada' | 'rechazada';
  notas?: string;
}

/**
 * Save zona verde to database (unified function)
 * This is the ONLY function that should be used to create new zonas verdes
 */
export async function saveZonaVerde(input: CreateZonaVerdeInput): Promise<string> {
  console.log('💾 Guardando zona verde en Supabase...');

  try {
    // Get current user
    let userId: string | undefined;
    try {
      const user = await getCurrentUser();
      userId = user?.id;
    } catch (err) {
      console.warn('⚠️ Usuario no autenticado, guardando sin user_id');
    }

    const zonaData = {
      nombre: input.nombre,
      tipo: input.tipo,
      coordenadas: input.coordenadas,
      area_m2: input.area_m2,
      nivel_viabilidad: input.nivel_viabilidad || 'media',
      estado: input.estado || 'propuesta',
      user_id: userId,
      notas: input.notas,
    };

    const { data, error } = await supabase
      .from(TABLES.ZONAS_VERDES)
      .insert([zonaData])
      .select('id')
      .single();

    if (error) {
      console.error('Error creando zona verde:', error);
      throw new Error(`Failed to create zona verde: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from zona verde creation');
    }

    console.log('✅ Zona verde guardada:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error guardando zona verde:', error);
    throw error;
  }
}

/**
 * Load all zonas verdes from database
 */
export async function loadZonasVerdes(): Promise<ZonaVerde[]> {
  console.log('📥 Cargando zonas verdes desde Supabase...');
  
  try {
    const { data, error } = await supabase
      .from(TABLES.ZONAS_VERDES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading zonas verdes:', error);
      throw new Error(`Failed to load zonas verdes: ${error.message}`);
    }

    console.log(`✅ Cargadas ${data?.length || 0} zonas verdes`);
    return data || [];
  } catch (error) {
    console.error('❌ Error cargando zonas verdes:', error);
    throw error;
  }
}

/**
 * Get a single zona verde by ID
 */
export async function getZonaVerdeById(id: string): Promise<ZonaVerde | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ZONAS_VERDES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading zona verde:', error);
      throw new Error(`Failed to load zona verde: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Error cargando zona verde:', error);
    throw error;
  }
}

/**
 * Update an existing zona verde
 */
export async function updateZonaVerde(
  id: string, 
  updates: Partial<CreateZonaVerdeInput>
): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.ZONAS_VERDES)
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating zona verde:', error);
      throw new Error(`Failed to update zona verde: ${error.message}`);
    }

    console.log('✅ Zona verde actualizada:', id);
  } catch (error) {
    console.error('❌ Error actualizando zona verde:', error);
    throw error;
  }
}

/**
 * Delete a zona verde
 */
export async function deleteZonaVerde(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.ZONAS_VERDES)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting zona verde:', error);
      throw new Error(`Failed to delete zona verde: ${error.message}`);
    }

    console.log('✅ Zona verde eliminada:', id);
  } catch (error) {
    console.error('❌ Error eliminando zona verde:', error);
    throw error;
  }
}
