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
