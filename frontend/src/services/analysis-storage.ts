/**
 * Analysis Storage Service
 * 
 * Manages saving analysis results to Supabase database
 */

import { supabase, TABLES, getCurrentUser } from '../config/supabase';
import { AnalysisResponse, GeoJSONPolygon, SavedAnalysis } from '../types';

/**
 * Save complete analysis to database
 * Creates zona_verde and analisis records
 */
export async function saveAnalysis(
  analysisResult: AnalysisResponse,
  polygon: GeoJSONPolygon,
  nombre?: string,
  userId?: string
): Promise<SavedAnalysis> {
  console.log('💾 Guardando análisis en Supabase...');

  try {
    // Get current user if not provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const user = await getCurrentUser();
        effectiveUserId = user?.id;
      } catch (err) {
        console.warn('⚠️ Usuario no autenticado, guardando sin user_id');
      }
    }

    // Step 1: Create zona verde
    const zonaVerdeId = await createZonaVerde(
      nombre || `Zona ${new Date().toLocaleDateString()}`,
      polygon,
      analysisResult.area_m2,
      getViabilidad(analysisResult.green_score),
      effectiveUserId
    );

    // Step 2: Save analysis data
    const analisisId = await saveToAnalisisTable(zonaVerdeId, analysisResult);

    console.log('✅ Análisis guardado:', { zonaVerdeId, analisisId });

    return {
      zonaVerdeId,
      analisisId,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('❌ Error guardando análisis:', error);
    throw error;
  }
}

/**
 * Create zona verde record
 */
