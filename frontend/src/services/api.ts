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
