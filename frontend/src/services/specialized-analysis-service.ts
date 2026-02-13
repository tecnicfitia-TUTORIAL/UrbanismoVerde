/**
 * Specialized Analysis Service
 * 
 * Service for fetching and managing specialized analyses
 */

import { supabase, TABLES } from '../config/supabase';
import { AnalisisEspecializado, TipoEspecializacion } from '../types';

export interface SpecializedAnalysisWithZone extends AnalisisEspecializado {
  zona_verde?: {
    nombre: string;
    tipo: string;
  };
}

/**
 * Load all specialized analyses with zone names
 */
export async function loadSpecializedAnalyses(): Promise<SpecializedAnalysisWithZone[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANALISIS_ESPECIALIZADOS)
      .select(`
        *,
        analisis!inner(
          zona_verde_id,
          zonas_verdes!inner(
            nombre,
            tipo
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading specialized analyses:', error);
      throw error;
    }

    // Transform the data to flatten zona_verde info
    const transformed = (data || []).map((item: any) => {
      const { analisis, ...rest } = item;
      const zonaVerde = analisis?.zonas_verdes;
      return {
        ...rest,
        zona_verde: zonaVerde ? {
          nombre: zonaVerde.nombre,
          tipo: zonaVerde.tipo
        } : undefined,
      };
    });

    console.log(`✅ Loaded ${transformed.length} specialized analyses`);
    return transformed;
  } catch (error) {
    console.error('Error in loadSpecializedAnalyses:', error);
    return [];
  }
}

/**
 * Load specialized analyses filtered by type
 */
export async function loadSpecializedAnalysesByType(
  tipo: TipoEspecializacion
): Promise<SpecializedAnalysisWithZone[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANALISIS_ESPECIALIZADOS)
      .select(`
        *,
        analisis!inner(
          zona_verde_id,
          zonas_verdes!inner(
            nombre,
            tipo
          )
        )
      `)
      .eq('tipo_especializacion', tipo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error loading specialized analyses for type ${tipo}:`, error);
      throw error;
    }

    // Transform the data to flatten zona_verde info
    const transformed = (data || []).map((item: any) => {
      const { analisis, ...rest } = item;
      const zonaVerde = analisis?.zonas_verdes;
      return {
        ...rest,
        zona_verde: zonaVerde ? {
          nombre: zonaVerde.nombre,
          tipo: zonaVerde.tipo
        } : undefined,
      };
    });

    return transformed;
  } catch (error) {
    console.error(`Error in loadSpecializedAnalysesByType for ${tipo}:`, error);
    return [];
  }
}

/**
 * Count specialized analyses
 */
export async function countSpecializedAnalyses(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(TABLES.ANALISIS_ESPECIALIZADOS)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting specialized analyses:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countSpecializedAnalyses:', error);
    return 0;
  }
}

/**
 * Count specialized analyses by type
 */
export async function countSpecializedAnalysesByType(): Promise<Record<TipoEspecializacion, number>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANALISIS_ESPECIALIZADOS)
      .select('tipo_especializacion');

    if (error) {
      console.error('Error counting by type:', error);
      throw error;
    }

    // Count by type
    const counts: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      const tipo = item.tipo_especializacion;
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    return counts as Record<TipoEspecializacion, number>;
  } catch (error) {
    console.error('Error in countSpecializedAnalysesByType:', error);
    return {} as Record<TipoEspecializacion, number>;
  }
}
