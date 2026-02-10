/**
 * EcoUrbe AI - Domain Layer
 * Entidad: ZonaVerde
 * 
 * Representa una zona urbana candidata para reforestación.
 * Siguiendo principios de Clean Architecture y Domain-Driven Design.
 */

// Tipos enumerados según esquema de base de datos
export type TipoZona = 
  | 'azotea'
  | 'solar_vacio'
  | 'parque_degradado'
  | 'espacio_abandonado'
  | 'zona_industrial'
  | 'otro';

export type EstadoZona = 
  | 'detectada'
  | 'en_analisis'
  | 'viable'
  | 'no_viable'
  | 'en_proyecto'
  | 'completada';

export type NivelViabilidad = 
  | 'alta'
  | 'media'
  | 'baja'
  | 'no_viable';

/**
 * Interfaz principal de ZonaVerde
 * Representa el modelo de dominio de una zona verde urbana
 */
export interface ZonaVerde {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoZona;
  estado?: EstadoZona;
  areaM2: number;
  nivelViabilidad?: NivelViabilidad;
  detectadaPorIA: boolean;
  municipioId?: string;
  usuarioCreadorId?: string;
  notas?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Regla de negocio: Verificar si una zona es viable para reforestación
 * @param zona - Zona verde a evaluar
 * @returns true si la zona tiene viabilidad alta o media
 */
export function esZonaViable(zona: ZonaVerde): boolean {
  return zona.nivelViabilidad === 'alta' || zona.nivelViabilidad === 'media';
}

/**
 * Regla de negocio: Verificar si una zona tiene área mínima requerida
 * @param zona - Zona verde a evaluar
 * @param areaMinima - Área mínima en m² (por defecto 50m²)
 * @returns true si la zona cumple con el área mínima
 */
export function cumpleAreaMinima(zona: ZonaVerde, areaMinima: number = 50): boolean {
  return zona.areaM2 >= areaMinima;
}

/**
 * Regla de negocio: Calcular prioridad de una zona basada en sus características
 * @param zona - Zona verde a evaluar
 * @returns Puntuación de prioridad (0-100)
 */
export function calcularPrioridad(zona: ZonaVerde): number {
  let prioridad = 0;

  // Puntos por viabilidad
  if (zona.nivelViabilidad === 'alta') prioridad += 40;
  else if (zona.nivelViabilidad === 'media') prioridad += 25;
  else if (zona.nivelViabilidad === 'baja') prioridad += 10;

  // Puntos por área (normalizado)
  const factorArea = Math.min(zona.areaM2 / 1000, 1);
  prioridad += factorArea * 30;

  // Puntos por tipo de zona (algunos tipos son más urgentes)
  const prioridadPorTipo: Record<TipoZona, number> = {
    espacio_abandonado: 20,
    parque_degradado: 15,
    solar_vacio: 15,
    zona_industrial: 10,
    azotea: 5,
    otro: 5
  };
  prioridad += prioridadPorTipo[zona.tipo];

  // Bonus por detección por IA (más confiable)
  if (zona.detectadaPorIA) prioridad += 10;

  return Math.min(Math.round(prioridad), 100);
}

/**
 * Regla de negocio: Validar datos básicos de una zona verde
 * @param zona - Zona verde a validar
 * @returns Objeto con validez y errores encontrados
 */
export function validarZonaVerde(zona: Partial<ZonaVerde>): {
  valido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (!zona.nombre || zona.nombre.trim().length === 0) {
    errores.push('El nombre es obligatorio');
  }

  if (!zona.tipo) {
    errores.push('El tipo de zona es obligatorio');
  }

  if (!zona.areaM2 || zona.areaM2 <= 0) {
    errores.push('El área debe ser mayor a 0 m²');
  }

  if (zona.areaM2 && zona.areaM2 > 1000000) {
    errores.push('El área parece excesivamente grande (>1,000,000 m²)');
  }

  if (!zona.codigo || zona.codigo.trim().length === 0) {
    errores.push('El código es obligatorio');
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Regla de negocio: Generar código único para zona verde
 * @param municipioId - ID del municipio
 * @param tipo - Tipo de zona
 * @param timestamp - Timestamp (por defecto actual)
 * @returns Código único generado
 */
export function generarCodigoZona(
  municipioId: string,
  tipo: TipoZona,
  timestamp: number = Date.now()
): string {
  const prefijoPorTipo: Record<TipoZona, string> = {
    azotea: 'AZ',
    solar_vacio: 'SV',
    parque_degradado: 'PD',
    espacio_abandonado: 'EA',
    zona_industrial: 'ZI',
    otro: 'OT'
  };

  const municipioCorto = municipioId.substring(0, 8).toUpperCase();
  const prefijo = prefijoPorTipo[tipo];
  const timestampCorto = timestamp.toString(36).toUpperCase();

  return `${prefijo}-${municipioCorto}-${timestampCorto}`;
}
