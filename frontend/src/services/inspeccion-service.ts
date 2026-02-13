import { supabase, TABLES } from '../config/supabase';
import { InspeccionTejado } from '../types';
import * as turf from '@turf/turf';

/**
 * Save new rooftop inspection
 */
export async function saveInspeccion(data: InspeccionTejado): Promise<InspeccionTejado> {
  const { data: saved, error } = await supabase
    .from('inspecciones_tejados')
    .insert({
      nombre: data.nombre,
      direccion: data.direccion,
      numero: data.numero,
      municipio: data.municipio,
      provincia: data.provincia,
      codigo_postal: data.codigo_postal,
      pais: data.pais,
      coordenadas: data.coordenadas,
      centroide: `POINT(${data.centroide[0]} ${data.centroide[1]})`,
      area_m2: data.area_m2,
      perimetro_m: data.perimetro_m,
      orientacion: data.orientacion,
      imagen_satelital_url: data.imagen_satelital_url,
      imagen_calle_url: data.imagen_calle_url,
      inclinacion_estimada: data.inclinacion_estimada,
      tipo_cubierta: data.tipo_cubierta,
      estado_conservacion: data.estado_conservacion,
      obstrucciones: data.obstrucciones,
      notas: data.notas,
      viabilidad_preliminar: data.viabilidad_preliminar,
      prioridad: data.prioridad,
      informe_id: data.informe_id,
      zona_verde_id: data.zona_verde_id,
      // AI analysis fields
      analisis_ia_resultado: data.analisis_ia_resultado,
      analisis_ia_confianza: data.analisis_ia_confianza,
      imagen_analizada_url: data.imagen_analizada_url,
      requiere_revision: data.requiere_revision,
      revisado_por_usuario: data.revisado_por_usuario,
      fecha_analisis_ia: data.fecha_analisis_ia
    })
    .select()
    .single();

  if (error) throw error;
  return saved;
}

/**
 * Load all inspections
 */
export async function loadInspecciones(): Promise<InspeccionTejado[]> {
  const { data, error } = await supabase
    .from('inspecciones_tejados')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Load single inspection by ID
 */
export async function loadInspeccionById(id: string): Promise<InspeccionTejado | null> {
  const { data, error } = await supabase
    .from('inspecciones_tejados')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete inspection
 */
export async function deleteInspeccion(id: string): Promise<void> {
  const { error } = await supabase
    .from('inspecciones_tejados')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Update inspection
 */
export async function updateInspeccion(id: string, updates: Partial<InspeccionTejado>): Promise<InspeccionTejado> {
  const { data, error } = await supabase
    .from('inspecciones_tejados')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reverse geocode coordinates to get address
 * Uses OpenStreetMap Nominatim API
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{
  street: string;
  number: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
}> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UrbanismoVerde/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      street: address.road || address.street || '',
      number: address.house_number || '',
      city: address.city || address.town || address.village || address.municipality || '',
      postalCode: address.postcode || '',
      province: address.state || address.province || '',
      country: address.country || 'España'
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      street: '',
      number: '',
      city: '',
      postalCode: '',
      province: '',
      country: 'España'
    };
  }
}

/**
 * Calculate centroid of a polygon
 * Note: GeoJSON uses [lon, lat] order
 */
export function calculateCentroid(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }

  let sumLon = 0;
  let sumLat = 0;

  coordinates.forEach(([lon, lat]) => {
    sumLon += lon;
    sumLat += lat;
  });

  return [
    sumLon / coordinates.length,
    sumLat / coordinates.length
  ];
}

/**
 * Calculate area of a polygon in square meters
 * Uses @turf/area for accurate calculation
 * Note: GeoJSON coordinates are in [lon, lat] order
 */
export function calculatePolygonArea(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }

  try {
    // Ensure the polygon is closed (first and last coordinates must be identical)
    let coords = coordinates;
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords = [...coordinates, first];
    }
    
    // Create a turf polygon from coordinates
    const polygon = turf.polygon([coords]);
    
    // Calculate area in square meters
    const area = turf.area(polygon);
    
    return Math.round(area * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0;
  }
}

/**
 * Calculate perimeter of a polygon in meters
 * Note: GeoJSON coordinates are in [lon, lat] order
 */
