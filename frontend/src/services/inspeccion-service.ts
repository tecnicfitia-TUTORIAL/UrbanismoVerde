import { supabase, TABLES } from '../config/supabase';
import { InspeccionTejado } from '../types';

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
      zona_verde_id: data.zona_verde_id
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
 */
export function calculateCentroid(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }

  let sumLat = 0;
  let sumLon = 0;

  coordinates.forEach(([lat, lon]) => {
    sumLat += lat;
    sumLon += lon;
  });

  return [
    sumLat / coordinates.length,
    sumLon / coordinates.length
  ];
}

/**
 * Calculate area of a polygon in square meters
 * Uses the spherical excess formula for accuracy
 */
export function calculatePolygonArea(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }

  const R = 6371000; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][0] * Math.PI / 180;
    const lat2 = coordinates[j][0] * Math.PI / 180;
    const lon1 = coordinates[i][1] * Math.PI / 180;
    const lon2 = coordinates[j][1] * Math.PI / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area * R * R / 2);
  return Math.round(area * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate perimeter of a polygon in meters
 */
export function calculatePerimeter(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }

  let perimeter = 0;
  const R = 6371000; // Earth's radius in meters

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][0] * Math.PI / 180;
    const lat2 = coordinates[j][0] * Math.PI / 180;
    const lon1 = coordinates[i][1] * Math.PI / 180;
    const lon2 = coordinates[j][1] * Math.PI / 180;

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
    const lat1 = coordinates[i][0];
    const lon1 = coordinates[i][1];
    const lat2 = coordinates[j][0];
    const lon2 = coordinates[j][1];

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const length = Math.sqrt(dLat * dLat + dLon * dLon);

    if (length > maxLength) {
      maxLength = length;
      maxEdgeIndex = i;
    }
  }

  // Calculate angle of the longest edge
  const j = (maxEdgeIndex + 1) % coordinates.length;
  const dLat = coordinates[j][0] - coordinates[maxEdgeIndex][0];
  const dLon = coordinates[j][1] - coordinates[maxEdgeIndex][1];
  
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
