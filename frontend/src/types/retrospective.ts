/**
 * TypeScript Types for Retrospective Analysis System
 * 
 * Defines all interfaces for comparing BEFORE (baseline) vs AFTER (projection)
 * states of urban green roofs.
 */

// =====================================================
// BASELINE (Current State - BEFORE)
// =====================================================

export interface Baseline {
  fecha?: string;
  tipo_superficie: 'asfalto' | 'hormigon' | 'grava' | 'mixto';
  area_m2: number;
  area_impermeabilizada_pct: number;
  vegetacion_existente_m2: number;
  
  // Environmental conditions
  temperatura_verano_c: number;
  isla_calor_intensidad: number; // 0-10 scale
  runoff_agua_pct: number;
  co2_captura_kg_anual: number;
  biodiversidad_indice: number;
  
  // Operational costs (€/year)
  coste_ac_eur_anual: number;
  coste_calefaccion_eur_anual: number;
  coste_gestion_agua_eur_anual: number;
  coste_mantenimiento_eur_anual: number;
  coste_total_eur_anual: number;
}

// =====================================================
// PROJECTION (Future State - AFTER)
// =====================================================

export interface Projection {
  anos_horizonte: 1 | 5 | 10 | 25;
  tipo_cubierta: 'extensiva' | 'intensiva' | 'semi-intensiva';
  area_verde_m2: number;
  sustrato_espesor_cm: number;
  sistema_riego: 'goteo' | 'manual' | 'ninguno';
  
  // Environmental improvements
  reduccion_temperatura_c: number;
  retencion_agua_pct: number;
  co2_adicional_kg_anual: number;
  biodiversidad_mejora_pct: number;
  reduccion_ruido_db: number;
  
  // Economic savings (€/year)
  reduccion_ac_eur_anual: number;
  reduccion_calef_eur_anual: number;
  valor_agua_retenida_eur_anual: number;
  ahorro_total_anual: number;
  ahorro_acumulado_25_anos: number;
  
  // Investment required
  coste_inicial_eur: number;
  mantenimiento_anual_eur: number;
  subvenciones_disponibles_eur: number;
  coste_neto_inicial_eur: number;
  
  // Species selected
  especies_seleccionadas: string[];
}

// =====================================================
// COMPARISON (Deltas: BEFORE vs AFTER)
// =====================================================

export interface Comparison {
  delta_temperatura_c: number;      // Negative = improvement (cooling)
  delta_co2_kg_anual: number;       // Positive = more capture
  delta_agua_retenida_m3_anual: number; // Positive = more retention
  delta_costes_eur_anual: number;   // Negative = savings
  delta_biodiversidad_pct: number;  // Positive = improvement
}

// =====================================================
// ROI METRICS
// =====================================================

export interface ROI {
  roi_porcentaje: number;        // Annual ROI percentage
  payback_anos: number;          // Years to recover investment
  vnp_25_anos_eur: number;       // Net Present Value at 25 years (3% discount)
}

// =====================================================
// TIMELINE (Year-by-year evolution)
// =====================================================

export interface TimelinePoint {
  ano: number;
  beneficio_acumulado_eur: number;
  co2_acumulado_kg: number;
  agua_acumulada_m3: number;
}

// =====================================================
// ECOSYSTEM SERVICES VALUE
// =====================================================

export interface EcosystemValue {
  valor_ecosistemico_total_eur: number;
  mejora_calidad_vida_indice: number; // 0-10 scale
  desglose_ecosistemico: {
    valor_co2_eur_anual: number;
    valor_agua_eur_anual: number;
    valor_aire_eur_anual: number;
    valor_total_anual_eur: number;
  };
}

// =====================================================
// COMPLETE RETROSPECTIVE ANALYSIS
// =====================================================

export interface RetrospectiveAnalysis {
  id?: string;
  zona_verde_id?: string;
  nombre?: string;
  descripcion?: string;
  
  baseline: Baseline;
  projection: Projection;
  comparison: Comparison;
  roi: ROI;
  timeline: TimelinePoint[];
  
  valor_ecosistemico_total_eur: number;
  mejora_calidad_vida_indice: number;
  desglose_ecosistemico?: EcosystemValue['desglose_ecosistemico'];
  
  created_at?: Date;
  updated_at?: Date;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface RetrospectiveAnalysisRequest {
  zona_verde_id?: string;
  nombre?: string;
  baseline: {
    tipo_superficie: 'asfalto' | 'hormigon' | 'grava' | 'mixto';
    area_m2: number;
    temperatura_verano_c?: number;
    coste_ac_eur_anual?: number;
    coste_calefaccion_eur_anual?: number;
    coste_agua_eur_anual?: number;
    coste_mantenimiento_eur_anual?: number;
  };
  projection: {
    tipo_cubierta: 'extensiva' | 'intensiva' | 'semi-intensiva';
    area_verde_m2?: number;
    anos_horizonte?: 1 | 5 | 10 | 25;
    especies?: string[];
    sustrato_espesor_cm?: number;
    sistema_riego?: 'goteo' | 'manual' | 'ninguno';
  };
}

export interface RetrospectiveAnalysisResponse {
  success: boolean;
  retrospective_id?: string;
  zona_verde_id?: string;
  nombre?: string;
  baseline: Baseline;
  projection: Projection;
  comparison: Comparison;
  roi: ROI;
  timeline: TimelinePoint[];
  valor_ecosistemico_total_eur: number;
  mejora_calidad_vida_indice: number;
  desglose_ecosistemico?: EcosystemValue['desglose_ecosistemico'];
  metadata?: {
    version: string;
    metodologia: {
      energia: string;
      ecosistema: string;
      normativa: string;
      roi: string;
    };
  };
  error?: string;
  message?: string;
}

// =====================================================
// FORM DATA TYPES (for UI forms)
// =====================================================

export interface BaselineFormData {
  tipo_superficie: 'asfalto' | 'hormigon' | 'grava' | 'mixto';
  area_m2: number;
  temperatura_verano_c: number;
  coste_ac_eur_anual?: number;
  coste_calefaccion_eur_anual?: number;
}

export interface ProjectionFormData {
  tipo_cubierta: 'extensiva' | 'intensiva' | 'semi-intensiva';
  area_verde_m2: number;
  anos_horizonte: 1 | 5 | 10 | 25;
  especies: string[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SurfaceType = 'asfalto' | 'hormigon' | 'grava' | 'mixto';
export type RoofType = 'extensiva' | 'intensiva' | 'semi-intensiva';
export type IrrigationType = 'goteo' | 'manual' | 'ninguno';
export type TimeHorizon = 1 | 5 | 10 | 25;

// =====================================================
// DISPLAY LABELS (for UI)
// =====================================================

export const SURFACE_TYPE_LABELS: Record<SurfaceType, string> = {
  asfalto: 'Asfalto',
  hormigon: 'Hormigón',
  grava: 'Grava',
  mixto: 'Mixto'
};

export const ROOF_TYPE_LABELS: Record<RoofType, string> = {
  extensiva: 'Extensiva (bajo mantenimiento)',
  intensiva: 'Intensiva (jardín completo)',
  'semi-intensiva': 'Semi-intensiva (intermedio)'
};

export const IRRIGATION_TYPE_LABELS: Record<IrrigationType, string> = {
  goteo: 'Riego por goteo',
  manual: 'Riego manual',
  ninguno: 'Sin riego'
};

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  1: '1 año',
  5: '5 años',
  10: '10 años',
  25: '25 años'
};
