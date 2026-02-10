import React, { useState } from 'react';
import { MapPin, Map, Sparkles, ArrowRight } from 'lucide-react';
import { Area } from '../../types';

interface AnalysisWorkflowContentProps {
  areas: Area[];
  onNavigate: (view: string, data?: any) => void;
}

const AnalysisWorkflowContent: React.FC<AnalysisWorkflowContentProps> = ({
  areas,
  onNavigate
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'point' | 'zone' | null>(null);

  if (selectedMethod === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={32} />
              Análisis IA
            </h1>
            <p className="text-gray-600">
              Selecciona cómo quieres realizar el análisis de potencial verde
            </p>
          </div>

          {/* Method Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Point Analysis Card */}
            <button
              onClick={() => setSelectedMethod('point')}
              className="group bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg inline-flex mb-4 group-hover:scale-110 transition-transform">
                <MapPin size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analizar punto específico
              </h3>
              <p className="text-gray-600 mb-4">
                Haz clic en cualquier punto del mapa para analizar su potencial de reforestación
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                Comenzar análisis
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Zone Analysis Card */}
            <button
              onClick={() => setSelectedMethod('zone')}
              className="group bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-green-500 hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg inline-flex mb-4 group-hover:scale-110 transition-transform">
                <Map size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analizar zona existente
              </h3>
              <p className="text-gray-600 mb-4">
                Selecciona una zona que hayas guardado para obtener un análisis detallado
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
                Ver zonas disponibles
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">¿Qué obtendrás?</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Green Score: Puntuación del potencial verde del área</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Especies recomendadas adaptadas al clima y condiciones</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Recomendaciones específicas para maximizar el éxito</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMethod === 'point') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
            >
              ← Volver a selección
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Análisis de punto específico
            </h1>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="bg-blue-100 text-blue-600 p-6 rounded-full inline-flex mb-6">
              <MapPin size={64} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Modo de análisis activado
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Esta funcionalidad se integrará con el mapa interactivo. Haz clic en el mapa para seleccionar un punto y obtener su análisis.
            </p>
            <button
              onClick={() => onNavigate('analisis')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ir al mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMethod === 'zone') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-green-600 hover:text-green-700 font-medium mb-4 flex items-center"
            >
              ← Volver a selección
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selecciona una zona para analizar
            </h1>
            <p className="text-gray-600">
              Elige una de tus zonas guardadas para obtener un análisis detallado
            </p>
          </div>

          {areas.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Map size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay zonas disponibles
              </h3>
              <p className="text-gray-600 mb-6">
                Necesitas crear al menos una zona antes de poder analizarla
              </p>
              <button
                onClick={() => onNavigate('zonas-create')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Crear una zona
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => alert(`Analizando zona: ${area.nombre}\n(Funcionalidad próximamente)`)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-green-500 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{area.nombre}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="mr-1" />
                    <span>{area.areaM2.toFixed(2)} m²</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {area.tipo.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AnalysisWorkflowContent;
