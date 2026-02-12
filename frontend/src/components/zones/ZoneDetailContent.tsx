import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapIcon, Edit2, Trash2, Brain, Euro, History, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Area } from '../../types';
import Breadcrumbs from '../common/Breadcrumbs';
import { coloresPorTipo } from '../../types';
import { supabase, TABLES } from '../../config/supabase';
import { deleteZonaVerde } from '../../services/zona-storage';

interface ZoneDetailContentProps {
  area: Area;
  onBack: () => void;
  onNavigate: (view: string, data?: any) => void;
  onDelete: (id: string) => void;
}

// All fields should be optional since analysis might not exist
interface AnalisisData {
  id: string;
  zona_verde_id: string;
  
  // Core Analysis Fields
  green_score?: number;  // Range: 0-100
  viabilidad?: 'alta' | 'media' | 'baja' | 'nula';
  
  // Environmental Impact
  factor_verde?: number;
  co2_capturado_kg_anual?: number;
  agua_retenida_litros_anual?: number;
  reduccion_temperatura_c?: number;
  ahorro_energia_kwh_anual?: number;
  ahorro_energia_eur_anual?: number;
  
  // Analysis Metadata
  exposicion_solar?: number;  // Optional: percentage 0-100
  
  // Budget
  coste_total_inicial_eur?: number;
  presupuesto_desglose?: {
    sustrato_eur: number;
    drenaje_eur: number;
    membrana_impermeable_eur: number;
    plantas_eur: number;
    instalacion_eur: number;
  };
  mantenimiento_anual_eur?: number;
  coste_por_m2_eur?: number;
  vida_util_anos?: number;
  
  // ROI
  roi_porcentaje?: number;
  amortizacion_anos?: number;
  ahorro_anual_eur?: number;
  ahorro_25_anos_eur?: number;
  
  // Grants
  subvencion_elegible?: boolean;
  subvencion_porcentaje?: number;
  subvencion_programa?: string;
  subvencion_monto_estimado_eur?: number;
  
  // Species & Recommendations
  especies_recomendadas?: any[];
  recomendaciones?: any;  // JSONB field - can be array or object
  
  // Metadata
  notas?: string;
  created_at?: string;
}

// Helper functions for Green Score display
const getViabilityColorClasses = (viabilidad?: string): string => {
  switch (viabilidad) {
    case 'alta':
      return 'bg-green-500 text-white';
    case 'media':
      return 'bg-yellow-500 text-white';
    case 'baja':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-red-500 text-white';
  }
};

const getGreenScoreColorClass = (score: number): string => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

const getGreenScoreMessage = (score: number): string => {
  if (score >= 70) return '🌟 Excelente viabilidad para la instalación de zona verde';
  if (score >= 50) return '✅ Buena viabilidad, se recomienda proceder';
  if (score >= 30) return '⚠️ Viabilidad moderada, revisar recomendaciones';
  return '❌ Viabilidad baja, considerar alternativas';
};

// Unit conversion constants
const KG_TO_TONNES = 1000;
const LITERS_TO_M3 = 1000;
const EUR_TO_K = 1000;

