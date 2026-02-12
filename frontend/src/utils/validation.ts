/**
 * Utilidades para validar y convertir valores antes de guardar en Supabase
 */

// Límites prácticos para la aplicación
const PRACTICAL_LIMITS = {
  area_m2: { min: 1, max: 10_000_000 }, // 1 m² a 10 km²
  coste_eur: { min: 0, max: 1_000_000_000 }, // hasta 1 mil millones €
  porcentaje: { min: 0, max: 100 },
  anos: { min: 1, max: 100 },
  temperatura_c: { min: -10, max: 50 },
  green_score: { min: 0, max: 100 },
};

/**
 * Convierte número a entero seguro para BIGINT
 */
export function toSafeBigInt(value: number | null | undefined): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  // Redondear a entero
  const rounded = Math.round(value);

  // Validar límites de BIGINT
  if (rounded > Number.MAX_SAFE_INTEGER) {
    console.warn(`⚠️ Valor ${rounded} excede MAX_SAFE_INTEGER, limitando...`);
    return Number.MAX_SAFE_INTEGER;
  }

  if (rounded < Number.MIN_SAFE_INTEGER) {
    console.warn(`⚠️ Valor ${rounded} es menor que MIN_SAFE_INTEGER, limitando...`);
    return Number.MIN_SAFE_INTEGER;
  }

  return rounded;
}

/**
 * Valida y convierte costos monetarios
 */
export function validateCoste(value: number | null | undefined, fieldName: string): number | null {
  const safe = toSafeBigInt(value);
  
  if (safe === null) return null;

  if (safe < 0) {
    console.error(`❌ ${fieldName} no puede ser negativo: ${safe}`);
    return 0;
  }

  if (safe > PRACTICAL_LIMITS.coste_eur.max) {
    console.warn(`⚠️ ${fieldName} excede límite práctico: ${safe}, limitando a ${PRACTICAL_LIMITS.coste_eur.max}`);
    return PRACTICAL_LIMITS.coste_eur.max;
  }

  return safe;
}

/**
 * Valida porcentajes (0-100)
 */
export function validatePorcentaje(value: number | null | undefined, fieldName: string): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  if (clamped !== Math.round(value)) {
    console.warn(`⚠️ ${fieldName} fuera de rango (0-100): ${value}, ajustado a ${clamped}`);
  }

  return clamped;
}

/**
 * Valida años (1-100)
 */
export function validateAnos(value: number | null | undefined, fieldName: string): number | null {
  const safe = toSafeBigInt(value);
  
  if (safe === null) return null;

  const clamped = Math.max(
    PRACTICAL_LIMITS.anos.min,
    Math.min(PRACTICAL_LIMITS.anos.max, safe)
  );

  if (clamped !== safe) {
    console.warn(`⚠️ ${fieldName} fuera de rango (${PRACTICAL_LIMITS.anos.min}-${PRACTICAL_LIMITS.anos.max}): ${safe}, ajustado a ${clamped}`);
  }

  return clamped;
}

/**
 * Valida temperatura (-10 a 50°C)
 */
export function validateTemperatura(value: number | null | undefined): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  // Redondear a 1 decimal
  const rounded = Math.round(value * 10) / 10;

  const clamped = Math.max(
    PRACTICAL_LIMITS.temperatura_c.min,
    Math.min(PRACTICAL_LIMITS.temperatura_c.max, rounded)
  );

  return clamped;
}

/**
 * Valida Green Score (0-100)
 */
export function validateGreenScore(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  // Redondear a 2 decimales
  const rounded = Math.round(value * 100) / 100;

  return Math.max(0, Math.min(100, rounded));
}

/**
 * Valida área en m²
 */
export function validateArea(value: number | null | undefined): number | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  if (value < PRACTICAL_LIMITS.area_m2.min) {
    console.error(`❌ Área muy pequeña: ${value} m²`);
    return null;
  }

  if (value > PRACTICAL_LIMITS.area_m2.max) {
    console.warn(`⚠️ Área muy grande: ${value} m², limitando...`);
    return PRACTICAL_LIMITS.area_m2.max;
  }

  // Redondear a 2 decimales
  return Math.round(value * 100) / 100;
}

/**
 * Valida objeto completo de análisis antes de guardar
 */
export function validateAnalisisData(data: any): {
  valid: boolean;
  errors: string[];
  sanitized: any;
} {
  const errors: string[] = [];
  const sanitized: any = { ...data };

  // Validar campos requeridos
  if (!sanitized.zona_verde_id) {
    errors.push('zona_verde_id es requerido');
  }

  if (!sanitized.green_score && sanitized.green_score !== 0) {
    errors.push('green_score es requerido');
  }

  // Validar y sanitizar campos numéricos
  sanitized.green_score = validateGreenScore(sanitized.green_score);
  sanitized.factor_verde = sanitized.factor_verde ? Math.round(sanitized.factor_verde * 100) / 100 : null;
  
  // Costos
  sanitized.coste_total_inicial_eur = validateCoste(sanitized.coste_total_inicial_eur, 'coste_total_inicial_eur');
  sanitized.mantenimiento_anual_eur = validateCoste(sanitized.mantenimiento_anual_eur, 'mantenimiento_anual_eur');
  sanitized.coste_por_m2_eur = validateCoste(sanitized.coste_por_m2_eur, 'coste_por_m2_eur');
  sanitized.ahorro_anual_eur = validateCoste(sanitized.ahorro_anual_eur, 'ahorro_anual_eur');
  sanitized.ahorro_25_anos_eur = validateCoste(sanitized.ahorro_25_anos_eur, 'ahorro_25_anos_eur');
  sanitized.ahorro_energia_eur_anual = validateCoste(sanitized.ahorro_energia_eur_anual, 'ahorro_energia_eur_anual');
  sanitized.subvencion_monto_estimado_eur = validateCoste(sanitized.subvencion_monto_estimado_eur, 'subvencion_monto_estimado_eur');

  // Cantidades grandes (BIGINT)
  sanitized.co2_capturado_kg_anual = toSafeBigInt(sanitized.co2_capturado_kg_anual);
  sanitized.agua_retenida_litros_anual = toSafeBigInt(sanitized.agua_retenida_litros_anual);
  sanitized.ahorro_energia_kwh_anual = toSafeBigInt(sanitized.ahorro_energia_kwh_anual);

  // Porcentajes
  sanitized.roi_porcentaje = validatePorcentaje(sanitized.roi_porcentaje, 'roi_porcentaje');
  sanitized.subvencion_porcentaje = validatePorcentaje(sanitized.subvencion_porcentaje, 'subvencion_porcentaje');

  // Años
  sanitized.vida_util_anos = validateAnos(sanitized.vida_util_anos, 'vida_util_anos');
  sanitized.amortizacion_anos = sanitized.amortizacion_anos ? Math.round(sanitized.amortizacion_anos * 10) / 10 : null;

  // Temperatura
  sanitized.reduccion_temperatura_c = validateTemperatura(sanitized.reduccion_temperatura_c);

  // Viabilidad (enum)
  if (sanitized.viabilidad && !['alta', 'media', 'baja', 'nula'].includes(sanitized.viabilidad)) {
    errors.push(`viabilidad inválida: ${sanitized.viabilidad}`);
    sanitized.viabilidad = 'media'; // default
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
