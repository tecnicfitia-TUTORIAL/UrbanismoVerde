/**
 * AI Analysis Service
 * 
 * Service to analyze green zones using the serverless Python API
 * Includes timeout handling, fallback to mock data, and local caching
 */

import { GeoJSONPolygon, AnalysisResponse, EspecieRecomendada } from '../types';

const ANALYSIS_TIMEOUT = 10000; // 10 seconds
const CACHE_KEY = 'ai_analysis_cache';
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

// API endpoint - will use Vercel serverless function
const API_ENDPOINT = '/api/analyze';

interface CacheEntry {
  polygon: GeoJSONPolygon;
  result: AnalysisResponse;
  timestamp: number;
}

/**
 * Get cached analysis if available and not expired
 */
function getCachedAnalysis(polygon: GeoJSONPolygon): AnalysisResponse | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache: CacheEntry[] = JSON.parse(cacheStr);
    const now = Date.now();

    // Find matching polygon in cache
    const cached = cache.find(entry => {
      if (now - entry.timestamp > CACHE_EXPIRY) return false;
      
      // Compare polygons using coordinate hash for better performance
      // Note: This is a simple approach - in production consider using
      // a spatial hashing library or tolerance-based comparison
      const entryHash = JSON.stringify(entry.polygon.coordinates.map(ring => 
        ring.map(coord => coord.map(c => c.toFixed(6)))
      ));
      const polygonHash = JSON.stringify(polygon.coordinates.map(ring =>
        ring.map(coord => coord.map(c => c.toFixed(6)))
      ));
      
      return entryHash === polygonHash;
    });

    if (cached) {
      console.log('🎯 Using cached analysis result');
      return cached.result;
    }

    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Save analysis result to cache
 */
function cacheAnalysis(polygon: GeoJSONPolygon, result: AnalysisResponse): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    let cache: CacheEntry[] = cacheStr ? JSON.parse(cacheStr) : [];

    // Add new entry
    cache.push({
      polygon,
      result,
      timestamp: Date.now()
    });

    // Keep only last 10 entries
    if (cache.length > 10) {
      cache = cache.slice(-10);
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('💾 Analysis result cached');
  } catch (error) {
    console.error('Error caching result:', error);
  }
}

/**
 * Generate mock analysis for fallback
 * 
 * Note: This uses a simplified area calculation that doesn't account
 * for latitude variations. It's sufficient for fallback/offline mode
 * but the backend Haversine calculation is more accurate.
 */
function getMockAnalysis(polygon: GeoJSONPolygon): AnalysisResponse {
  // Calculate approximate area from coordinates (simplified for fallback)
  // For accurate calculations, the backend uses Haversine formula
  const coords = polygon.coordinates[0];
  const area = Math.abs(
    coords.reduce((sum, point, i) => {
      const next = coords[(i + 1) % coords.length];
      return sum + (point[0] * next[1] - next[0] * point[1]);
    }, 0) / 2
  );

  // Convert degrees to approximate meters (rough estimate for fallback)
  // Note: This doesn't account for latitude - backend calculation is more accurate
  const area_m2 = Math.abs(area * 111000 * 111000);

  const mockSpecies: EspecieRecomendada[] = [
    {
      nombre_comun: "Lavanda",
      nombre_cientifico: "Lavandula angustifolia",
      tipo: "Aromática",
      viabilidad: 0.85,
      razon: "Análisis en modo offline - especie versátil"
    },
    {
      nombre_comun: "Romero",
      nombre_cientifico: "Rosmarinus officinalis",
      tipo: "Aromática",
      viabilidad: 0.80,
      razon: "Recomendación por defecto"
    }
  ];

  return {
    success: true,
    green_score: Math.floor(Math.random() * 50) + 25, // 25-75
    area_m2: area_m2,
    perimetro_m: coords.length * 10,
    tags: ["Análisis offline", "Espacio mediano"],
    especies_recomendadas: mockSpecies,
    recomendaciones: [
      "Este es un análisis generado localmente",
      "Conecte a internet para análisis completo con IA"
    ],
    processing_time: 0.1
  };
}

/**
 * Analyze green zone using AI
 * 
 * @param polygon - GeoJSON polygon with coordinates
 * @returns Analysis result with green score, species recommendations, etc.
 */
export async function analyzeZone(polygon: GeoJSONPolygon): Promise<AnalysisResponse> {
  console.log('🔬 Iniciando análisis de zona...', polygon);

  // Check cache first
  const cached = getCachedAnalysis(polygon);
  if (cached) {
    return cached;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ polygon }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AnalysisResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    console.log('✅ Análisis completado:', result);

    // Cache successful result
    cacheAnalysis(polygon, result);

    return result;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      // Timeout error
      if (error.name === 'AbortError') {
        console.warn('⏱️ Análisis timeout - usando fallback');
        return getMockAnalysis(polygon);
      }

      // Network error
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.warn('🔌 Error de conexión - usando fallback');
        return getMockAnalysis(polygon);
      }

      console.error('❌ Error en análisis:', error);
    }

    // Return mock analysis as fallback
    return getMockAnalysis(polygon);
  }
}

/**
 * Clear analysis cache
 */
export function clearAnalysisCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Cache de análisis limpiado');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Convert [lat, lng] coordinates to GeoJSON Polygon
 * 
 * @param coordinates - Array of [lat, lng] coordinates
 * @returns GeoJSON Polygon
 */
export function coordinatesToGeoJSON(coordinates: [number, number][]): GeoJSONPolygon {
  // GeoJSON uses [lon, lat] format, not [lat, lon]
  const geoJSONCoords = coordinates.map(coord => [coord[1], coord[0]]);
  
  // Ensure polygon is closed (first and last point are the same)
  if (geoJSONCoords.length > 0) {
    const first = geoJSONCoords[0];
    const last = geoJSONCoords[geoJSONCoords.length - 1];
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      geoJSONCoords.push([...first]);
    }
  }

  return {
    type: 'Polygon',
    coordinates: [geoJSONCoords]
  };
}
