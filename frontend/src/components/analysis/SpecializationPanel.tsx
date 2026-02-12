/**
 * SpecializationPanel Component
 * 
 * Displays grid of 6 specialization types with ability to generate
 * specialized analysis for each type
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Construction, 
  Square, 
  Trees, 
  Building2, 
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  TipoEspecializacion, 
  TIPOS_ESPECIALIZACION,
  AnalisisEspecializado 
} from '../../types';
import { 
  getSpecializationsByAnalisisId,
  hasSpecializationType 
} from '../../services/specialization-service';

interface SpecializationPanelProps {
  analisisId: string;
  baseAnalysis: {
    area_m2: number;
    green_score: number;
    especies_recomendadas: any[];
    presupuesto_eur?: number;
  };
  onSelectType: (tipo: TipoEspecializacion) => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Construction,
  Square,
  Trees,
  Building2,
  MoreHorizontal,
};

export const SpecializationPanel: React.FC<SpecializationPanelProps> = ({
  analisisId,
  baseAnalysis,
  onSelectType,
}) => {
  const [existingTypes, setExistingTypes] = useState<Set<TipoEspecializacion>>(new Set());
  const [loadingTypes, setLoadingTypes] = useState<Set<TipoEspecializacion>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);

  // Load existing specializations on mount
  useEffect(() => {
    loadExistingSpecializations();
  }, [analisisId]);

  const loadExistingSpecializations = async () => {
    try {
      setLoading(true);
      const specializations = await getSpecializationsByAnalisisId(analisisId);
      const types = new Set(specializations.map(s => s.tipo_especializacion));
      setExistingTypes(types);
    } catch (error) {
      console.error('Error loading specializations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeClick = async (tipo: TipoEspecializacion) => {
    // Check if already exists
    if (existingTypes.has(tipo)) {
      // Already generated - could navigate to it or show details
      console.log('Especialización ya generada:', tipo);
      return;
    }

    // Mark as loading
    setLoadingTypes(prev => new Set(prev).add(tipo));

    try {
      // Call parent handler
      onSelectType(tipo);
      
      // Refresh existing types
      await loadExistingSpecializations();
    } catch (error) {
      console.error('Error generating specialization:', error);
    } finally {
      setLoadingTypes(prev => {
        const next = new Set(prev);
        next.delete(tipo);
        return next;
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon || MoreHorizontal;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Análisis Especializados
        </h2>
        <p className="text-gray-600 mt-1">
          Selecciona el tipo de especialización para análisis más detallado
        </p>
      </div>

      {/* Info Banner */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>✅ Tejado/Azotea implementado:</strong> Análisis especializado con cálculos 
              estructurales CTE, detección de obstáculos y presupuesto ajustado. 
              Los demás tipos se implementarán en PR3.
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Base Analysis Summary */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Resumen del Análisis Base
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600">Área</div>
            <div className="text-lg font-bold text-gray-900">
              {baseAnalysis.area_m2.toLocaleString('es-ES')} m²
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Green Score</div>
            <div className="text-lg font-bold text-green-600">
              {baseAnalysis.green_score.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Especies</div>
            <div className="text-lg font-bold text-gray-900">
              {baseAnalysis.especies_recomendadas.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Presupuesto Base</div>
            <div className="text-lg font-bold text-gray-900">
              {baseAnalysis.presupuesto_eur 
                ? `${(baseAnalysis.presupuesto_eur / 1000).toFixed(1)}k €`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Specialization Types Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPOS_ESPECIALIZACION.map((tipo) => {
            const Icon = getIconComponent(tipo.icon);
            const isGenerated = existingTypes.has(tipo.id);
            const isLoading = loadingTypes.has(tipo.id);

            return (
              <button
                key={tipo.id}
                onClick={() => handleTypeClick(tipo.id)}
                disabled={isLoading}
                className={`
                  relative p-5 rounded-lg border-2 transition-all text-left
                  ${isGenerated 
                    ? 'border-green-500 bg-green-50 hover:bg-green-100' 
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  disabled:cursor-not-allowed
                `}
              >
                {/* Status Badge */}
                {isGenerated && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                )}

                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute top-3 right-3">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                  </div>
                )}

                {/* Icon and Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${tipo.color} bg-opacity-10`}>
                    <Icon 
                      className={`${tipo.color.replace('bg-', 'text-')}`} 
                      size={24} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {tipo.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {tipo.descripcion}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tipo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Status Text */}
                <div className="text-sm font-medium mt-2">
                  {isLoading ? (
                    <span className="text-blue-600">Generando...</span>
                  ) : isGenerated ? (
                    <span className="text-green-600">✓ Ya generado</span>
                  ) : (
                    <span className="text-gray-500">Click para generar →</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Los análisis especializados heredan datos del análisis base y añaden 
        información específica según el tipo de zona
      </div>
    </div>
  );
};
