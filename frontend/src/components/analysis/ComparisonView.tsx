/**
 * ComparisonView Component
 * 
 * Side-by-side comparison of Base Analysis vs Specialized Analysis
 * Shows cost breakdown, recommendations, warnings, and viability indicators
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Info,
  DollarSign,
  Shield,
  Scale,
  Building
} from 'lucide-react';
import { AnalisisEspecializado } from '../../types';

interface ComparisonViewProps {
  especializado: AnalisisEspecializado;
  onClose?: () => void;
}

// Viability color mapping
const viabilityColors = {
  alta: 'text-green-600 bg-green-50 border-green-200',
  media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  baja: 'text-orange-600 bg-orange-50 border-orange-200',
  nula: 'text-red-600 bg-red-50 border-red-200',
};

const viabilityIcons = {
  alta: CheckCircle2,
  media: Info,
  baja: AlertTriangle,
  nula: XCircle,
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  especializado,
  onClose,
}) => {
  const { 
    caracteristicas_especificas,
    analisis_adicional,
    presupuesto_adicional,
    area_base_m2,
    green_score_base,
    presupuesto_base_eur,
    presupuesto_total_eur,
    incremento_vs_base_eur,
    incremento_vs_base_porcentaje,
    viabilidad_tecnica,
    viabilidad_economica,
    viabilidad_normativa,
    viabilidad_final,
    tipo_especializacion,
  } = especializado;

  const deteccion = caracteristicas_especificas?.deteccion_edificio;
  const tejado = caracteristicas_especificas?.caracteristicas_tejado;
  const obstaculos = caracteristicas_especificas?.analisis_obstaculos;
  const estructural = analisis_adicional?.calculo_estructural_cte;
  const recomendaciones = analisis_adicional?.recomendaciones || [];
  const advertencias = analisis_adicional?.advertencias || [];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Análisis Especializado: {tipo_especializacion === 'tejado' ? 'Tejado/Azotea' : 
                tipo_especializacion === 'zona_abandonada' ? 'Zona Abandonada' :
                tipo_especializacion === 'solar_vacio' ? 'Solar Vacío' :
                tipo_especializacion === 'parque_degradado' ? 'Parque Degradado' :
                tipo_especializacion === 'jardin_vertical' ? 'Jardín Vertical' : 'Personalizado'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Comparativa con análisis base y desglose de costes adicionales
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Viability Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ViabilityCard
              title="Técnica"
              viability={viabilidad_tecnica}
              icon={Building}
            />
            <ViabilityCard
              title="Económica"
              viability={viabilidad_economica}
              icon={DollarSign}
            />
            <ViabilityCard
              title="Normativa"
              viability={viabilidad_normativa}
              icon={Scale}
            />
            <ViabilityCard
              title="Final"
              viability={viabilidad_final}
              icon={Shield}
              highlighted
            />
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Analysis */}
            <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                Análisis Base
              </h3>
              <div className="space-y-3">
                <DataRow label="Área" value={`${area_base_m2.toLocaleString('es-ES')} m²`} />
                <DataRow label="Green Score" value={green_score_base.toFixed(1)} />
                <DataRow
                  label="Presupuesto"
                  value={`${(presupuesto_base_eur || 0).toLocaleString('es-ES')} €`}
                />
                <DataRow
                  label="Coste por m²"
                  value={`${((presupuesto_base_eur || 0) / area_base_m2).toFixed(2)} €/m²`}
                />
              </div>
            </div>

            {/* Specialized Analysis */}
            <div className="border-2 border-blue-400 rounded-lg p-5 bg-blue-50">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                Análisis Especializado
              </h3>
              <div className="space-y-3">
                <DataRow
                  label="Área útil"
                  value={`${obstaculos?.area_util_cubierta_verde_m2?.toFixed(1) || area_base_m2} m²`}
                />
                <DataRow
                  label="Tipo recomendado"
                  value={tejado?.tipo_verde_recomendado?.toUpperCase() || 'N/A'}
                />
                <DataRow
                  label="Presupuesto total"
                  value={`${(presupuesto_total_eur || 0).toLocaleString('es-ES')} €`}
                  emphasized
                />
                <DataRow
                  label="Incremento"
                  value={`+${(incremento_vs_base_eur || 0).toLocaleString('es-ES')} € (+${incremento_vs_base_porcentaje?.toFixed(1)}%)`}
                  trend={incremento_vs_base_porcentaje}
                />
              </div>
            </div>
          </div>

          {/* Building Detection */}
          {deteccion && (
            <div className="border rounded-lg p-5 bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🏢 Detección de Edificio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Es edificio" value={deteccion.es_edificio ? 'Sí' : 'No'} />
                <InfoItem label="Compacidad" value={deteccion.compacidad?.toFixed(3)} />
                <InfoItem label="Confianza" value={deteccion.confianza?.toUpperCase()} />
                <InfoItem label="Tipo" value={deteccion.tipo_probable} />
              </div>
            </div>
          )}

          {/* Structural Analysis */}
          {estructural && (
            <div className="border rounded-lg p-5 bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📐 Cálculo Estructural CTE</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <InfoItem
                  label="Peso cubierta verde"
                  value={`${estructural.peso_cubierta_verde_kg_m2} kg/m²`}
                />
                <InfoItem
                  label="Capacidad actual"
                  value={`${estructural.capacidad_estructural_kg_m2} kg/m²`}
                />
                <InfoItem
                  label="Margen seguridad"
                  value={`${estructural.margen_seguridad_kg_m2?.toFixed(1)} kg/m²`}
                  highlighted={estructural.margen_seguridad_kg_m2 < 0}
                />
                <InfoItem
                  label="Cumple CTE"
                  value={estructural.cumple_cte ? '✅ Sí' : '❌ No'}
                  highlighted={!estructural.cumple_cte}
                />
              </div>
              {estructural.refuerzo_estructural_necesario && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-800">
                    <strong>CRÍTICO:</strong> Se requiere refuerzo estructural obligatorio según CTE DB-SE-AE
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Costs Breakdown */}
          <div className="border rounded-lg p-5 bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Desglose de Costes Adicionales</h3>
            <div className="space-y-2">
              {presupuesto_adicional && Object.entries(presupuesto_adicional).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/_/g, ' ').replace('eur', '')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {typeof value === 'number' ? `${value.toLocaleString('es-ES')} €` : value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 border-t-2 border-blue-200 mt-3">
                <span className="text-base font-bold text-gray-900">Total Adicional</span>
                <span className="text-lg font-bold text-blue-600">
                  {(incremento_vs_base_eur || 0).toLocaleString('es-ES')} €
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recomendaciones.length > 0 && (
            <div className="border rounded-lg p-5 bg-green-50 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={20} />
                Recomendaciones
              </h3>
              <ul className="space-y-2">
                {recomendaciones.map((rec, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {advertencias.length > 0 && (
            <div className="border rounded-lg p-5 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Advertencias
              </h3>
              <ul className="space-y-2">
                {advertencias.map((warn, idx) => (
                  <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">⚠️</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            aria-label="Imprimir informe de análisis especializado"
          >
            Imprimir Informe
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Components

interface ViabilityCardProps {
  title: string;
  viability?: 'alta' | 'media' | 'baja' | 'nula';
  icon: React.ComponentType<any>;
  highlighted?: boolean;
}

const ViabilityCard: React.FC<ViabilityCardProps> = ({
  title,
  viability = 'nula',
  icon: Icon,
  highlighted = false,
}) => {
  const colorClass = viabilityColors[viability];
  const IconComponent = viabilityIcons[viability];

  return (
    <div
      className={`border-2 rounded-lg p-4 ${colorClass} ${
        highlighted ? 'ring-2 ring-offset-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} />
        <span className="text-xs font-medium opacity-80">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <IconComponent size={20} />
        <span className="text-lg font-bold capitalize">{viability}</span>
      </div>
    </div>
  );
};

interface DataRowProps {
  label: string;
  value: string | number;
  emphasized?: boolean;
  trend?: number;
}

const DataRow: React.FC<DataRowProps> = ({ label, value, emphasized, trend }) => {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : null;

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm ${
          emphasized ? 'font-bold text-blue-900 text-base' : 'font-semibold text-gray-900'
        } flex items-center gap-1`}
      >
        {TrendIcon && <TrendIcon size={14} className="text-orange-500" />}
        {value}
      </span>
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value: string | number;
  highlighted?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, highlighted }) => (
  <div className={highlighted ? 'bg-yellow-50 rounded p-2' : ''}>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className={`text-sm font-semibold ${highlighted ? 'text-red-700' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);
