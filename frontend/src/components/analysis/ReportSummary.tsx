/**
 * ReportSummary Component
 * 
 * Displays a comprehensive summary panel for analysis results
 */

import React from 'react';
import { AnalysisResponse } from '../../types';
import { adaptAnalysisData } from '../../services/analysis-adapter';
import {
  TrendingUp,
  MapPin,
  Leaf,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Download,
  Save,
} from 'lucide-react';

interface ReportSummaryProps {
  analysis: AnalysisResponse;
  onSave?: () => void;
  onDownloadPDF?: () => void;
  isSaving?: boolean;
  isGeneratingPDF?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getViabilidad(score: number): string {
  if (score >= 70) return 'Alta';
  if (score >= 50) return 'Media';
  if (score >= 30) return 'Baja';
  return 'Nula';
}

function getViabilidadColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  analysis,
  onSave,
  onDownloadPDF,
  isSaving = false,
  isGeneratingPDF = false,
}) => {
  // Adaptar datos para compatibilidad retroactiva
  const adaptedAnalysis = adaptAnalysisData(analysis as any);
  
  const scoreColorClass = getScoreColor(adaptedAnalysis.green_score);
  const viabilidad = getViabilidad(adaptedAnalysis.green_score);
  const viabilidadColor = getViabilidadColor(adaptedAnalysis.green_score);

  // Extraer datos con valores seguros
  const especies = adaptedAnalysis.especies_recomendadas || [];
  const recomendaciones = adaptedAnalysis.recomendaciones || [];
  const tags = adaptedAnalysis.tags || [];
  const beneficios = adaptedAnalysis.beneficios_ecosistemicos || {
    co2_capturado_kg_anual: 0,
    ahorro_energia_eur_anual: 0
  };
  const presupuesto = adaptedAnalysis.presupuesto || {
    coste_total_inicial_eur: 0,
    mantenimiento_anual_eur: 0,
    desglose: {}
  };
  const roi_data = adaptedAnalysis.roi_ambiental || {
    roi_porcentaje: 0,
    amortizacion_anos: 0,
    ahorro_anual_eur: 0
  };

  // Use adapted values or fallback to calculated ones
  const inversionInicial = presupuesto.coste_total_inicial_eur || (adaptedAnalysis.area_m2 * 150);
  const ahorroAnual = roi_data.ahorro_anual_eur || beneficios.ahorro_energia_eur_anual || (adaptedAnalysis.area_m2 * 7.95);
  const roi = roi_data.roi_porcentaje || ((ahorroAnual / inversionInicial) * 100);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Panel Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Executive Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Resumen Ejecutivo</h3>
          </div>

          {/* Green Score */}
          <div className={`mb-4 p-4 rounded-lg border-2 ${scoreColorClass}`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {adaptedAnalysis.green_score.toFixed(1)}
              </div>
              <div className="text-sm font-medium">Green Score</div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">Área</div>
              <div className="font-semibold text-gray-900">
                {adaptedAnalysis.area_m2.toLocaleString('es-ES')} m²
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">Viabilidad</div>
              <div className={`font-semibold ${viabilidadColor}`}>{viabilidad}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">ROI Estimado</div>
              <div className="font-semibold text-gray-900">{roi.toFixed(1)}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">Perímetro</div>
              <div className="font-semibold text-gray-900">
                {adaptedAnalysis.perimetro_m.toFixed(0)} m
              </div>
            </div>
          </div>
        </div>

        {/* Species Recommendations Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Especies Recomendadas ({especies.length})
            </h3>
          </div>

          {especies.length > 0 ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {especies.slice(0, 5).map((especie, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{especie?.nombre_comun || 'N/A'}</div>
                      <div className="text-sm text-gray-600 italic">
                        {especie?.nombre_cientifico || ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{especie?.tipo || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {((especie?.viabilidad || 0) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">viabilidad</div>
                    </div>
                  </div>
                ))}
              </div>

              {especies.length > 5 && (
                <div className="mt-3 text-sm text-gray-500 text-center">
                  +{especies.length - 5} especies más
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay especies recomendadas disponibles
            </div>
          )}
        </div>

        {/* Costs & Benefits Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Costos & Beneficios</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Inversión inicial</span>
              <span className="font-semibold text-gray-900">
                €{inversionInicial.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-700">Ahorro anual</span>
              <span className="font-semibold text-green-600">
                €{ahorroAnual.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-gray-700">Subvenciones disponibles</span>
              <span className="font-semibold text-blue-600">30-50%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Amortización</span>
              <span className="font-semibold text-gray-900">
                {(inversionInicial / ahorroAnual).toFixed(1)} años
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-orange-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Recomendaciones ({recomendaciones.length})
            </h3>
          </div>

          {recomendaciones.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recomendaciones.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg text-sm"
                >
                  <CheckCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay recomendaciones disponibles
            </div>
          )}
        </div>

        {/* Characteristics Tags */}
        {tags && tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Características</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-6 bg-white border-t border-gray-200 space-y-3">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Análisis
              </>
            )}
          </button>
        )}

        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download size={20} />
                Descargar PDF
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