async function createZonaVerde(
  nombre: string,
  polygon: GeoJSONPolygon,
  area: number,
  viabilidad: string,
  userId?: string
): Promise<string> {
  const zonaData = {
    nombre,
    coordenadas: polygon,
    area_m2: area,
    viabilidad: viabilidad.toLowerCase() as 'alta' | 'media' | 'baja' | 'nula',
    estado: 'en_analisis' as const,
    user_id: userId,
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

  return data.id;
}

/**
 * Save to analisis table with ALL data fields
 */
async function saveToAnalisisTable(
  zonaVerdeId: string,
  analysisData: AnalysisResponse
): Promise<string> {
  // Adapt analysis data to ensure all fields exist
  const { adaptAnalysisData } = await import('./analysis-adapter');
  const adaptedData = adaptAnalysisData(analysisData as any);

  // Extract all data sections
  const beneficios = adaptedData.beneficios_ecosistemicos || {};
  const presupuesto = adaptedData.presupuesto || {};
  const roi = adaptedData.roi_ambiental || {};
  const subvencion = adaptedData.subvencion || {};
  const normativa = adaptedData.normativa || {};

  // Create comprehensive notes with all data in JSON format for easy retrieval
  const extendedData = {
    green_score: adaptedData.green_score,
    area_m2: adaptedData.area_m2,
    perimetro_m: adaptedData.perimetro_m,
    
    normativa: {
      factor_verde: normativa.factor_verde,
      cumple_pecv_madrid: normativa.cumple_pecv_madrid,
      cumple_miteco: normativa.cumple_miteco,
      apto_para_subvencion: normativa.apto_para_subvencion,
      requisitos: normativa.requisitos
    },
    
    beneficios_ecosistemicos: {
      co2_capturado_kg_anual: beneficios.co2_capturado_kg_anual,
      agua_retenida_litros_anual: beneficios.agua_retenida_litros_anual,
      reduccion_temperatura_c: beneficios.reduccion_temperatura_c,
      ahorro_energia_kwh_anual: beneficios.ahorro_energia_kwh_anual,
      ahorro_energia_eur_anual: beneficios.ahorro_energia_eur_anual
    },
    
    presupuesto: {
      coste_total_inicial_eur: presupuesto.coste_total_inicial_eur,
      desglose: {
        sustrato_eur: presupuesto.desglose?.sustrato_eur || 0,
        drenaje_eur: presupuesto.desglose?.drenaje_eur || 0,
        membrana_impermeable_eur: presupuesto.desglose?.membrana_impermeable_eur || 0,
        plantas_eur: presupuesto.desglose?.plantas_eur || 0,
        instalacion_eur: presupuesto.desglose?.instalacion_eur || 0
      },
      mantenimiento_anual_eur: presupuesto.mantenimiento_anual_eur,
      coste_por_m2_eur: presupuesto.coste_por_m2_eur,
      vida_util_anos: presupuesto.vida_util_anos
    },
    
    roi_ambiental: {
      roi_porcentaje: roi.roi_porcentaje,
      amortizacion_anos: roi.amortizacion_anos,
      ahorro_anual_eur: roi.ahorro_anual_eur,
      ahorro_25_anos_eur: roi.ahorro_25_anos_eur
    },
    
    subvencion: {
      elegible: subvencion.elegible,
      porcentaje: subvencion.porcentaje,
      programa: subvencion.programa,
      monto_estimado_eur: subvencion.monto_estimado_eur
    },
    
    tags: adaptedData.tags,
    recomendaciones: adaptedData.recomendaciones
  };

  // Estimate implementation time in days
  const tiempoImplementacion = Math.ceil(adaptedData.area_m2 / 100) * 30; // 30 days per 100m2

  const analisisData = {
    zona_verde_id: zonaVerdeId,
    tipo_suelo: adaptedData.tags.find(t => t.includes('suelo')) || 'Suelo urbano',
    exposicion_solar: calculateSolarExposure(adaptedData.tags),
    especies_recomendadas: adaptedData.especies_recomendadas,
    coste_estimado: presupuesto.coste_total_inicial_eur || (adaptedData.area_m2 * 150),
    impacto_ambiental_co2_anual: beneficios.co2_capturado_kg_anual || (adaptedData.area_m2 * 5),
    impacto_ambiental_oxigeno_anual: beneficios.agua_retenida_litros_anual || (adaptedData.area_m2 * 240),
    tiempo_implementacion_dias: tiempoImplementacion,
    notas: JSON.stringify(extendedData, null, 2), // Store all extended data as JSON
  };

  const { data, error } = await supabase
    .from(TABLES.ANALISIS)
    .insert([analisisData])
    .select('id')
    .single();

  if (error) {
    console.error('Error guardando análisis:', error);
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from analysis save');
  }

  console.log('✅ Análisis guardado con todos los datos:', data.id);
  return data.id;
}

/**
 * Generate and save report
 */
export async function generateReport(
  analisisId: string,
  formato: 'pdf' | 'html' | 'json' = 'pdf',
  contenido?: string,
  urlPdf?: string
): Promise<string> {
  console.log('📄 Generando informe...');

  try {
    const user = await getCurrentUser();
    
    const reportData = {
      analisis_id: analisisId,
      formato,
      contenido,
      url_pdf: urlPdf,
      generado_por: user?.id,
    };

    const { data, error } = await supabase
      .from(TABLES.INFORMES)
      .insert([reportData])
      .select('id')
      .single();

    if (error) {
      console.error('Error guardando informe:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from report save');
    }

    console.log('✅ Informe guardado:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error generando informe:', error);
    throw error;
  }
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(analisisId: string) {
  const { data, error } = await supabase
    .from(TABLES.ANALISIS)
    .select('*, zonas_verdes(*)')
    .eq('id', analisisId)
    .single();

  if (error) {
    throw new Error(`Failed to get analysis: ${error.message}`);
  }

  return data;
}

/**
 * Get reports for analysis
 */
export async function getReportsByAnalisisId(analisisId: string) {
  const { data, error } = await supabase
    .from(TABLES.INFORMES)
    .select('*')
    .eq('analisis_id', analisisId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get reports: ${error.message}`);
  }

  return data || [];
}

// Helper functions

function getViabilidad(greenScore: number): string {
  if (greenScore >= 70) return 'Alta';
  if (greenScore >= 50) return 'Media';
  if (greenScore >= 30) return 'Baja';
  return 'Nula';
}

function calculateSolarExposure(tags: string[]): number {
  // Extract solar exposure from tags
  const solarTag = tags.find(t => t.toLowerCase().includes('solar') || t.toLowerCase().includes('sol'));
  if (!solarTag) return 50; // Default 50%

  // Try to extract percentage from tag
  const match = solarTag.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }

  // Estimate based on keywords
  if (solarTag.toLowerCase().includes('alta') || solarTag.toLowerCase().includes('pleno')) {
    return 80;
  } else if (solarTag.toLowerCase().includes('media')) {
    return 50;
  } else if (solarTag.toLowerCase().includes('baja') || solarTag.toLowerCase().includes('sombra')) {
    return 20;
  }

  return 50; // Default
}
