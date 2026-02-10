import React, { useState } from 'react';
import { ArrowLeft, MapIcon, Calendar, Edit2, Trash2, Brain, Euro, History } from 'lucide-react';
import { Area } from '../../types';
import Breadcrumbs from '../common/Breadcrumbs';
import { coloresPorTipo } from '../../types';

interface ZoneDetailContentProps {
  area: Area;
  onBack: () => void;
  onNavigate: (view: string, data?: any) => void;
  onDelete: (id: string) => void;
}

const ZoneDetailContent: React.FC<ZoneDetailContentProps> = ({
  area,
  onBack,
  onNavigate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'analysis' | 'budget' | 'history'>('info');

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
              <div className="text-center py-12">
                <Brain size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Análisis IA no disponible
                </h3>
                <p className="text-gray-600 mb-6">
                  Esta zona no tiene un análisis IA todavía
                </p>
                <button
                  onClick={() => onNavigate('analisis-zone', area)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Realizar análisis ahora
                </button>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="text-center py-12">
                <Euro size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ver presupuesto
                </h3>
                <p className="text-gray-600 mb-6">
                  Calcula los materiales y costes necesarios para esta zona
                </p>
                <button
                  onClick={() => onNavigate('presupuestos-create', area)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Generar presupuesto
                </button>
              </div>
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
