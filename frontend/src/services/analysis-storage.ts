/**
 * Analysis Storage Service
 * 
 * Manages saving analysis results to Supabase database
 */

import { supabase, TABLES, getCurrentUser } from '../config/supabase';
import { AnalysisResponse, GeoJSONPolygon, SavedAnalysis } from '../types';
import { adaptAnalysisData } from './analysis-adapter';

// Constants for cost and impact calculations
const DEFAULT_COST_PER_M2 = 150; // €/m² - Base installation cost
const DEFAULT_CO2_CAPTURE_PER_M2 = 5; // kg/m²/year - CO₂ absorption rate
const DEFAULT_WATER_RETENTION_PER_M2 = 240; // L/m²/year - Water retention capacity
const DEFAULT_ENERGY_SAVINGS_KWH_PER_M2 = 40; // kWh/m²/year - Energy savings from cooling
const DEFAULT_ENERGY_SAVINGS_EUR_PER_M2 = 10; // €/m²/year - Annual energy cost savings
const DEFAULT_MAINTENANCE_PER_M2 = 8; // €/m²/year - Annual maintenance cost
const DEFAULT_SAVINGS_25_YEARS_PER_M2 = 250; // €/m²/25 years - Total savings over lifespan
const DEFAULT_ROI_PERCENTAGE = 6.67; // % - Default return on investment
const DEFAULT_AMORTIZATION_YEARS = 15.0; // years - Default payback period
const DEFAULT_SUBSIDY_PERCENTAGE = 50; // % - Default subsidy eligibility
const DEFAULT_VIDA_UTIL_ANOS = 25; // years - Expected project lifespan
const DEFAULT_GREEN_SCORE = 75; // Default green score when not provided
const IMPLEMENTATION_DAYS_PER_100M2 = 30; // Days needed per 100m² installation

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
    nivel_viabilidad: viabilidad.toLowerCase() as 'alta' | 'media' | 'baja' | 'nula',
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
  const adaptedData = adaptAnalysisData(analysisData as any);
  const beneficios = adaptedData.beneficios_ecosistemicos || {};
  const presupuesto = adaptedData.presupuesto || {};
  const roi = adaptedData.roi_ambiental || {};
  const subvencion = adaptedData.subvencion || {};
  const normativa = adaptedData.normativa || {};

  const analisisData = {
    zona_verde_id: zonaVerdeId,
    green_score: adaptedData.green_score || DEFAULT_GREEN_SCORE,
    viabilidad: getViabilidad(adaptedData.green_score || DEFAULT_GREEN_SCORE),
    factor_verde: normativa.factor_verde || 0.65,
    
    co2_capturado_kg_anual: beneficios.co2_capturado_kg_anual || Math.round((adaptedData.area_m2 || 0) * DEFAULT_CO2_CAPTURE_PER_M2),
    agua_retenida_litros_anual: beneficios.agua_retenida_litros_anual || Math.round((adaptedData.area_m2 || 0) * DEFAULT_WATER_RETENTION_PER_M2),
    reduccion_temperatura_c: beneficios.reduccion_temperatura_c || 1.5,
    ahorro_energia_kwh_anual: beneficios.ahorro_energia_kwh_anual || Math.round((adaptedData.area_m2 || 0) * DEFAULT_ENERGY_SAVINGS_KWH_PER_M2),
    ahorro_energia_eur_anual: beneficios.ahorro_energia_eur_anual || Math.round((adaptedData.area_m2 || 0) * DEFAULT_ENERGY_SAVINGS_EUR_PER_M2),
    
    coste_total_inicial_eur: presupuesto.coste_total_inicial_eur || Math.round((adaptedData.area_m2 || 0) * DEFAULT_COST_PER_M2),
    presupuesto_desglose: presupuesto.desglose || {},
    mantenimiento_anual_eur: presupuesto.mantenimiento_anual_eur || Math.round((adaptedData.area_m2 || 0) * DEFAULT_MAINTENANCE_PER_M2),
    coste_por_m2_eur: DEFAULT_COST_PER_M2,
    vida_util_anos: DEFAULT_VIDA_UTIL_ANOS,
    
    roi_porcentaje: roi.roi_porcentaje || DEFAULT_ROI_PERCENTAGE,
    amortizacion_anos: roi.amortizacion_anos || DEFAULT_AMORTIZATION_YEARS,
    ahorro_anual_eur: roi.ahorro_anual_eur || Math.round((adaptedData.area_m2 || 0) * DEFAULT_ENERGY_SAVINGS_EUR_PER_M2),
    ahorro_25_anos_eur: roi.ahorro_25_anos_eur || Math.round((adaptedData.area_m2 || 0) * DEFAULT_SAVINGS_25_YEARS_PER_M2),
    
    // Default to true if elegible is not explicitly set to false
    subvencion_elegible: subvencion.elegible !== false,
    subvencion_porcentaje: subvencion.porcentaje || DEFAULT_SUBSIDY_PERCENTAGE,
    subvencion_programa: subvencion.programa || 'PECV Madrid 2025',
    subvencion_monto_estimado_eur: subvencion.monto_estimado_eur || Math.round((presupuesto.coste_total_inicial_eur || 0) * (DEFAULT_SUBSIDY_PERCENTAGE / 100)),
    
    especies_recomendadas: adaptedData.especies_recomendadas || [],
    recomendaciones: adaptedData.recomendaciones || [],
    notas: `Análisis guardado el ${new Date().toLocaleDateString('es-ES')}`
  };

  const { data, error } = await supabase
    .from(TABLES.ANALISIS)
    .insert([analisisData])
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save analysis: ${error.message}`);
  if (!data) throw new Error('No data returned from analysis save');

  console.log('✅ Análisis guardado:', data.id);
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
  if (greenScore >= 70) return 'alta';
  if (greenScore >= 50) return 'media';
  if (greenScore >= 30) return 'baja';
  return 'nula';
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
