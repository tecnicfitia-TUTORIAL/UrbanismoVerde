import React, { useState } from 'react';
import { Brain, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { api, AnalyzeResponse } from '../../services/api';

interface AnalysisPanelProps {
  coordinates: { lat: number; lon: number } | null;
  onClose: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ coordinates, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!coordinates) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.analyzeZone([coordinates]);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar zona');
    } finally {
      setIsLoading(false);
    }
  };

  if (!coordinates) return null;

  return (
    <div className="absolute top-20 right-4 w-96 bg-white rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto z-[1000]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Punto Seleccionado
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Coordinates */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Latitud:</span> {coordinates.lat.toFixed(6)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Longitud:</span> {coordinates.lon.toFixed(6)}
        </p>
      </div>

      {/* Analyze Button */}
      {!result && !isLoading && (
        <button
          onClick={handleAnalyze}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Brain className="w-5 h-5" />
          Analizar Potencial Verde
        </button>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-center">
            Analizando imagen satelital...
            <br />
            <span className="text-sm text-gray-500">Esto puede tardar unos segundos</span>
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error al analizar</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Viability Badge */}
          <div className={`
            p-3 rounded-lg text-center font-semibold
            ${result.viabilidad === 'alta' ? 'bg-green-100 text-green-800' : ''}
            ${result.viabilidad === 'media' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${result.viabilidad === 'baja' ? 'bg-orange-100 text-orange-800' : ''}
            ${result.viabilidad === 'nula' ? 'bg-red-100 text-red-800' : ''}
          `}>
            Viabilidad: {result.viabilidad.toUpperCase()}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Área</p>
              <p className="font-semibold">{result.area_m2.toFixed(0)} m²</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600">Exposición Solar</p>
              <p className="font-semibold">{result.exposicion_solar}h/día</p>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Tipo de Suelo</p>
            <p className="text-sm text-gray-600">{result.tipo_suelo_detectado}</p>
          </div>

          {/* Recommended Species */}
          {result.especies_recomendadas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Especies Recomendadas</p>
              <ul className="space-y-2">
                {result.especies_recomendadas.map((especie, idx) => (
                  <li key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{especie.nombre_comun}</p>
                      <p className="text-xs text-gray-600 italic">{especie.nombre_cientifico}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-700">
                      {(especie.viabilidad * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cost Estimate */}
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">Coste Estimado</p>
            <p className="text-2xl font-bold text-blue-800">
              {result.coste_estimado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>

          {/* Notes */}
          {result.notas && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{result.notas}</p>
            </div>
          )}

          {/* New Analysis Button */}
          <button
            onClick={() => setResult(null)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded transition"
          >
            Nuevo Análisis
          </button>
        </div>
      )}
    </div>
  );
};
