/**
 * Prioritization Service
 * Module C: Multi-Criteria Prioritization System
 * 
 * Calculates priority score for urban regeneration projects
 * based on multiple criteria: density, green deficit, temperature,
 * social vulnerability, and technical viability.
 */

interface PrioritizationScore {
  score_total: number;
  clasificacion: 'urgente' | 'alta' | 'media' | 'baja';
  factores: {
    densidad_poblacional: number;
    deficit_verde: number;
    temperatura: number;
    vulnerabilidad_social: number;
    viabilidad_tecnica: number;
  };
  recomendacion: string;
}

/**
 * Calculate prioritization score for a project
 * 
 * @param densidadHabKm2 Population density in hab/km²
 * @param deficitVerde Green space deficit in m²/hab (negative = deficit)
 * @param temperaturaVerano Average summer temperature in °C
 * @param viabilidad Technical viability ('alta', 'media', 'baja')
 * @param rentaMedia Optional: average income in EUR (for social vulnerability)
 * @returns Prioritization score and classification
 */
export function calculatePrioritization(
  densidadHabKm2: number,
  deficitVerde: number,
  temperaturaVerano: number,
  viabilidad: string,
  rentaMedia?: number
): PrioritizationScore {
  
  // 1. Population Density (0-25 points)
  let scoreDensidad = 0;
  if (densidadHabKm2 > 15000) scoreDensidad = 25;
  else if (densidadHabKm2 > 10000) scoreDensidad = 20;
  else if (densidadHabKm2 > 5000) scoreDensidad = 15;
  else if (densidadHabKm2 > 2000) scoreDensidad = 10;
  else scoreDensidad = 5;

  // 2. Green Space Deficit (0-25 points)
  let scoreDeficit = 0;
  if (deficitVerde < -6) scoreDeficit = 25;        // <3 m²/hab
  else if (deficitVerde < -3) scoreDeficit = 20;   // 3-6 m²/hab
  else if (deficitVerde < 0) scoreDeficit = 15;    // 6-9 m²/hab
  else scoreDeficit = 5;                           // >9 m²/hab

  // 3. Temperature (heat island) (0-20 points)
  let scoreTemp = 0;
  if (temperaturaVerano > 35) scoreTemp = 20;
  else if (temperaturaVerano > 33) scoreTemp = 15;
  else if (temperaturaVerano > 30) scoreTemp = 10;
  else scoreTemp = 5;

  // 4. Social Vulnerability (0-15 points)
  let scoreVulnerabilidad = 10;  // default medium
  if (rentaMedia !== undefined) {
    if (rentaMedia < 15000) scoreVulnerabilidad = 15;
    else if (rentaMedia < 20000) scoreVulnerabilidad = 12;
    else if (rentaMedia > 30000) scoreVulnerabilidad = 5;
  }

  // 5. Technical Viability (0-15 points)
  let scoreViabilidad = 0;
  const viabilidadLower = viabilidad.toLowerCase();
  if (viabilidadLower === 'alta') scoreViabilidad = 15;
  else if (viabilidadLower === 'media') scoreViabilidad = 10;
  else if (viabilidadLower === 'baja') scoreViabilidad = 5;
  else scoreViabilidad = 0;

  const scoreTotal = 
    scoreDensidad + 
    scoreDeficit + 
    scoreTemp + 
    scoreVulnerabilidad + 
    scoreViabilidad;

  // Classification
  let clasificacion: 'urgente' | 'alta' | 'media' | 'baja';
  if (scoreTotal >= 85) clasificacion = 'urgente';
  else if (scoreTotal >= 70) clasificacion = 'alta';
  else if (scoreTotal >= 50) clasificacion = 'media';
  else clasificacion = 'baja';

  // Recommendation
  let recomendacion = '';
  if (clasificacion === 'urgente') {
    recomendacion = '⚠️ IMPLEMENTAR URGENTE: Zona prioritaria por alta densidad, déficit verde crítico y temperatura elevada.';
  } else if (clasificacion === 'alta') {
    recomendacion = '🔴 PRIORIDAD ALTA: Zona con necesidad significativa de regeneración verde.';
  } else if (clasificacion === 'media') {
    recomendacion = '🟡 PRIORIDAD MEDIA: Implementar según disponibilidad presupuestaria.';
  } else {
    recomendacion = '🟢 PRIORIDAD BAJA: Zona con menor necesidad relativa.';
  }

  return {
    score_total: scoreTotal,
    clasificacion,
    factores: {
      densidad_poblacional: scoreDensidad,
      deficit_verde: scoreDeficit,
      temperatura: scoreTemp,
      vulnerabilidad_social: scoreVulnerabilidad,
      viabilidad_tecnica: scoreViabilidad
    },
    recomendacion
  };
}

/**
 * Get viability classification from green score
 * 
 * @param greenScore Green score (0-100)
 * @returns Viability classification
 */
export function getViabilityFromScore(greenScore: number): string {
  if (greenScore >= 70) return 'alta';
  if (greenScore >= 40) return 'media';
  return 'baja';
}

/**
 * Estimate summer temperature based on location
 * Can be enhanced with real weather API data
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns Estimated summer temperature in °C
 */
export function estimateSummerTemperature(lat: number, lon: number): number {
  // Simple estimation based on latitude
  // Spain: Madrid ~32°C, Barcelona ~30°C, Seville ~35°C
  if (lat < 38) return 35; // Southern Spain
  if (lat < 40) return 33; // Central Spain
  if (lat < 42) return 32; // Northern-Central Spain
  return 30; // Northern Spain
}
