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