const ZoneDetailContent: React.FC<ZoneDetailContentProps> = ({
  area,
  onBack,
  onNavigate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'analysis' | 'budget' | 'history'>('info');
  const [analisis, setAnalisis] = useState<AnalisisData | null>(null);
  const [loadingAnalisis, setLoadingAnalisis] = useState(true);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  // Load analysis data from database on component mount
  useEffect(() => {
    loadAnalisisData();
  }, [area.nombre]); // Use area.nombre since that's what we query by

  async function loadAnalisisData() {
    setLoadingAnalisis(true);
    setHasAnalysis(false);  // Reset state
    
    try {
      // First, try to find the zona_verde in database by matching name and area
      // (since local IDs don't match database UUIDs)
      const { data: zonas, error: zonaError } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('id, nombre, area_m2')
        .eq('nombre', area.nombre)
        .order('created_at', { ascending: false })
        .limit(1);

      if (zonaError) {
        console.error('Error fetching zona:', zonaError);
        setLoadingAnalisis(false);
        return;
      }

      if (!zonas || zonas.length === 0) {
        console.log('No matching zona found in database');
        setLoadingAnalisis(false);
        return;
      }

      const dbZona = zonas[0];

      // Now fetch the analysis for this zona - use SELECT * to avoid field mismatch
      const { data: analisisData, error: analisisError } = await supabase
        .from(TABLES.ANALISIS)
        .select('*')
        .eq('zona_verde_id', dbZona.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analisisError) {
        if (analisisError.code === 'PGRST116') {
          // No rows returned - zona exists but no analysis (this is normal)
          console.log('✅ Zona found but no analysis yet - this is OK');
          setHasAnalysis(false);
        } else {
          // Real error
          console.error('❌ Error fetching analysis:', analisisError);
        }
        setLoadingAnalisis(false);
        return;
      }

      if (analisisData) {
        console.log('✅ Analysis data loaded successfully');
        setAnalisis(analisisData as AnalisisData);
        setHasAnalysis(true);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoadingAnalisis(false);
    }
  }

  const breadcrumbItems = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Zonas', path: 'zonas-gallery' },
    { label: area.nombre }
  ];

  const tabs = [
    { id: 'info' as const, label: 'Información General', icon: <MapIcon size={16} /> },
    { 
      id: 'analysis' as const, 
      label: hasAnalysis ? 'Análisis IA' : 'Análisis IA (Pendiente)',
      icon: <Brain size={16} /> 
    },
    { id: 'budget' as const, label: 'Presupuesto', icon: <Euro size={16} /> },
    { id: 'history' as const, label: 'Historial', icon: <History size={16} /> }
  ];

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar la zona "${area.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const toastId = toast.loading('Eliminando zona...');

    try {
      await deleteZonaVerde(area.id);
      toast.success('✅ Zona eliminada correctamente', { id: toastId });
      onDelete(area.id);
      onBack();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('❌ Error al eliminar la zona', { id: toastId });
    }
  };

  // Calcular perímetro aproximado
  const calcularPerimetro = (coords: [number, number][]): number => {
    let perimetro = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const lat1 = coords[i][0] * Math.PI / 180;
      const lat2 = coords[j][0] * Math.PI / 180;
      const lon1 = coords[i][1] * Math.PI / 180;
      const lon2 = coords[j][1] * Math.PI / 180;
      
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const R = 6371000; // Radio de la Tierra en metros
      perimetro += R * c;
    }
    return Math.round(perimetro * 100) / 100;
  };

  const perimetro = calcularPerimetro(area.coordenadas);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {area.nombre}
                </h1>
                <div className="flex items-center gap-3">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      backgroundColor: coloresPorTipo[area.tipo] + '20',
                      color: coloresPorTipo[area.tipo]
                    }}
                  >
                    {area.tipo.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    Creada el {new Date(area.fechaCreacion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('Edición próximamente')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* ========== SECTION 1: BASIC ZONE INFO ========== */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Área</div>
                      <div className="text-xl font-bold text-gray-900">
                        {area.areaM2.toLocaleString('es-ES', { maximumFractionDigits: 2 })} m²
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Perímetro</div>
                      <div className="text-xl font-bold text-gray-900">
                        {perimetro.toLocaleString('es-ES')} m
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tipo</div>
                      <div className="text-xl font-bold text-gray-900 capitalize">
                        {area.tipo.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Puntos</div>
                      <div className="text-xl font-bold text-gray-900">
                        {area.coordenadas.length}
                      </div>
                    </div>
                  </div>
                  
                  {/* Coordenadas */}
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">Coordenadas</div>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {area.coordenadas.slice(0, 4).map((coord, idx) => (
                        <div key={idx} className="text-sm font-mono text-gray-700">
                          [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                        </div>
                      ))}
                      {area.coordenadas.length > 4 && (
                        <div className="text-sm text-gray-500 italic">
                          ...y {area.coordenadas.length - 4} puntos más
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ========== SECTION 2: RESUMEN GENERAL (IF ANALYSIS EXISTS) ========== */}
                {analisis ? (
                  <>
                    {/* Green Score + Viabilidad */}
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl p-8 border-2 border-green-300">
                      <h3 className="text-xl font-bold text-green-900 mb-6">1. Resumen General</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Green Score */}
                        <div className="text-center">
                          <div className="text-5xl font-black text-green-700 mb-2">
                            {analisis.green_score?.toFixed(1) ?? '0'}
                          </div>
                          <div className="text-sm text-green-600 font-semibold">Green Score</div>
                        </div>
                        
                        {/* Área */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-700 mb-2">
                            {area.areaM2.toLocaleString('es-ES', { maximumFractionDigits: 2 })} m²
                          </div>
                          <div className="text-sm text-gray-600">Área</div>
                        </div>
                        
                        {/* Factor Verde */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-700 mb-2">
                            {(analisis.factor_verde ?? 0.65).toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">Factor Verde</div>
                        </div>
                        
                        {/* Viabilidad */}
                        <div className="text-center">
                          <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${
                            analisis.viabilidad === 'alta' ? 'bg-green-500 text-white' :
                            analisis.viabilidad === 'media' ? 'bg-yellow-500 text-white' :
                            analisis.viabilidad === 'baja' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {analisis.viabilidad?.toUpperCase() ?? 'MEDIA'}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">Viabilidad</div>
                        </div>
                      </div>
                    </div>

                    {/* ========== SECTION 3: BENEFICIOS ECOSISTÉMICOS ========== */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">2. Beneficios Ecosistémicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* CO2 */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-green-700 font-semibold mb-1">CO₂ Capturado Anual</div>
                          <div className="text-3xl font-bold text-green-900">
                            {((analisis.co2_capturado_kg_anual ?? 0) / 1000).toLocaleString('es-ES', { maximumFractionDigits: 0 })} t
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {(analisis.co2_capturado_kg_anual ?? 0).toLocaleString('es-ES')} kg/año
                          </div>
                        </div>
                        
                        {/* Agua */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="text-sm text-blue-700 font-semibold mb-1">Agua Retenida Anual</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {((analisis.agua_retenida_litros_anual ?? 0) / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} ML
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {(analisis.agua_retenida_litros_anual ?? 0).toLocaleString('es-ES')} L/año
                          </div>
                        </div>
                        
                        {/* Temperatura */}
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <div className="text-sm text-orange-700 font-semibold mb-1">Reducción Temperatura</div>
                          <div className="text-3xl font-bold text-orange-900">
                            {(analisis.reduccion_temperatura_c ?? 1.5).toFixed(1)}°C
                          </div>
                          <div className="text-xs text-orange-600 mt-1">Isla de calor urbano</div>
                        </div>
                        
                        {/* Energía */}
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="text-sm text-yellow-700 font-semibold mb-1">Ahorro Energía Anual</div>
                          <div className="text-2xl font-bold text-yellow-900">
                            {((analisis.ahorro_energia_kwh_anual ?? 0) / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MWh
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            €{(analisis.ahorro_energia_eur_anual ?? 0).toLocaleString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ========== SECTION 4: PRESUPUESTO DETALLADO ========== */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">3. Presupuesto Detallado</h3>
                      
                      {/* Inversión Inicial */}
                      <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-300 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-purple-700 font-semibold mb-1">Inversión Inicial</div>
                            <div className="text-4xl font-black text-purple-900">
                              €{((analisis.coste_total_inicial_eur ?? 0) / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 2 })}M
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-purple-700">Coste por m²</div>
                            <div className="text-2xl font-bold text-purple-900">
                              €{(analisis.coste_por_m2_eur ?? 235).toLocaleString('es-ES')}/m²
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-purple-700">Mantenimiento Anual:</span>
                            <span className="font-bold text-purple-900 ml-2">
                              €{(analisis.mantenimiento_anual_eur ?? 0).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700">Vida Útil:</span>
                            <span className="font-bold text-purple-900 ml-2">
                              {analisis.vida_util_anos ?? 25} años
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desglose */}
                      {analisis.presupuesto_desglose && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3">Desglose de Inversión</h4>
                          {[
                            { label: 'Sustrato', value: analisis.presupuesto_desglose.sustrato_eur, color: 'bg-amber-500' },
                            { label: 'Drenaje', value: analisis.presupuesto_desglose.drenaje_eur, color: 'bg-blue-500' },
                            { label: 'Membrana Impermeable', value: analisis.presupuesto_desglose.membrana_impermeable_eur, color: 'bg-gray-500' },
                            { label: 'Plantas', value: analisis.presupuesto_desglose.plantas_eur, color: 'bg-green-500' },
                            { label: 'Instalación', value: analisis.presupuesto_desglose.instalacion_eur, color: 'bg-purple-500' }
                          ].map((item, idx) => {
                            const percentage = analisis.coste_total_inicial_eur 
                              ? (((item.value ?? 0) / analisis.coste_total_inicial_eur) * 100).toFixed(1)
                              : '0';
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    <span className="text-sm font-bold text-gray-900">
                                      €{(item.value ?? 0).toLocaleString('es-ES')}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${item.color}`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-gray-600 w-12 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ========== SECTION 5: ROI ========== */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">4. ROI (Retorno de Inversión)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-indigo-700 mb-1">Ahorro Anual</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            €{(analisis.ahorro_anual_eur ?? 0).toLocaleString('es-ES')}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-green-700 mb-1">ROI Porcentaje</div>
                          <div className="text-2xl font-bold text-green-900">
                            {(analisis.roi_porcentaje ?? 6.7).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-blue-700 mb-1">Amortización</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {(analisis.amortizacion_anos ?? 15.0).toFixed(1)} años
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-purple-700 mb-1">Ahorro Total 25 años</div>
                          <div className="text-xl font-bold text-purple-900">
                            €{((analisis.ahorro_25_anos_eur ?? 0) / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}M
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ========== SECTION 6: SUBVENCIONES ========== */}
                    {analisis.subvencion_elegible && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Subvenciones Disponibles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-green-700 mb-1">Programa</div>
                            <div className="text-2xl font-bold text-green-900 mb-4">
                              {analisis.subvencion_programa ?? 'PECV Madrid 2025'}
                            </div>
                            <div className="text-sm text-green-700 mb-1">Porcentaje Subvención</div>
                            <div className="text-4xl font-black text-green-900">
                              {analisis.subvencion_porcentaje ?? 60}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-green-700 mb-1">Monto Estimado</div>
                            <div className="text-4xl font-black text-green-900 mb-4">
                              €{((analisis.subvencion_monto_estimado_eur ?? 0) / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 2 })}M
                            </div>
                            <div className="text-sm text-green-700 mb-1">Coste Neto (con subvención)</div>
                            <div className="text-3xl font-bold text-green-900">
                              €{(() => {
                                const costeNeto = ((analisis.coste_total_inicial_eur ?? 0) - (analisis.subvencion_monto_estimado_eur ?? 0)) / 1000000;
                                return costeNeto.toLocaleString('es-ES', { maximumFractionDigits: 2 });
                              })()}M
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========== SECTION 7: ESPECIES RECOMENDADAS ========== */}
                    {analisis.especies_recomendadas && analisis.especies_recomendadas.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">
                          Especies Recomendadas ({analisis.especies_recomendadas.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {analisis.especies_recomendadas.slice(0, 6).map((especie: any, idx: number) => (
                            <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="font-bold text-gray-900 text-lg mb-1">
                                {especie.nombre_comun || 'Especie'}
                              </div>
                              <div className="text-sm text-gray-600 italic mb-2">
                                {especie.nombre_cientifico || ''}
                              </div>
                              {especie.tipo && (
                                <div className="text-xs text-green-700 mb-2">
                                  {especie.tipo}
                                </div>
                              )}
                              {especie.viabilidad && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500"
                                      style={{ width: `${(especie.viabilidad * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-green-700">
                                    {(especie.viabilidad * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {analisis.especies_recomendadas.length > 6 && (
                          <p className="text-sm text-gray-600 mt-4 text-center">
                            Y {analisis.especies_recomendadas.length - 6} especies más...
                          </p>
                        )}
                      </div>
                    )}

                  </>
                ) : (
                  /* ========== NO ANALYSIS AVAILABLE ========== */
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                    <div className="text-center">
                      <Brain size={64} className="mx-auto mb-4 text-blue-400" />
                      <h3 className="text-xl font-bold text-blue-900 mb-2">
                        Sin análisis todavía
                      </h3>
                      <p className="text-blue-700 mb-6">
                        Esta zona no tiene un análisis completo. Realiza uno para ver todas las métricas detalladas.
                      </p>
                      <button
                        onClick={() => onNavigate('analisis-zone', area)}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                      >
                        Realizar análisis ahora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {loadingAnalisis ? (
                  // Loading state
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <span className="ml-3 text-gray-600">Cargando análisis...</span>
                  </div>
                ) : !hasAnalysis ? (
                  // No analysis state
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aún no hay análisis para esta zona
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Genera un análisis completo para obtener recomendaciones de especies,
                      cálculos de viabilidad, presupuestos y beneficios ambientales.
                    </p>
                    <button
                      onClick={() => onNavigate('analisis-zone', area)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
                    >
                      <Brain size={20} />
                      Analizar Zona
                    </button>
                  </div>
                ) : (
                  // Show analysis data
                  <div className="text-center py-16">
                    <Brain size={80} className="mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Análisis con IA
                    </h3>
                    <p className="text-gray-600 mb-2 max-w-md mx-auto">
                      Esta sección está reservada para funcionalidades avanzadas de análisis con inteligencia artificial.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                      Los resultados del análisis actual se encuentran en la pestaña <strong>"Información General"</strong>
                    </p>
                    <div className="inline-block px-6 py-3 bg-blue-100 text-blue-800 rounded-lg">
                      🚧 Próximamente: Predicciones climáticas, optimización de especies, simulaciones 3D...
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'budget' && (
              <>
                {loadingAnalisis ? (
                  <div className="text-center py-12">
                    <Loader2 size={64} className="mx-auto mb-4 text-primary-600 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Cargando presupuesto...
                    </h3>
                  </div>
                ) : analisis ? (
                  <div className="space-y-6">
                    {/* Inversión Inicial */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">
                        Inversión Inicial
                      </h3>
                      <div className="text-4xl font-bold text-purple-700 mb-2">
                        €{(analisis.coste_total_inicial_eur ?? 0).toLocaleString('es-ES')}
                      </div>
                      <p className="text-sm text-purple-700">
                        {analisis.coste_por_m2_eur ?? 150} €/m² • Vida útil: {analisis.vida_util_anos ?? 25} años
                      </p>
                    </div>

                    {/* Desglose del Presupuesto */}
                    {analisis.presupuesto_desglose && (
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Desglose del Presupuesto
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Sustrato', value: analisis.presupuesto_desglose.sustrato_eur, color: 'bg-amber-100 text-amber-800' },
                            { label: 'Sistema de Drenaje', value: analisis.presupuesto_desglose.drenaje_eur, color: 'bg-blue-100 text-blue-800' },
                            { label: 'Membrana Impermeable', value: analisis.presupuesto_desglose.membrana_impermeable_eur, color: 'bg-gray-100 text-gray-800' },
                            { label: 'Plantas y Vegetación', value: analisis.presupuesto_desglose.plantas_eur, color: 'bg-green-100 text-green-800' },
                            { label: 'Instalación y Mano de Obra', value: analisis.presupuesto_desglose.instalacion_eur, color: 'bg-purple-100 text-purple-800' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.color}`}>
                                  {analisis.coste_total_inicial_eur ? ((item.value / analisis.coste_total_inicial_eur) * 100).toFixed(0) : '0'}%
                                </span>
                                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">
                                €{(item.value ?? 0).toLocaleString('es-ES')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mantenimiento Anual */}
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                        Mantenimiento Anual
                      </h3>
                      <div className="text-2xl font-bold text-yellow-900">
                        €{(analisis.mantenimiento_anual_eur ?? 0).toLocaleString('es-ES')}/año
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Incluye riego, poda y fertilización
                      </p>
                    </div>

                    {/* ROI y Amortización */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Retorno de Inversión (ROI)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-green-700 mb-1">ROI Ambiental</div>
                          <div className="text-3xl font-bold text-green-900">
                            {(analisis.roi_porcentaje ?? 6.67).toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-blue-700 mb-1">Periodo de Amortización</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {(analisis.amortizacion_anos ?? 15.0).toFixed(1)} años
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="text-sm text-indigo-700 mb-1">Ahorro Anual</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            €{(analisis.ahorro_anual_eur ?? 0).toLocaleString('es-ES')}/año
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm text-purple-700 mb-1">Ahorro a 25 Años</div>
                          <div className="text-2xl font-bold text-purple-900">
                            €{(analisis.ahorro_25_anos_eur ?? 0).toLocaleString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subvenciones */}
                    {analisis.subvencion_elegible && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                        <h3 className="text-lg font-semibold text-green-900 mb-4">
                          💰 Subvenciones Disponibles
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Programa:</span>
                            <span className="font-semibold text-green-900">
                              {analisis.subvencion_programa ?? 'PECV Madrid 2025'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Porcentaje de Cobertura:</span>
                            <span className="font-semibold text-green-900">
                              {analisis.subvencion_porcentaje ?? 50}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-green-200">
                            <span className="text-sm font-semibold text-green-800">Monto Estimado:</span>
                            <span className="text-2xl font-bold text-green-900">
                              €{(analisis.subvencion_monto_estimado_eur ?? 0).toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-lg">
                          <p className="text-xs text-green-700">
                            ✓ Zona elegible para subvención del Plan de Cubiertas Verdes
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Euro size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Presupuesto no disponible
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Necesitas realizar un análisis primero para ver el presupuesto
                    </p>
                    <button
                      onClick={() => onNavigate('analisis-zone', area)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Realizar análisis
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <div className="text-center py-12">
                <History size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sin historial
                </h3>
                <p className="text-gray-600">
                  No hay actividad registrada para esta zona
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailContent;
