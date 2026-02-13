/**
 * Specialization Service
 * 
 * Manages specialized hierarchical analysis operations with Supabase
 */

import { supabase, TABLES } from '../config/supabase';
import { 
  AnalisisEspecializado, 
  TipoEspecializacion,
  GenerateSpecializationRequest 
} from '../types';

/**
 * Save a specialized analysis to the database
 */
export async function saveSpecializedAnalysis(
  data: Omit<AnalisisEspecializado, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  console.log('💾 Guardando análisis especializado...', data.tipo_especializacion);

  try {
    const { data: result, error } = await supabase
      .from('analisis_especializados')
      .insert([{
        analisis_id: data.analisis_id,
        tipo_especializacion: data.tipo_especializacion,
        area_base_m2: data.area_base_m2,
        green_score_base: data.green_score_base,
        especies_base: data.especies_base || null,
        presupuesto_base_eur: data.presupuesto_base_eur || null,
        caracteristicas_especificas: data.caracteristicas_especificas || {},
        analisis_adicional: data.analisis_adicional || {},
        presupuesto_adicional: data.presupuesto_adicional || {},
        presupuesto_total_eur: data.presupuesto_total_eur || null,
        incremento_vs_base_eur: data.incremento_vs_base_eur || null,
        incremento_vs_base_porcentaje: data.incremento_vs_base_porcentaje || null,
        viabilidad_tecnica: data.viabilidad_tecnica || null,
        viabilidad_economica: data.viabilidad_economica || null,
        viabilidad_normativa: data.viabilidad_normativa || null,
        viabilidad_final: data.viabilidad_final || null,
        notas: data.notas || null,
      }])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error guardando especialización:', error);
      throw new Error(`Failed to save specialization: ${error.message}`);
    }

    if (!result) {
      throw new Error('No data returned from specialization save');
    }

    console.log('✅ Especialización guardada:', result.id);
    return result.id;
  } catch (error) {
    console.error('❌ Error en saveSpecializedAnalysis:', error);
    throw error;
  }
}

/**
 * Get all specializations for a specific analysis
 */
export async function getSpecializationsByAnalisisId(
  analisisId: string
): Promise<AnalisisEspecializado[]> {
  console.log('🔍 Buscando especializaciones para análisis:', analisisId);

  try {
    const { data, error } = await supabase
      .from('analisis_especializados')
      .select('*')
      .eq('analisis_id', analisisId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo especializaciones:', error);
      throw new Error(`Failed to get specializations: ${error.message}`);
    }

    console.log(`✅ ${data?.length || 0} especializaciones encontradas`);
    
    return (data || []).map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error('❌ Error en getSpecializationsByAnalisisId:', error);
    throw error;
  }
}

/**
 * Get a specific specialization by ID
 */
export async function getSpecializationById(
  especializacionId: string
): Promise<AnalisisEspecializado | null> {
  console.log('🔍 Buscando especialización:', especializacionId);

  try {
    const { data, error } = await supabase
      .from('analisis_especializados')
      .select('*')
      .eq('id', especializacionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('❌ Error obteniendo especialización:', error);
      throw new Error(`Failed to get specialization: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('❌ Error en getSpecializationById:', error);
    throw error;
  }
}

/**
 * Delete a specialization
 */
export async function deleteSpecialization(
  especializacionId: string
): Promise<void> {
  console.log('🗑️ Eliminando especialización:', especializacionId);

  try {
    const { error } = await supabase
      .from('analisis_especializados')
      .delete()
      .eq('id', especializacionId);

    if (error) {
      console.error('❌ Error eliminando especialización:', error);
      throw new Error(`Failed to delete specialization: ${error.message}`);
    }

    console.log('✅ Especialización eliminada');
  } catch (error) {
    console.error('❌ Error en deleteSpecialization:', error);
    throw error;
  }
}

/**
 * Count specializations by type
 */
export async function countSpecializationsByType(): Promise<Record<TipoEspecializacion, number>> {
  console.log('📊 Contando especializaciones por tipo...');

  try {
    // Call the database function
    const { data, error } = await supabase
      .rpc('count_especializaciones_by_tipo');

    if (error) {
      console.error('❌ Error contando especializaciones:', error);
      throw new Error(`Failed to count specializations: ${error.message}`);
    }

    // Convert array result to object keyed by type
    const counts: Record<string, number> = {};
    if (data) {
      data.forEach((row: any) => {
        counts[row.tipo] = parseInt(row.total_count, 10);
      });
    }

    // Initialize all types with 0
    const result: Record<TipoEspecializacion, number> = {
      tejado: counts.tejado || 0,
      fachada: counts.fachada || 0,
      muro: counts.muro || 0,
      parque: counts.parque || 0,
      zona_abandonada: counts.zona_abandonada || 0,
      solar_vacio: counts.solar_vacio || 0,
      parque_degradado: counts.parque_degradado || 0,
      jardin_vertical: counts.jardin_vertical || 0,
      otro: counts.otro || 0,
    };

    console.log('✅ Conteo completado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en countSpecializationsByType:', error);
    // Return zeros on error
    return {
      tejado: 0,
      fachada: 0,
      muro: 0,
      parque: 0,
      zona_abandonada: 0,
      solar_vacio: 0,
      parque_degradado: 0,
      jardin_vertical: 0,
      otro: 0,
    };
  }
}

/**
 * Check if a specialization type already exists for an analysis
 */
export async function hasSpecializationType(
  analisisId: string,
  tipo: TipoEspecializacion
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('analisis_especializados')
      .select('id')
      .eq('analisis_id', analisisId)
      .eq('tipo_especializacion', tipo)
      .maybeSingle();

    if (error) {
      console.error('❌ Error verificando especialización:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error en hasSpecializationType:', error);
    return false;
  }
}
