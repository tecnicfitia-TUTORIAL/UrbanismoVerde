const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface AnalyzeRequest {
  coordenadas: Array<{ lat: number; lon: number }>;
  municipio_id?: string;
}

export interface AnalyzeResponse {
  viabilidad: 'alta' | 'media' | 'baja' | 'nula';
  area_m2: number;
  tipo_suelo_detectado: string;
  exposicion_solar: number;
  especies_recomendadas: Array<{
    nombre_comun: string;
    nombre_cientifico: string;
    viabilidad: number;
  }>;
  coste_estimado: number;
  notas: string;
}

export const api = {
  async analyzeZone(coords: Array<{ lat: number; lon: number }>): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordenadas: coords })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
};

// Función para enviar polígono al servicio de IA
export const analyzeGreenScore = async (
  coordinates: [number, number][]
): Promise<{ green_score: number; recommendations: string[] }> => {
  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
  
  // Construir GeoJSON - convertir de [lat, lon] a [lon, lat] para GeoJSON
  // GeoJSON Polygon requiere un array de anillos (rings), donde cada anillo es un array de coordenadas
  const geojson = {
    type: 'Polygon',
    coordinates: [coordinates.map(coord => [coord[1], coord[0]])]
  };
  
  const response = await fetch(`${AI_SERVICE_URL}/api/analyze-green-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon: geojson })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};
