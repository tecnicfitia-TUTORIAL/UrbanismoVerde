import React from 'react';
import { ArrowLeft, Building2, Layers, CheckCircle, AlertCircle } from 'lucide-react';
import { SpecializedAnalysisWithZone } from '../../services/specialized-analysis-service';
import Breadcrumbs from '../common/Breadcrumbs';

interface SpecializedAnalysisDetailProps {
  analysis: SpecializedAnalysisWithZone;
  onBack: () => void;
}

const SpecializedAnalysisDetail: React.FC<SpecializedAnalysisDetailProps> = ({
  analysis,
  onBack
}) => {
  const breadcrumbItems = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Análisis Especializados', path: 'analisis-especializados' },
    { label: getSpecializationLabel(analysis.tipo_especializacion) }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Análisis de {getSpecializationLabel(analysis.tipo_especializacion)}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-lg text-gray-600">
                    {analysis.analisis?.zonas_verdes?.nombre || analysis.zona_verde?.nombre || 'Zona sin nombre'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getViabilityColor(analysis.viabilidad_final)}`}>
                    {analysis.viabilidad_final?.toUpperCase() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Base Data */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Datos Base</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Área Base</div>
                <div className="text-2xl font-bold text-blue-900">
                  {analysis.area_base_m2?.toLocaleString('es-ES')} m²
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Green Score Base</div>
                <div className="text-2xl font-bold text-green-900">
                  {analysis.green_score_base}/100
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-700 mb-1">Presupuesto Base</div>
                <div className="text-2xl font-bold text-purple-900">
                  €{analysis.presupuesto_base_eur?.toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          </div>

          {/* Viabilities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Viabilidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Técnica', value: analysis.viabilidad_tecnica },
                { label: 'Económica', value: analysis.viabilidad_economica },
                { label: 'Normativa', value: analysis.viabilidad_normativa },
                { label: 'Final', value: analysis.viabilidad_final }
              ].map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-2">{item.label}</div>
                  <div className={`text-lg font-bold ${getViabilityTextColor(item.value)}`}>
                    {item.value?.toUpperCase() || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Presupuesto Total</h2>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <div className="text-4xl font-bold text-purple-900 mb-2">
                €{analysis.presupuesto_total_eur?.toLocaleString('es-ES')}
              </div>
              <div className="text-sm text-purple-700">
                Incremento vs base: €{analysis.incremento_vs_base_eur?.toLocaleString('es-ES')} 
                ({analysis.incremento_vs_base_porcentaje?.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Specific Characteristics */}
          {analysis.caracteristicas_especificas && Object.keys(analysis.caracteristicas_especificas).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Características Específicas</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(analysis.caracteristicas_especificas, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Notes */}
          {analysis.notas && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Notas</h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{analysis.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getSpecializationLabel(type: string): string {
  const labels: Record<string, string> = {
    tejado: 'Tejado Verde',
    fachada: 'Fachada Verde',
    muro: 'Muro Verde',
    parque: 'Parque Urbano',
    zona_abandonada: 'Zona Abandonada',
    solar_vacio: 'Solar Vacío',
    parque_degradado: 'Parque Degradado',
    jardin_vertical: 'Jardín Vertical',
    otro: 'Otro'
  };
  return labels[type] || type;
}

function getViabilityColor(viability: string | undefined): string {
  if (!viability) return 'bg-gray-100 text-gray-800';
  switch (viability) {
    case 'alta': return 'bg-green-100 text-green-800';
    case 'media': return 'bg-yellow-100 text-yellow-800';
    case 'baja': return 'bg-orange-100 text-orange-800';
    case 'nula': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getViabilityTextColor(viability: string | undefined): string {
  if (!viability) return 'text-gray-700';
  switch (viability) {
    case 'alta': return 'text-green-700';
    case 'media': return 'text-yellow-700';
    case 'baja': return 'text-orange-700';
    case 'nula': return 'text-red-700';
    default: return 'text-gray-700';
  }
}

export default SpecializedAnalysisDetail;
