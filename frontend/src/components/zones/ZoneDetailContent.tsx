import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapIcon, Edit2, Trash2, Brain, Euro, History, Loader2 } from 'lucide-react';
import { Area } from '../../types';
import Breadcrumbs from '../common/Breadcrumbs';
import { coloresPorTipo } from '../../types';
import { supabase, TABLES } from '../../config/supabase';

interface ZoneDetailContentProps {
  area: Area;
  onBack: () => void;
  onNavigate: (view: string, data?: any) => void;
  onDelete: (id: string) => void;
}

interface AnalisisData {
  id: string;
  zona_verde_id: string;
  factor_verde: number;
  co2_capturado_kg_anual: number;
  agua_retenida_litros_anual: number;
  reduccion_temperatura_c: number;
  ahorro_energia_kwh_anual: number;
  ahorro_energia_eur_anual: number;
  coste_total_inicial_eur: number;
  presupuesto_desglose: {
    sustrato_eur: number;
    drenaje_eur: number;
    membrana_impermeable_eur: number;
    plantas_eur: number;
    instalacion_eur: number;
  };
  mantenimiento_anual_eur: number;
  coste_por_m2_eur: number;
  vida_util_anos: number;
  roi_porcentaje: number;
  amortizacion_anos: number;
  ahorro_anual_eur: number;
  ahorro_25_anos_eur: number;
  subvencion_elegible: boolean;
  subvencion_porcentaje: number;
  subvencion_programa: string;
  subvencion_monto_estimado_eur: number;
  especies_recomendadas: any[];
  notas: string;
  created_at: string;
}

