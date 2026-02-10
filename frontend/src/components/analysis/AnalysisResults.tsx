/**
 * AnalysisResults Component
 * 
 * Displays AI analysis results including green score, area, species recommendations,
 * and maintenance recommendations
 */

import React from 'react';
import { AnalysisResponse } from '../../types';
import { X, TrendingUp, MapPin, AlertTriangle, Leaf, Wrench, DollarSign, Clock } from 'lucide-react';

interface AnalysisResultsProps {
  /** Analysis result data */
  analysis: AnalysisResponse;
  
  /** Callback when "Generate Budget" button is clicked */
  onGenerateBudget?: () => void;
  
  /** Callback when close button is clicked */
  onClose?: () => void;
}

/**
 * Get color class based on green score
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

/**
 * Get score label based on value
 */
function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excelente';
  if (score >= 40) return 'Bueno';
  return 'Necesita mejoras';
}

/**
 * Format area for display
 */
function formatArea(area_m2: number): string {
  if (area_m2 >= 10000) {
    return `${(area_m2 / 10000).toFixed(2)} ha`;
  }
  return `${area_m2.toFixed(2)} m²`;
}

/**
 * Get viability color
 */
function getViabilityColor(viability: number): string {
  if (viability >= 0.8) return 'text-green-600';
  if (viability >= 0.6) return 'text-yellow-600';
  return 'text-orange-600';
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onGenerateBudget,
  onClose
}) => {
  const scoreColor = getScoreColor(analysis.green_score);
  const scoreLabel = getScoreLabel(analysis.green_score);

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Análisis Completado
          </h2>
          <p className="text-green-100 text-sm mt-1">
            Resultados del análisis con IA
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Green Score */}
        <div className={`border-2 rounded-lg p-4 ${scoreColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium opacity-80">Índice de Verdor</div>
              <div className="text-3xl font-bold mt-1">
                {analysis.green_score}/100
              </div>
              <div className="text-sm mt-1">{scoreLabel}</div>
            </div>
            <div className="text-6xl opacity-20">
              <Leaf />
            </div>
          </div>
        </div>

        {/* Area and Perimeter */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Área</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatArea(analysis.area_m2)}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Perímetro</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {analysis.perimetro_m.toFixed(2)} m
            </div>
          </div>
        </div>

        {/* Tags / Characteristics */}
        {analysis.tags && analysis.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <AlertTriangle className="w-5 h-5" />
              Características Detectadas
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Species */}
        {analysis.especies_recomendadas && analysis.especies_recomendadas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Leaf className="w-5 h-5" />
              Especies Recomendadas
            </div>
            <div className="space-y-3">
              {analysis.especies_recomendadas.map((especie, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {especie.nombre_comun}
                      </div>
                      <div className="text-sm text-gray-600 italic">
                        {especie.nombre_cientifico}
                      </div>
                      <div className="text-sm text-gray-700 mt-2">
                        {especie.razon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getViabilityColor(especie.viabilidad)}`}
                      >
                        {(especie.viabilidad * 100).toFixed(0)}% viable
                      </span>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {especie.tipo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recomendaciones && analysis.recomendaciones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Wrench className="w-5 h-5" />
              Recomendaciones de Mantenimiento
            </div>
            <ul className="space-y-2">
              {analysis.recomendaciones.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-green-600 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Processing Time */}
        <div className="flex items-center gap-2 text-gray-500 text-sm pt-2 border-t">
          <Clock className="w-4 h-4" />
          <span>Procesado en {analysis.processing_time.toFixed(2)}s</span>
        </div>
      </div>

      {/* Footer with action buttons */}
      {onGenerateBudget && (
        <div className="border-t bg-gray-50 p-6">
          <button
            onClick={onGenerateBudget}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Generar Presupuesto
          </button>
          <p className="text-center text-sm text-gray-600 mt-2">
            Calcula el coste de implementación basado en este análisis
          </p>
        </div>
      )}
    </div>
  );
};
