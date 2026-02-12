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
  Wind,
  Droplets,
  Thermometer,
  Zap,
  Calculator,
  TrendingDown,
  Gift,
  Receipt,
  Users,
  TreeDeciduous,
  Target,
  Layers,
} from 'lucide-react';

interface ReportSummaryProps {
  analysis: AnalysisResponse;
  onSave?: () => void;
  onDownloadPDF?: () => void;
  onShowSpecializations?: () => void;
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
  onShowSpecializations,
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
    agua_retenida_litros_anual: 0,
    reduccion_temperatura_c: 0,
    ahorro_energia_kwh_anual: 0,
    ahorro_energia_eur_anual: 0
  };
  const presupuesto = adaptedAnalysis.presupuesto || {
    coste_total_inicial_eur: 0,
    mantenimiento_anual_eur: 0,
    coste_por_m2_eur: 0,
    vida_util_anos: 0,
    desglose: {
      sustrato_eur: 0,
      drenaje_eur: 0,
      membrana_impermeable_eur: 0,
      plantas_eur: 0,
      instalacion_eur: 0
    }
  };
  const roi_data = adaptedAnalysis.roi_ambiental || {
    roi_porcentaje: 0,
    amortizacion_anos: 0,
    ahorro_anual_eur: 0,
    ahorro_25_anos_eur: 0
  };
  const subvencion = adaptedAnalysis.subvencion || {
    elegible: false,
    porcentaje: 0,
    programa: 'N/A',
    monto_estimado_eur: 0
  };
  const normativa = adaptedAnalysis.normativa || {
    factor_verde: 0,
    cumple_pecv_madrid: false,
    apto_para_subvencion: false
  };

  // Use adapted values or fallback to calculated ones
  const inversionInicial = presupuesto.coste_total_inicial_eur || (adaptedAnalysis.area_m2 * 150);
  const ahorroAnual = roi_data.ahorro_anual_eur || beneficios.ahorro_energia_eur_anual || (adaptedAnalysis.area_m2 * 7.95);
  const roi = roi_data.roi_porcentaje || ((ahorroAnual / inversionInicial) * 100);
  const costeNeto = inversionInicial - subvencion.monto_estimado_eur;

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Panel Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* 1. RESUMEN GENERAL */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">1. Resumen General</h3>
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
              <div className="text-gray-600 mb-1">Perímetro</div>
              <div className="font-semibold text-gray-900">
                {adaptedAnalysis.perimetro_m.toFixed(0)} m
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">Factor Verde</div>
              <div className="font-semibold text-gray-900">{normativa.factor_verde.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">Viabilidad</div>
              <div className={`font-semibold ${viabilidadColor}`}>{viabilidad}</div>
            </div>
          </div>
        </div>

        {/* MÓDULO A: POBLACIÓN BENEFICIADA */}
        {analysis.poblacion_datos && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">2. Población Beneficiada</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">Densidad del Barrio</p>
                <p className="text-xl font-bold text-blue-600">
                  {analysis.poblacion_datos.densidad_barrio_hab_km2.toLocaleString('es-ES')}
                </p>
                <p className="text-xs text-gray-500">hab/km²</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">Beneficiarios Directos (50m)</p>
                <p className="text-xl font-bold text-green-600">
                  ~{analysis.poblacion_datos.beneficiarios_directos_radio_50m}
                </p>
                <p className="text-xs text-gray-500">personas</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-gray-600 mb-1">Coste por Persona</p>
                <p className="text-xl font-bold text-purple-600">
                  €{analysis.poblacion_datos.coste_por_persona}
                </p>
                <p className="text-xs text-gray-500">inversión una sola vez</p>
              </div>
            </div>
          </div>
        )}

        {/* MÓDULO B: DÉFICIT VERDE */}
        {analysis.deficit_verde && (
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <TreeDeciduous className="text-orange-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">3. Déficit Verde del Barrio</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Espacios verdes actuales</span>
                  <span className="font-bold text-red-600">
                    {analysis.deficit_verde.verde_actual_m2_hab} m²/hab
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">OMS recomienda mínimo</span>
                  <span className="font-bold text-green-600">
                    {analysis.deficit_verde.oms_minimo} m²/hab
                  </span>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-700 text-sm">Déficit</span>
                    <span className="text-lg font-bold text-red-700">
                      {analysis.deficit_verde.deficit} m²/hab ⚠️
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Con esta cubierta verde</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analysis.deficit_verde.con_cubierta_m2_hab} m²/hab
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    +{analysis.deficit_verde.mejora_pct}% de mejora
                  </p>
                </div>
                
                <div className="p-3 bg-orange-100 rounded-lg">
                  <p className="text-xs font-semibold text-orange-800">
                    Prioridad: {analysis.deficit_verde.prioridad.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MÓDULO C: PRIORIZACIÓN */}
        {analysis.priorizacion && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md p-6 border-2 border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">4. Índice de Prioridad</h3>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-red-600 mb-1">
                {analysis.priorizacion.score_total}/100
              </p>
              <p className="text-sm font-semibold text-red-700 uppercase">
                {analysis.priorizacion.clasificacion}
              </p>
              <p className="text-xs text-gray-700 mt-2">
                {analysis.priorizacion.recomendacion}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded text-xs">
                <span>Densidad Poblacional</span>
                <span className="font-semibold">
                  {analysis.priorizacion.factores.densidad_poblacional}/25
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded text-xs">
                <span>Déficit Verde</span>
                <span className="font-semibold">
                  {analysis.priorizacion.factores.deficit_verde}/25
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded text-xs">
                <span>Temperatura (Isla de Calor)</span>
                <span className="font-semibold">
                  {analysis.priorizacion.factores.temperatura}/20
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded text-xs">
                <span>Viabilidad Técnica</span>
                <span className="font-semibold">
                  {analysis.priorizacion.factores.viabilidad_tecnica}/15
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. BENEFICIOS ECOSISTÉMICOS */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Wind className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">5. Beneficios Ecosistémicos</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Wind className="text-green-600" size={18} />
                <span className="text-gray-700">CO₂ Capturado Anual</span>
              </div>
              <span className="font-semibold text-gray-900">
                {beneficios.co2_capturado_kg_anual.toLocaleString('es-ES')} kg/año
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div className="flex items-center gap-2">
                <Droplets className="text-blue-600" size={18} />
                <span className="text-gray-700">Agua Retenida Anual</span>
              </div>
              <span className="font-semibold text-gray-900">
                {beneficios.agua_retenida_litros_anual.toLocaleString('es-ES')} L/año
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <div className="flex items-center gap-2">
                <Thermometer className="text-orange-600" size={18} />
                <span className="text-gray-700">Reducción Temperatura</span>
              </div>
              <span className="font-semibold text-gray-900">
                {beneficios.reduccion_temperatura_c.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <div className="flex items-center gap-2">
                <Zap className="text-yellow-600" size={18} />
                <span className="text-gray-700">Ahorro Energía Anual</span>
              </div>
              <span className="font-semibold text-gray-900">
                {beneficios.ahorro_energia_kwh_anual.toLocaleString('es-ES')} kWh
                ({beneficios.ahorro_energia_eur_anual.toLocaleString('es-ES')} €)
              </span>
            </div>
          </div>
        </div>

        {/* 3. PRESUPUESTO DETALLADO */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">6. Presupuesto Detallado</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-blue-100 rounded font-semibold">
              <span className="text-gray-900">Inversión Inicial</span>
              <span className="text-gray-900">
                €{inversionInicial.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="pl-4 space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-600">Sustrato</span>
                <span className="text-gray-900">
                  €{presupuesto.desglose.sustrato_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-600">Drenaje</span>
                <span className="text-gray-900">
                  €{presupuesto.desglose.drenaje_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-600">Membrana Impermeable</span>
                <span className="text-gray-900">
                  €{presupuesto.desglose.membrana_impermeable_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-600">Plantas</span>
                <span className="text-gray-900">
                  €{presupuesto.desglose.plantas_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                <span className="text-gray-600">Instalación</span>
                <span className="text-gray-900">
                  €{presupuesto.desglose.instalacion_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
              <span className="text-gray-700">Mantenimiento Anual</span>
              <span className="font-semibold text-gray-900">
                €{presupuesto.mantenimiento_anual_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Coste por m²</span>
              <span className="font-semibold text-gray-900">
                €{presupuesto.coste_por_m2_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}/m²
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Vida Útil</span>
              <span className="font-semibold text-gray-900">{presupuesto.vida_util_anos} años</span>
            </div>
          </div>
        </div>

        {/* 4. ROI (RETORNO DE INVERSIÓN) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">7. ROI (Retorno de Inversión)</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-gray-700">Ahorro Anual</span>
              <span className="font-semibold text-green-600">
                €{ahorroAnual.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-gray-700">ROI Porcentaje</span>
              <span className="font-semibold text-blue-600">{roi.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span className="text-gray-700">Amortización</span>
              <span className="font-semibold text-purple-600">
                {roi_data.amortizacion_anos.toFixed(1)} años
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-100 rounded">
              <span className="text-gray-700">Ahorro Total 25 años</span>
              <span className="font-semibold text-green-700">
                €{roi_data.ahorro_25_anos_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* 5. SUBVENCIONES */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">8. Subvenciones Disponibles</h3>
          </div>

          {subvencion.elegible ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-700">Programa</span>
                <span className="font-semibold text-gray-900">{subvencion.programa}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-gray-700">Porcentaje Subvención</span>
                <span className="font-semibold text-blue-600">{subvencion.porcentaje}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">Monto Estimado</span>
                <span className="font-semibold text-green-600">
                  €{subvencion.monto_estimado_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-100 rounded font-semibold">
                <span className="text-gray-900">Coste Neto (con subvención)</span>
                <span className="text-gray-900">
                  €{costeNeto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay subvenciones disponibles para este proyecto
            </div>
          )}
        </div>

        {/* 6. ESPECIES RECOMENDADAS */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              9. Especies Recomendadas ({especies.length})
            </h3>
          </div>

          {especies.length > 0 ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {especies.map((especie, index) => (
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
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay especies recomendadas disponibles
            </div>
          )}
        </div>

        {/* Recommendations Card */}
        {recomendaciones.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-orange-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">
                Recomendaciones Técnicas ({recomendaciones.length})
              </h3>
            </div>

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
          </div>
        )}

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

        {onShowSpecializations && (
          <button
            onClick={onShowSpecializations}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Layers size={20} />
            Ver Análisis Especializados
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
