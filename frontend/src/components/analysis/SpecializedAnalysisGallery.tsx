/**
 * SpecializedAnalysisGallery Component
 * 
 * Displays a gallery of all specialized analyses grouped by type
 */

import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Home, 
  Building, 
  Square, 
  Trees, 
  Construction,
  Building2,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  DollarSign,
  MapPin,
  Filter,
  X
} from 'lucide-react';
import { TipoEspecializacion, TIPOS_ESPECIALIZACION } from '../../types';
import { loadSpecializedAnalyses, SpecializedAnalysisWithZone } from '../../services/specialized-analysis-service';
import toast from 'react-hot-toast';

interface SpecializedAnalysisGalleryProps {
  onNavigate: (view: string, data?: any) => void;
}

// Icon mapping
const iconMap: Record<TipoEspecializacion, React.ReactNode> = {
  tejado: <Home size={24} />,
  fachada: <Building size={24} />,
  muro: <Square size={24} />,
  parque: <Trees size={24} />,
  zona_abandonada: <Construction size={24} />,
  solar_vacio: <Square size={24} />,
  parque_degradado: <Trees size={24} />,
  jardin_vertical: <Building2 size={24} />,
  otro: <MoreHorizontal size={24} />,
};

// Viability color mapping
const viabilityColors: Record<string, string> = {
  alta: 'text-green-600 bg-green-50 border-green-200',
  media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  baja: 'text-orange-600 bg-orange-50 border-orange-200',
  nula: 'text-red-600 bg-red-50 border-red-200',
};

const viabilityLabels: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  nula: 'Nula',
};

export const SpecializedAnalysisGallery: React.FC<SpecializedAnalysisGalleryProps> = ({ onNavigate }) => {
  const [analyses, setAnalyses] = useState<SpecializedAnalysisWithZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TipoEspecializacion | 'all'>('all');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await loadSpecializedAnalyses();
      setAnalyses(data);
      console.log('✅ Loaded specialized analyses:', data.length);
    } catch (error) {
      console.error('Error loading specialized analyses:', error);
      toast.error('Error al cargar análisis especializados');
    } finally {
      setLoading(false);
    }
  };

  // Filter analyses by type
  const filteredAnalyses = filterType === 'all' 
    ? analyses 
    : analyses.filter(a => a.tipo_especializacion === filterType);

  // Group by type
  const analysesByType = filteredAnalyses.reduce((acc, analysis) => {
    const tipo = analysis.tipo_especializacion;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(analysis);
    return acc;
  }, {} as Record<TipoEspecializacion, SpecializedAnalysisWithZone[]>);

  // Get tipo info
  const getTipoInfo = (tipo: TipoEspecializacion) => {
    return TIPOS_ESPECIALIZACION.find(t => t.id === tipo) || {
      id: tipo,
      nombre: tipo,
      descripcion: '',
      icon: 'MoreHorizontal',
      tags: [],
      color: 'bg-gray-500',
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers size={32} className="text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Análisis Especializados</h1>
        </div>
        <p className="text-gray-600">
          Análisis detallados por tipo de infraestructura verde
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Filter size={20} className="text-gray-600" />
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({analyses.length})
        </button>
        {TIPOS_ESPECIALIZACION.map((tipo) => {
          const count = analyses.filter(a => a.tipo_especializacion === tipo.id).length;
          if (count === 0) return null;
          
          return (
            <button
              key={tipo.id}
              onClick={() => setFilterType(tipo.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === tipo.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tipo.nombre} ({count})
            </button>
          );
        })}
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Limpiar filtro"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && analyses.length === 0 && (
        <div className="text-center py-12">
          <Layers size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay análisis especializados
          </h3>
          <p className="text-gray-600 mb-6">
            Los análisis especializados aparecerán aquí cuando generes análisis de zonas
          </p>
          <button
            onClick={() => onNavigate('analisis-new')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Crear Análisis
          </button>
        </div>
      )}

      {/* Analysis groups */}
      {!loading && Object.keys(analysesByType).length > 0 && (
        <div className="space-y-8">
          {Object.entries(analysesByType).map(([tipo, typeAnalyses]) => {
            const tipoInfo = getTipoInfo(tipo as TipoEspecializacion);
            
            return (
              <div key={tipo}>
                {/* Type header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tipoInfo.color} text-white`}>
                    {iconMap[tipo as TipoEspecializacion]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{tipoInfo.nombre}</h2>
                    <p className="text-sm text-gray-600">{tipoInfo.descripcion}</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {typeAnalyses.length}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        // TODO: Navigate to detail view
                        toast.success('Vista detallada próximamente');
                      }}
                    >
                      {/* Zone name */}
                      <div className="flex items-start gap-3 mb-3">
                        <MapPin size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {analysis.zona_verde?.nombre || 'Zona sin nombre'}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {analysis.zona_verde?.tipo || 'Sin tipo'}
                          </p>
                        </div>
                      </div>

                      {/* Viability badge */}
                      {analysis.viabilidad_final && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium mb-3 ${
                          viabilityColors[analysis.viabilidad_final] || viabilityColors.nula
                        }`}>
                          <TrendingUp size={14} />
                          Viabilidad {viabilityLabels[analysis.viabilidad_final] || analysis.viabilidad_final}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Square size={16} className="text-gray-400" />
                          <span className="font-medium">{analysis.area_base_m2.toFixed(0)} m²</span>
                        </div>
                        {analysis.presupuesto_total_eur && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <DollarSign size={16} className="text-gray-400" />
                            <span className="font-medium">
                              {analysis.presupuesto_total_eur.toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar size={16} />
                          <span>{new Date(analysis.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecializedAnalysisGallery;
