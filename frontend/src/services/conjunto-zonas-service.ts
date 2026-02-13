/**
 * Conjunto Zonas Service
 * 
 * Service for managing collections of multiple zones for batch analysis.
 * Allows users to select multiple buildings/zones and save them as a group.
 */

import { supabase, TABLES, getCurrentUser } from '../config/supabase';
import { ConjuntoZonasData, ZonaEnConjuntoData, GeoJSONPolygon } from '../types';

export interface ConjuntoZonas {
  id?: string;
  nombre: string;
  descripcion?: string;
  area_total_m2?: number;
  cantidad_zonas?: number;
  tipos_zonas?: Record<string, number>;
  created_at?: string;
}

export interface ZonaEnConjunto {
  id?: string;
  conjunto_id?: string;
  tipo_zona: string;
  coordenadas: GeoJSONPolygon;
  area_m2: number;
  orden: number;
  metadata?: Record<string, any>;
}

/**
 * Save a collection of zones
 * Creates a conjunto record and all its associated zona records in a transaction
 */
export async function saveConjuntoZonas(
  nombre: string,
  descripcion: string | undefined,
  zonas: ZonaEnConjunto[]
): Promise<string> {
  console.log('💾 Guardando conjunto de zonas en Supabase...');

  try {
    // Validate input
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del conjunto es requerido');
    }

    if (!zonas || zonas.length === 0) {
      throw new Error('Debe seleccionar al menos una zona');
    }

    // Get current user
    let userId: string | undefined;
    try {
      const user = await getCurrentUser();
      userId = user?.id;
    } catch (err) {
      console.warn('⚠️ Usuario no autenticado, guardando sin user_id');
    }

    // Calculate total area and count by type
    const area_total_m2 = zonas.reduce((sum, zona) => sum + zona.area_m2, 0);
    const cantidad_zonas = zonas.length;
    
    // Count zones by type
    const tipos_zonas: Record<string, number> = {};
    zonas.forEach(zona => {
      tipos_zonas[zona.tipo_zona] = (tipos_zonas[zona.tipo_zona] || 0) + 1;
    });

    // Create conjunto record
    const conjuntoData = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim(),
      area_total_m2,
      cantidad_zonas,
      tipos_zonas,
      user_id: userId,
    };

    const { data: conjunto, error: conjuntoError } = await supabase
      .from(TABLES.CONJUNTOS_ZONAS)
      .insert([conjuntoData])
      .select('id')
      .single();

    if (conjuntoError) {
      console.error('Error creando conjunto de zonas:', conjuntoError);
      throw new Error(`Failed to create conjunto: ${conjuntoError.message}`);
    }

    if (!conjunto) {
      throw new Error('No data returned from conjunto creation');
    }

    const conjuntoId = conjunto.id;
    console.log('✅ Conjunto creado:', conjuntoId);

    // Create zona records
    const zonasData = zonas.map((zona, index) => ({
      conjunto_id: conjuntoId,
      tipo_zona: zona.tipo_zona,
      coordenadas: zona.coordenadas,
      area_m2: zona.area_m2,
      orden: zona.orden !== undefined ? zona.orden : index,
      metadata: zona.metadata || {},
    }));

    const { error: zonasError } = await supabase
      .from(TABLES.ZONAS_EN_CONJUNTO)
      .insert(zonasData);

    if (zonasError) {
      console.error('Error creando zonas en conjunto:', zonasError);
      // Try to rollback by deleting the conjunto
      try {
        await supabase.from(TABLES.CONJUNTOS_ZONAS).delete().eq('id', conjuntoId);
        console.log('✅ Rollback successful: conjunto deleted');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      throw new Error(`Failed to create zones: ${zonasError.message}`);
    }

    console.log(`✅ ${zonas.length} zonas guardadas en conjunto ${conjuntoId}`);
    return conjuntoId;
  } catch (error) {
    console.error('❌ Error guardando conjunto de zonas:', error);
    throw error;
  }
}

/**
 * Load all zone collections
 */
export async function loadConjuntosZonas(): Promise<ConjuntoZonasData[]> {
  console.log('📥 Cargando conjuntos de zonas desde Supabase...');
  
  try {
    const { data, error } = await supabase
      .from(TABLES.CONJUNTOS_ZONAS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conjuntos:', error);
      throw new Error(`Failed to load conjuntos: ${error.message}`);
    }

    console.log(`✅ Cargados ${data?.length || 0} conjuntos de zonas`);
    return data || [];
  } catch (error) {
    console.error('❌ Error cargando conjuntos de zonas:', error);
    throw error;
  }
}

/**
 * Get zones within a collection
 */
export async function getZonasEnConjunto(conjuntoId: string): Promise<ZonaEnConjuntoData[]> {
  console.log(`📥 Cargando zonas del conjunto ${conjuntoId}...`);
  
  try {
    const { data, error } = await supabase
      .from(TABLES.ZONAS_EN_CONJUNTO)
      .select('*')
      .eq('conjunto_id', conjuntoId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error loading zonas en conjunto:', error);
      throw new Error(`Failed to load zonas: ${error.message}`);
    }

    console.log(`✅ Cargadas ${data?.length || 0} zonas del conjunto`);
    return data || [];
  } catch (error) {
    console.error('❌ Error cargando zonas en conjunto:', error);
    throw error;
  }
}

/**
 * Delete a collection (cascades to zones automatically via ON DELETE CASCADE)
 */
export async function deleteConjuntoZonas(id: string): Promise<void> {
  console.log(`🗑️ Eliminando conjunto de zonas ${id}...`);
  
  try {
    const { error } = await supabase
      .from(TABLES.CONJUNTOS_ZONAS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conjunto:', error);
      throw new Error(`Failed to delete conjunto: ${error.message}`);
    }

    console.log('✅ Conjunto de zonas eliminado');
  } catch (error) {
    console.error('❌ Error eliminando conjunto de zonas:', error);
    throw error;
  }
}

/**
 * Count total number of collections
 */
export async function countConjuntosZonas(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(TABLES.CONJUNTOS_ZONAS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting conjuntos:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error counting conjuntos:', error);
    return 0;
  }
}
