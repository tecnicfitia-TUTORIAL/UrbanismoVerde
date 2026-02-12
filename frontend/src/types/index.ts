// Tipos de zona según especificación
export type TipoZona = 'azotea' | 'solar_vacio' | 'parque_degradado' | 'espacio_abandonado' | 'zona_industrial' | 'otro';

// Interfaz para las áreas detectadas/dibujadas
export interface Area {
  id: string;
  nombre: string;
  tipo: TipoZona;
  coordenadas: [number, number][];
  areaM2: number;
  notas?: string;
  fechaCreacion: Date;
}

// Interfaz para datos del formulario
export interface FormData {
  nombre: string;
  tipo: TipoZona;
  notas: string;
}

// Colores por tipo de zona
export const coloresPorTipo: Record<TipoZona, string> = {
  azotea: '#3b82f6',
  solar_vacio: '#ef4444',
  parque_degradado: '#f59e0b',
  espacio_abandonado: '#8b5cf6',
  zona_industrial: '#6b7280',
  otro: '#14b8a6'
};

// Interfaz para materiales calculados
export interface MaterialCalculation {
  sustrato: {
    volumenM3: number;
    bolsas: number;
    coste: number;
  };
  riego: {
    metrosLineales: number;
    coste: number;
  };
  plantas: {
    cantidad: number;
    coste: number;
  };
  total: number;
}

// Interfaz para productos del marketplace
export interface MarketplaceProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'riego' | 'semillas' | 'sustrato' | 'herramientas';
  badge?: string;
  enPresupuesto?: boolean;
}

// Interfaz para presupuesto completo
export interface Presupuesto {
  id: string;
  areaId: string;
  fechaCreacion: Date;
  materiales: MaterialCalculation;
  productosAdicionales: MarketplaceProduct[];
  totalFinal: number;
}

// Interfaces para navegación
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: string;
  count?: number;
  active?: boolean;
}

export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  view: string;
  count?: number;
  disabled?: boolean;
  subItems?: SubMenuItem[];
}

// Interfaces para Dashboard
export interface DashboardStats {
  zonasCreadas: number;
  areaTotal: number;
  presupuestosGenerados: number;
  analisisRealizados: number;
}

// Interfaces para análisis IA
export interface AnalysisResult {
  id: string;
  fecha: Date;
  coordenadas?: [number, number];
  areaId?: string;
  greenScore: number;
  especiesRecomendadas: string[];
  recomendaciones: string[];
}

// GeoJSON types for AI analysis
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];  // [[[lon, lat], [lon, lat], ...]]
}

// AI Analysis Response from API
export interface EspecieRecomendada {
  nombre_comun: string;
  nombre_cientifico: string;
  tipo: string;
  viabilidad: number;  // 0-1
  razon: string;
}

export interface AnalysisResponse {
  success: boolean;
  green_score: number;        // 0-100
  area_m2: number;
  perimetro_m: number;
  tags: string[];            // ["Alta radiación solar", ...]
  especies_recomendadas: EspecieRecomendada[];
  recomendaciones: string[];
  processing_time: number;
  error?: string;
  
  // Urban regeneration modules
  poblacion_datos?: PoblacionDatos;
  deficit_verde?: DeficitVerde;
  priorizacion?: Priorizacion;
}

// Module A: Population Benefited
export interface PoblacionDatos {
  densidad_barrio_hab_km2: number;
  edificio_viviendas: number;
  edificio_personas_estimadas: number;
  beneficiarios_directos_radio_50m: number;
  beneficiarios_indirectos_radio_200m: number;
  coste_por_persona: number;
}

// Module B: Green Space Deficit
export interface DeficitVerde {
  verde_actual_m2_hab: number;
  oms_minimo: number;
  deficit: number;
  con_cubierta_m2_hab: number;
  mejora_pct: number;
  prioridad: 'alta' | 'media' | 'baja';
}

// Module C: Prioritization System
export interface Priorizacion {
  score_total: number;
  clasificacion: 'urgente' | 'alta' | 'media' | 'baja';
  recomendacion: string;
  factores: {
    densidad_poblacional: number;
    deficit_verde: number;
    temperatura: number;
    vulnerabilidad_social: number;
    viabilidad_tecnica: number;
  };
}

// Extended analysis data with costs and benefits
export interface CostBenefitData {
  inversion_inicial: number;
  ahorro_anual: number;
  roi_porcentaje: number;
  amortizacion_anos: number;
  subvenciones_disponibles: number;
}

// Subzone for satellite map selection
export interface SubZone {
  id: string;
  polygon: GeoJSONPolygon;
  area_m2: number;
  selected: boolean;
}