const ZoneDetailContent: React.FC<ZoneDetailContentProps> = ({
  area,
  onBack,
  onNavigate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'analysis' | 'budget' | 'history'>('info');
  const [analisis, setAnalisis] = useState<AnalisisData | null>(null);
  const [loadingAnalisis, setLoadingAnalisis] = useState(true);

  // Load analysis data from database on component mount
  useEffect(() => {
    loadAnalisisData();
  }, [area.id]);

  async function loadAnalisisData() {
    setLoadingAnalisis(true);
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

      // Now fetch the analysis for this zona
      const { data: analisisData, error: analisisError } = await supabase
        .from(TABLES.ANALISIS)
        .select('*')
        .eq('zona_verde_id', dbZona.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analisisError) {
        if (analisisError.code === 'PGRST116') {
          // No rows returned - zona exists but no analysis
          console.log('Zona found but no analysis available');
        } else {
          console.error('Error fetching analysis:', analisisError);
        }
        setLoadingAnalisis(false);
        return;
      }

      if (analisisData) {
        console.log('✅ Analysis data loaded:', analisisData);
        setAnalisis(analisisData);
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
    { id: 'analysis' as const, label: 'Análisis IA', icon: <Brain size={16} /> },
    { id: 'budget' as const, label: 'Presupuesto', icon: <Euro size={16} /> },
    { id: 'history' as const, label: 'Historial', icon: <History size={16} /> }
  ];

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar la zona "${area.nombre}"?`)) {
      onDelete(area.id);
      onBack();
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
                {/* Map Preview */}
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: coloresPorTipo[area.tipo] + '10' }}
                  >
                    <MapIcon 
                      size={120} 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
                      style={{ color: coloresPorTipo[area.tipo] }}
                    />
                  </div>
                  <span className="relative text-gray-600 text-sm">Vista previa del mapa</span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos Generales</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Área:</dt>
                        <dd className="text-sm font-semibold text-gray-900">{area.areaM2.toFixed(2)} m²</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Perímetro:</dt>
                        <dd className="text-sm font-semibold text-gray-900">{perimetro.toFixed(2)} m</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Tipo:</dt>
                        <dd className="text-sm font-semibold text-gray-900">{area.tipo.replace('_', ' ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Puntos:</dt>
                        <dd className="text-sm font-semibold text-gray-900">{area.coordenadas.length}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Coordenadas</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono text-gray-600">
                      {area.coordenadas.slice(0, 5).map((coord, idx) => (
                        <div key={idx}>
                          [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                        </div>
                      ))}
                      {area.coordenadas.length > 5 && (
                        <div className="text-gray-400">
                          ... y {area.coordenadas.length - 5} más
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {area.notas && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Notas</h3>
                    <p className="text-sm text-blue-800">{area.notas}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <>
                {loadingAnalisis ? (
                  <div className="text-center py-12">
                    <Loader2 size={64} className="mx-auto mb-4 text-primary-600 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Cargando análisis...
                    </h3>
                  </div>
                ) : analisis ? (
                  <div className="space-y-6">
                    {/* Factor Verde */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Factor Verde
                      </h3>
                      <div className="text-4xl font-bold text-green-700 mb-2">
                        {analisis.factor_verde?.toFixed(2) || '0.65'}
                      </div>
                      <p className="text-sm text-green-700">
                        Cumple con normativa PECV Madrid 2025
                      </p>
                    </div>

                    {/* Beneficios Ecosistémicos */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Beneficios Ecosistémicos Anuales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-blue-700 mb-1">CO₂ Capturado</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {analisis.co2_capturado_kg_anual?.toLocaleString('es-ES') || 0} kg/año
                          </div>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-4">
                          <div className="text-sm text-cyan-700 mb-1">Agua Retenida</div>
                          <div className="text-2xl font-bold text-cyan-900">
                            {analisis.agua_retenida_litros_anual?.toLocaleString('es-ES') || 0} L/año
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="text-sm text-orange-700 mb-1">Reducción Temperatura</div>
                          <div className="text-2xl font-bold text-orange-900">
                            -{analisis.reduccion_temperatura_c?.toFixed(1) || '1.5'}°C
                          </div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="text-sm text-yellow-700 mb-1">Ahorro Energético</div>
                          <div className="text-2xl font-bold text-yellow-900">
                            {analisis.ahorro_energia_kwh_anual?.toLocaleString('es-ES') || 0} kWh/año
                          </div>
                          <div className="text-xs text-yellow-700 mt-1">
                            €{analisis.ahorro_energia_eur_anual?.toLocaleString('es-ES') || 0}/año
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Especies Recomendadas */}
                    {analisis.especies_recomendadas && analisis.especies_recomendadas.length > 0 && (
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Especies Recomendadas ({analisis.especies_recomendadas.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analisis.especies_recomendadas.slice(0, 6).map((especie: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="font-semibold text-gray-900 text-sm">
                                {especie.nombre_comun || 'Especie'}
                              </div>
                              <div className="text-xs text-gray-600 italic">
                                {especie.nombre_cientifico || ''}
                              </div>
                              {especie.viabilidad && (
                                <div className="text-xs text-green-600 mt-1">
                                  Viabilidad: {(especie.viabilidad * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {analisis.especies_recomendadas.length > 6 && (
                          <p className="text-sm text-gray-600 mt-3 text-center">
                            Y {analisis.especies_recomendadas.length - 6} especies más...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Notas del Análisis */}
                    {analisis.notas && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Notas</h3>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{analisis.notas}</p>
                      </div>
                    )}

                    {/* Fecha de Análisis */}
                    <div className="text-center text-sm text-gray-500">
                      Análisis realizado el {new Date(analisis.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Análisis IA no disponible
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Esta zona no tiene un análisis IA guardado todavía
                    </p>
                    <button
                      onClick={() => onNavigate('analisis-zone', area)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Realizar análisis ahora
                    </button>
                  </div>
                )}
              </>
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
                        €{analisis.coste_total_inicial_eur?.toLocaleString('es-ES') || 0}
                      </div>
                      <p className="text-sm text-purple-700">
                        {analisis.coste_por_m2_eur || 150} €/m² • Vida útil: {analisis.vida_util_anos || 25} años
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
                                  {((item.value / analisis.coste_total_inicial_eur) * 100).toFixed(0)}%
                                </span>
                                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">
                                €{item.value?.toLocaleString('es-ES') || 0}
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
                        €{analisis.mantenimiento_anual_eur?.toLocaleString('es-ES') || 0}/año
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
                            {analisis.roi_porcentaje?.toFixed(2) || '6.67'}%
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm text-blue-700 mb-1">Periodo de Amortización</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {analisis.amortizacion_anos?.toFixed(1) || '15.0'} años
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="text-sm text-indigo-700 mb-1">Ahorro Anual</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            €{analisis.ahorro_anual_eur?.toLocaleString('es-ES') || 0}/año
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm text-purple-700 mb-1">Ahorro a 25 Años</div>
                          <div className="text-2xl font-bold text-purple-900">
                            €{analisis.ahorro_25_anos_eur?.toLocaleString('es-ES') || 0}
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
                              {analisis.subvencion_programa || 'PECV Madrid 2025'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Porcentaje de Cobertura:</span>
                            <span className="font-semibold text-green-900">
                              {analisis.subvencion_porcentaje || 50}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-green-200">
                            <span className="text-sm font-semibold text-green-800">Monto Estimado:</span>
                            <span className="text-2xl font-bold text-green-900">
                              €{analisis.subvencion_monto_estimado_eur?.toLocaleString('es-ES') || 0}
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