export function calculatePerimeter(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }

  let perimeter = 0;
  const R = 6371000; // Earth's radius in meters

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lon1 = coordinates[i][0] * Math.PI / 180;
    const lat1 = coordinates[i][1] * Math.PI / 180;
    const lon2 = coordinates[j][0] * Math.PI / 180;
    const lat2 = coordinates[j][1] * Math.PI / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    perimeter += R * c;
  }

  return Math.round(perimeter * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate predominant orientation of a polygon
 * Returns cardinal/intercardinal direction
 * Note: GeoJSON coordinates are in [lon, lat] order
 */
export function calculateOrientation(coordinates: [number, number][]): string {
  if (!coordinates || coordinates.length < 3) {
    return 'Desconocido';
  }

  // Find the longest edge
  let maxLength = 0;
  let maxEdgeIndex = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lon1 = coordinates[i][0];
    const lat1 = coordinates[i][1];
    const lon2 = coordinates[j][0];
    const lat2 = coordinates[j][1];

    const dLon = lon2 - lon1;
    const dLat = lat2 - lat1;
    const length = Math.sqrt(dLon * dLon + dLat * dLat);

    if (length > maxLength) {
      maxLength = length;
      maxEdgeIndex = i;
    }
  }

  // Calculate angle of the longest edge
  const j = (maxEdgeIndex + 1) % coordinates.length;
  const dLon = coordinates[j][0] - coordinates[maxEdgeIndex][0];
  const dLat = coordinates[j][1] - coordinates[maxEdgeIndex][1];
  
  let angle = Math.atan2(dLon, dLat) * 180 / Math.PI;
  if (angle < 0) angle += 360;

  // Convert angle to cardinal/intercardinal direction
  if (angle >= 337.5 || angle < 22.5) return 'Norte';
  if (angle >= 22.5 && angle < 67.5) return 'Noreste';
  if (angle >= 67.5 && angle < 112.5) return 'Este';
  if (angle >= 112.5 && angle < 157.5) return 'Sureste';
  if (angle >= 157.5 && angle < 202.5) return 'Sur';
  if (angle >= 202.5 && angle < 247.5) return 'Suroeste';
  if (angle >= 247.5 && angle < 292.5) return 'Oeste';
  if (angle >= 292.5 && angle < 337.5) return 'Noroeste';

  return 'Desconocido';
}

// ============================================================================
// AI ANALYSIS FUNCTIONS
// ============================================================================

/**
 * AI Analysis Result interface
 */
export interface AIAnalysisResult {
  tipo_cubierta: 'plana' | 'inclinada' | 'mixta' | 'desconocido';
  estado_conservacion: 'excelente' | 'bueno' | 'regular' | 'malo' | 'muy_malo';
  inclinacion_estimada: number;
  obstrucciones: Array<{
    tipo: string;
    descripcion: string;
  }>;
  confianza: number;
  notas_ia: string;
  error?: string;
}

/**
 * Capture satellite image of rooftop area
 * Uses Google Static Maps API for satellite imagery
 */
export async function captureRooftopImage(
  coordinates: { type: 'Polygon'; coordinates: [number, number][][] }
): Promise<string> {
  // Calculate bounds and center from polygon
  const coords = coordinates.coordinates[0];
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  
  // Use Google Static Maps API with satellite view
  const width = 512;
  const height = 512;
  const zoom = 20; // High detail for rooftop analysis
  
  // Get API key from environment variable
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured. Using placeholder URL.');
    // Return a placeholder URL for development
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="%23ddd" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" font-size="16">Satellite Image Placeholder</text></svg>`;
  }
  
  // Create polygon path for Google Maps
  const pathCoords = coords.map(c => `${c[1]},${c[0]}`).join('|');
  
  const url = `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${centerLat},${centerLon}&` +
    `zoom=${zoom}&` +
    `size=${width}x${height}&` +
    `maptype=satellite&` +
    `path=color:0x00ff00ff|weight:2|${pathCoords}&` +
    `key=${GOOGLE_MAPS_API_KEY}`;
  
  return url;
}

/**
 * Analyze rooftop with AI
 */
export async function analyzeRooftopWithAI(data: {
  coordinates: { type: 'Polygon'; coordinates: [number, number][][] };
  imageUrl: string;
  area_m2: number;
  orientacion: string;
}): Promise<AIAnalysisResult> {
  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/inspecciones/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing rooftop:', error);
    // Return fallback result
    return {
      tipo_cubierta: 'desconocido',
      estado_conservacion: 'bueno',
      inclinacion_estimada: 0,
      obstrucciones: [],
      confianza: 0,
      notas_ia: 'Error al conectar con el servicio de IA. Se requiere inspección manual.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch analyze multiple rooftops
 */
export async function batchAnalyzeRooftops(
  rooftops: Array<{
    coordinates: { type: 'Polygon'; coordinates: [number, number][][] };
    imageUrl: string;
    area_m2: number;
    orientacion: string;
  }>
): Promise<AIAnalysisResult[]> {
  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/inspecciones/analyze-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rooftops })
    });
    
    if (!response.ok) {
      throw new Error(`Batch analysis failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error in batch analysis:', error);
    // Return fallback results for all rooftops
    return rooftops.map(() => ({
      tipo_cubierta: 'desconocido',
      estado_conservacion: 'bueno',
      inclinacion_estimada: 0,
      obstrucciones: [],
      confianza: 0,
      notas_ia: 'Error al conectar con el servicio de IA. Se requiere inspección manual.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

/**
 * Save multiple inspections at once
 */
export async function batchSaveInspecciones(
  inspecciones: InspeccionTejado[]
): Promise<string[]> {
  const ids: string[] = [];
  
  for (const inspeccion of inspecciones) {
    try {
      const saved = await saveInspeccion(inspeccion);
      ids.push(saved.id!);
    } catch (error) {
      console.error('Error saving inspection:', error);
      throw error;
    }
  }
  
  return ids;
}