// Saved analysis record
export interface SavedAnalysis {
  zonaVerdeId: string;
  analisisId: string;
  timestamp: Date;
}

// Report generation data
export interface ReportData {
  id: string;
  analisis_id: string;
  formato: 'pdf' | 'html' | 'json';
  contenido?: string;
  url_pdf?: string;
  generado_por?: string;
  created_at: Date;
}

// ============================================================================
// SPECIALIZED ANALYSIS - Hierarchical Analysis System
// ============================================================================

// Specialization types
export type TipoEspecializacion = 
  | 'tejado'
  | 'zona_abandonada'
  | 'solar_vacio'
  | 'parque_degradado'
  | 'jardin_vertical'
  | 'otro';

// Specialized analysis interface
export interface AnalisisEspecializado {
  id: string;
  analisis_id: string;
  tipo_especializacion: TipoEspecializacion;
  
  // Inherited data (snapshot from base analysis)
  area_base_m2: number;
  green_score_base: number;
  especies_base?: EspecieRecomendada[];
  presupuesto_base_eur?: number;
  
  // Specific data (JSONB for flexibility)
  caracteristicas_especificas: Record<string, any>;
  analisis_adicional: Record<string, any>;
  presupuesto_adicional: Record<string, any>;
  
  // Adjusted budget
  presupuesto_total_eur?: number;
  incremento_vs_base_eur?: number;
  incremento_vs_base_porcentaje?: number;
  
  // Specific viabilities
  viabilidad_tecnica?: 'alta' | 'media' | 'baja' | 'nula';
  viabilidad_economica?: 'alta' | 'media' | 'baja' | 'nula';
  viabilidad_normativa?: 'alta' | 'media' | 'baja' | 'nula';
  viabilidad_final?: 'alta' | 'media' | 'baja' | 'nula';
  
  // Notes
  notas?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// UI Metadata for each specialization type
export interface TipoEspecializacionInfo {
  id: TipoEspecializacion;
  nombre: string;
  descripcion: string;
  icon: string; // Lucide icon name
  tags: string[];
  color: string;
}

// Constant with all 6 specialization types
export const TIPOS_ESPECIALIZACION: TipoEspecializacionInfo[] = [
  {
    id: 'tejado',
    nombre: 'Cubierta Verde',
    descripcion: 'Análisis específico para tejados y azoteas',
    icon: 'Home',
    tags: ['Estructural', 'Impermeabilización', 'Carga'],
    color: 'bg-blue-500',
  },
  {
    id: 'zona_abandonada',
    nombre: 'Zona Abandonada',
    descripcion: 'Regeneración de espacios en desuso',
    icon: 'Construction',
    tags: ['Limpieza', 'Seguridad', 'Regeneración'],
    color: 'bg-orange-500',
  },
  {
    id: 'solar_vacio',
    nombre: 'Solar Vacío',
    descripcion: 'Transformación de solares sin edificar',
    icon: 'Square',
    tags: ['Temporal', 'Suelo', 'Accesibilidad'],
    color: 'bg-yellow-500',
  },
  {
    id: 'parque_degradado',
    nombre: 'Parque Degradado',
    descripcion: 'Mejora de parques existentes',
    icon: 'Trees',
    tags: ['Rehabilitación', 'Mobiliario', 'Vegetación'],
    color: 'bg-green-500',
  },
  {
    id: 'jardin_vertical',
    nombre: 'Jardín Vertical',
    descripcion: 'Sistemas verticales en fachadas',
    icon: 'Building2',
    tags: ['Vertical', 'Riego', 'Estructura'],
    color: 'bg-emerald-500',
  },
  {
    id: 'otro',
    nombre: 'Otro Tipo',
    descripcion: 'Análisis personalizado',
    icon: 'MoreHorizontal',
    tags: ['Personalizado', 'Flexible'],
    color: 'bg-gray-500',
  },
];

// Request/Response types for specialization generation
export interface GenerateSpecializationRequest {
  analisis_id: string;
  tipo_especializacion: TipoEspecializacion;
  area_base_m2: number;
  green_score_base: number;
  especies_base?: EspecieRecomendada[];
  presupuesto_base_eur?: number;
}

export interface SpecializationResponse {
  success: boolean;
  especializacion_id?: string;
  tipo_especializacion: TipoEspecializacion;
  caracteristicas_especificas: Record<string, any>;
  analisis_adicional: Record<string, any>;
  presupuesto_total_eur: number;
  incremento_vs_base_eur: number;
  incremento_vs_base_porcentaje: number;
  viabilidad_final: 'alta' | 'media' | 'baja' | 'nula';
  error?: string;
}
