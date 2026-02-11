/**
 * Green Deficit Service
 * Module B: Green Space Deficit Analysis
 * 
 * Uses OpenStreetMap to calculate green space deficits
 * and compare against WHO recommendations.
 */

// Constants
const DEFAULT_GREEN_SPACE_M2_HAB_MADRID = 6.2; // Madrid's average green space per capita
const WHO_MINIMUM_GREEN_SPACE_M2_HAB = 9.0; // WHO recommendation

interface GreenDeficitData {
  verde_actual_m2_hab: number;
  oms_minimo: number;
  deficit: number;
  con_cubierta_m2_hab: number;
  mejora_pct: number;
  prioridad: 'alta' | 'media' | 'baja';
}

interface OverpassGreenSpace {
  type: string;
  id: number;
  tags?: {
    leisure?: string;
    landuse?: string;
    natural?: string;
  };
  geometry?: Array<{ lat: number; lon: number }>;
}

/**
 * Calculate green space deficit for an area
 * 
 * @param coordinates Polygon coordinates [[lat, lon], ...]
 * @param areaCubierta Area of the new green roof in m²
 * @param poblacion Estimated population affected
 * @returns Green deficit analysis data
 */
export async function calculateGreenDeficit(
  coordinates: [number, number][],
  areaCubierta: number,
  poblacion: number
): Promise<GreenDeficitData> {
  const center = calculatePolygonCenter(coordinates);
  const [lat, lon] = center;

  try {
    // Query OSM for green spaces in 1km radius
    const greenSpaces = await queryGreenSpaces(lat, lon, 1000);
    
    // Calculate total green area
    const totalGreenArea = greenSpaces.reduce((sum, space) => {
      return sum + calculateArea(space.geometry || []);
    }, 0);

    // m²/hab current
    const verdeActual = poblacion > 0 ? totalGreenArea / poblacion : DEFAULT_GREEN_SPACE_M2_HAB_MADRID;
    
    // WHO recommends minimum 9 m²/hab
    const omsMinimo = WHO_MINIMUM_GREEN_SPACE_M2_HAB;
    const deficit = verdeActual - omsMinimo;
    
    // With new green roof
    const conCubierta = poblacion > 0 
      ? (totalGreenArea + areaCubierta) / poblacion 
      : verdeActual + (areaCubierta / 100);
    
    const mejora = verdeActual > 0 
      ? ((conCubierta - verdeActual) / verdeActual) * 100 
      : 0;

    // Priority based on deficit
    let prioridad: 'alta' | 'media' | 'baja';
    if (verdeActual < 3) prioridad = 'alta';
    else if (verdeActual < 6) prioridad = 'media';
    else prioridad = 'baja';

    return {
      verde_actual_m2_hab: parseFloat(verdeActual.toFixed(2)),
      oms_minimo: omsMinimo,
      deficit: parseFloat(deficit.toFixed(2)),
      con_cubierta_m2_hab: parseFloat(conCubierta.toFixed(2)),
      mejora_pct: parseFloat(mejora.toFixed(1)),
      prioridad
    };
  } catch (error) {
    console.warn('Green space query error, using estimates:', error);
    // Fallback to Madrid averages
    const verdeActual = DEFAULT_GREEN_SPACE_M2_HAB_MADRID;
    const omsMinimo = WHO_MINIMUM_GREEN_SPACE_M2_HAB;
    const deficit = verdeActual - omsMinimo;
    const conCubierta = poblacion > 0 
      ? verdeActual + (areaCubierta / poblacion) 
      : verdeActual + 0.5;
    const mejora = ((conCubierta - verdeActual) / verdeActual) * 100;

    return {
      verde_actual_m2_hab: verdeActual,
      oms_minimo: omsMinimo,
      deficit: parseFloat(deficit.toFixed(2)),
      con_cubierta_m2_hab: parseFloat(conCubierta.toFixed(2)),
      mejora_pct: parseFloat(mejora.toFixed(1)),
      prioridad: 'media'
    };
  }
}

/**
 * Query Overpass API for green spaces in a radius
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param radius Radius in meters
 * @returns Array of green space elements
 */
async function queryGreenSpaces(
  lat: number, 
  lon: number, 
  radius: number
): Promise<OverpassGreenSpace[]> {
  const query = `
    [out:json][timeout:10];
    (
      way["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="garden"](around:${radius},${lat},${lon});
      way["landuse"="grass"](around:${radius},${lat},${lon});
      way["landuse"="meadow"](around:${radius},${lat},${lon});
      way["natural"="wood"](around:${radius},${lat},${lon});
      way["natural"="grassland"](around:${radius},${lat},${lon});
    );
    out geom;
  `;
  
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.elements || [];
}

/**
 * Calculate area of a polygon from OSM geometry
 * Uses Shoelace formula for geographic coordinates
 * 
 * @param geometry Array of coordinate points
 * @returns Area in m²
 */
function calculateArea(geometry: Array<{ lat: number; lon: number }>): number {
  if (!geometry || geometry.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const p1 = geometry[i];
    const p2 = geometry[i + 1];
    area += (p2.lon - p1.lon) * (p2.lat + p1.lat);
  }
  
  // Convert to m² (approximation for geographic coordinates)
  // 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(lat)
  const avgLat = geometry.reduce((sum, p) => sum + p.lat, 0) / geometry.length;
  const latFactor = 111000; // meters per degree latitude
  const lonFactor = 111000 * Math.cos(avgLat * Math.PI / 180); // meters per degree longitude
  
  return Math.abs(area) * latFactor * lonFactor / 2;
}

/**
 * Calculate the center point (centroid) of a polygon
 * 
 * @param coords Array of [lat, lon] coordinates
 * @returns Center point as [lat, lon]
 */
function calculatePolygonCenter(coords: [number, number][]): [number, number] {
  const sumLat = coords.reduce((sum, [lat]) => sum + lat, 0);
  const sumLon = coords.reduce((sum, [, lon]) => sum + lon, 0);
  return [sumLat / coords.length, sumLon / coords.length];
}
