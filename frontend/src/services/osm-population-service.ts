/**
 * OSM Population Service
 * Module A: Population Benefited
 * 
 * Uses OpenStreetMap Overpass API to calculate population impact
 * and beneficiaries for urban regeneration projects.
 */

interface PopulationData {
  densidad_hab_km2: number;
  edificio_viviendas: number;
  edificio_personas: number;
  beneficiarios_50m: number;
  beneficiarios_200m: number;
  coste_por_persona: number;
}

interface OverpassBuilding {
  type: string;
  id: number;
  tags?: {
    'building:levels'?: string;
    'building:flats'?: string;
    building?: string;
  };
  geometry?: Array<{ lat: number; lon: number }>;
}

/**
 * Calculate population impact for a given area
 * 
 * @param coordinates Polygon coordinates [[lat, lon], ...]
 * @param costeTotal Total project cost in EUR
 * @returns Population data with beneficiary estimates
 */
export async function calculatePopulationImpact(
  coordinates: [number, number][],
  costeTotal: number
): Promise<PopulationData> {
  const center = calculatePolygonCenter(coordinates);
  const [lat, lon] = center;

  try {
    // Query Overpass API for residential buildings in different radii
    const buildings50m = await queryOverpassBuildings(lat, lon, 50);
    const buildings200m = await queryOverpassBuildings(lat, lon, 200);

    // Estimate housing units
    const viviendas50m = estimateHousing(buildings50m);
    const viviendas200m = estimateHousing(buildings200m);
    
    // Estimate persons (average 2.5 persons/household in Spain)
    const personas50m = viviendas50m * 2.5;
    const personas200m = viviendas200m * 2.5;

    // Calculate neighborhood density (1 km² area)
    const densidad = await calculateDensity(lat, lon);

    // Calculate average units per building
    const avgViviendas = buildings50m.length > 0 
      ? Math.round(viviendas50m / buildings50m.length) 
      : 40;

    return {
      densidad_hab_km2: Math.round(densidad),
      edificio_viviendas: avgViviendas,
      edificio_personas: Math.round(personas50m / buildings50m.length) || 100,
      beneficiarios_50m: Math.round(personas50m),
      beneficiarios_200m: Math.round(personas200m),
      coste_por_persona: Math.round(costeTotal / personas50m) || 0
    };
  } catch (error) {
    console.warn('OSM API error, using estimates:', error);
    // Fallback to estimates if API fails
    return {
      densidad_hab_km2: 12000,
      edificio_viviendas: 40,
      edificio_personas: 100,
      beneficiarios_50m: 400,
      beneficiarios_200m: 2400,
      coste_por_persona: Math.round(costeTotal / 400) || 0
    };
  }
}

/**
 * Query Overpass API for residential buildings in a radius
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param radius Radius in meters
 * @returns Array of building elements
 */
async function queryOverpassBuildings(
  lat: number, 
  lon: number, 
  radius: number
): Promise<OverpassBuilding[]> {
  const query = `
    [out:json][timeout:10];
    (
      way["building"="residential"](around:${radius},${lat},${lon});
      way["building"="apartments"](around:${radius},${lat},${lon});
      way["building"="house"](around:${radius},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
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
 * Estimate total housing units from OSM building data
 * 
 * @param buildings Array of OSM building elements
 * @returns Estimated number of housing units
 */
function estimateHousing(buildings: OverpassBuilding[]): number {
  return buildings.reduce((sum, building) => {
    // Try to get building levels from OSM tags
    const levels = building.tags?.['building:levels'] 
      ? parseInt(building.tags['building:levels']) 
      : 3; // default 3 floors
    
    // Try to get units per floor from OSM tags
    const unitsPerFloor = building.tags?.['building:flats']
      ? parseInt(building.tags['building:flats'])
      : 2; // default 2 units per floor
    
    return sum + (levels * unitsPerFloor);
  }, 0);
}

/**
 * Calculate population density in a 1 km² area
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns Estimated density in hab/km²
 */
async function calculateDensity(lat: number, lon: number): Promise<number> {
  try {
    // Query 1 km radius area
    const buildings = await queryOverpassBuildings(lat, lon, 1000);
    const totalViviendas = estimateHousing(buildings);
    const totalPersonas = totalViviendas * 2.5;
    
    // Density per km²
    return totalPersonas;
  } catch (error) {
    console.warn('Density calculation error, using default:', error);
    // Default density for Madrid city center
    return 12000;
  }
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
