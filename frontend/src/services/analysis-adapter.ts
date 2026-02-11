/**
 * Adapter para compatibilidad entre schemas antiguo y nuevo
 * 
 * Este adaptador normaliza datos antiguos y nuevos del análisis para
 * garantizar compatibilidad retroactiva con zonas creadas antes de
 * la actualización del schema.
 */

export interface LegacyAnalysisData {
  green_score: number;
  area_m2: number;
  perimetro_m?: number;
  especies_recomendadas?: any[];
  recomendaciones?: string[];
  tags?: string[];
  // ... campos antiguos básicos
}

export interface NewAnalysisData {
  green_score: number;
  area_m2: number;
  perimetro_m: number;
  normativa?: {
    factor_verde: number;
    cumple_pecv_madrid: boolean;
    cumple_miteco?: boolean;
    apto_para_subvencion?: boolean;
    requisitos?: {
      inclinacion_max_30?: boolean;
      superficie_min_50m2?: boolean;
      factor_verde_min_0_6?: boolean;
    };
  };
  beneficios_ecosistemicos?: {
    co2_capturado_kg_anual: number;
    agua_retenida_litros_anual: number;
    reduccion_temperatura_c: number;
    ahorro_energia_kwh_anual: number;
    ahorro_energia_eur_anual: number;
  };
  presupuesto?: {
    coste_total_inicial_eur: number;
    desglose: {
      sustrato_eur: number;
      drenaje_eur: number;
      membrana_impermeable_eur: number;
      plantas_eur: number;
      instalacion_eur: number;
    };
    mantenimiento_anual_eur: number;
    coste_por_m2_eur: number;
    vida_util_anos: number;
  };
  roi_ambiental?: {
    roi_porcentaje: number;
    amortizacion_anos: number;
    ahorro_anual_eur: number;
    ahorro_25_anos_eur: number;
  };
  subvencion?: {
    elegible: boolean;
    porcentaje: number;
    programa: string;
    monto_estimado_eur: number;
  };
  tags: string[];
  especies_recomendadas: any[];
  recomendaciones: string[];
}

/**
 * Adapta datos de análisis del formato antiguo al nuevo
 * 
 * @param data - Datos de análisis en formato antiguo o nuevo
 * @returns Datos normalizados en formato nuevo con valores por defecto calculados
 */
export function adaptAnalysisData(
  data: LegacyAnalysisData | NewAnalysisData
): NewAnalysisData {
  // Si ya tiene el nuevo formato, retornar as-is
  if ('normativa' in data || 'beneficios_ecosistemicos' in data) {
    return data as NewAnalysisData;
  }

  // Migrar formato antiguo a nuevo
  const legacy = data as LegacyAnalysisData;
  
  return {
    ...legacy,
    perimetro_m: legacy.perimetro_m || 0,
    normativa: {
      factor_verde: 0.65, // Default para datos antiguos
      cumple_pecv_madrid: true,
      cumple_miteco: true,
      apto_para_subvencion: true,
      requisitos: {
        inclinacion_max_30: true,
        superficie_min_50m2: legacy.area_m2 >= 50,
        factor_verde_min_0_6: true
      }
    },
    beneficios_ecosistemicos: {
      co2_capturado_kg_anual: Math.round(legacy.area_m2 * 5),
      agua_retenida_litros_anual: Math.round(legacy.area_m2 * 240),
      reduccion_temperatura_c: 1.5,
      ahorro_energia_kwh_anual: Math.round(legacy.area_m2 * 40),
      ahorro_energia_eur_anual: Math.round(legacy.area_m2 * 10)
    },
    presupuesto: {
      coste_total_inicial_eur: Math.round(legacy.area_m2 * 150),
      desglose: {
        sustrato_eur: Math.round(legacy.area_m2 * 45),
        drenaje_eur: Math.round(legacy.area_m2 * 25),
        membrana_impermeable_eur: Math.round(legacy.area_m2 * 15),
        plantas_eur: Math.round(legacy.area_m2 * 45),
        instalacion_eur: Math.round(legacy.area_m2 * 20)
      },
      mantenimiento_anual_eur: Math.round(legacy.area_m2 * 8),
      coste_por_m2_eur: 150,
      vida_util_anos: 25
    },
    roi_ambiental: {
      roi_porcentaje: 6.67,
      amortizacion_anos: 15.0,
      ahorro_anual_eur: Math.round(legacy.area_m2 * 10),
      ahorro_25_anos_eur: Math.round(legacy.area_m2 * 250)
    },
    subvencion: {
      elegible: true,
      porcentaje: 50,
      programa: 'PECV Madrid 2025',
      monto_estimado_eur: Math.round(legacy.area_m2 * 75)
    },
    tags: legacy.tags || ['Análisis migrado', 'Requiere reanálisis'],
    especies_recomendadas: legacy.especies_recomendadas || [],
    recomendaciones: legacy.recomendaciones || []
  };
}
