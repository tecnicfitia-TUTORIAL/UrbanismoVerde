/**
 * ConjuntosGallery Component
 * 
 * Gallery view for displaying saved zone collections.
 * Shows cards with collection info and actions.
 */

import React, { useState, useEffect } from 'react';
import { Layers, Trash2, MapPin, Calendar } from 'lucide-react';
import { ConjuntoZonasData } from '../../types';
import { loadConjuntosZonas, deleteConjuntoZonas } from '../../services/conjunto-zonas-service';

interface ConjuntosGalleryProps {
  onViewOnMap?: (conjuntoId: string) => void;
  onConjuntoDeleted?: () => void;
}

export const ConjuntosGallery: React.FC<ConjuntosGalleryProps> = ({
  onViewOnMap,
  onConjuntoDeleted,
}) => {
  const [conjuntos, setConjuntos] = useState<ConjuntoZonasData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conjuntos on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadConjuntosZonas();
      setConjuntos(data);
    } catch (err) {
      console.error('Error loading conjuntos:', err);
      setError('Error al cargar los conjuntos de zonas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el conjunto "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteConjuntoZonas(id);
      // Remove from list
      setConjuntos(prev => prev.filter(c => c.id !== id));
      if (onConjuntoDeleted) {
        onConjuntoDeleted();
      }
    } catch (err) {
      console.error('Error deleting conjunto:', err);
      alert('Error al eliminar el conjunto');
    }
  };

  // Type labels in Spanish
  const typeLabels: Record<string, string> = {
    tejado: 'Tejados',
    azotea: 'Azoteas',
    solar_vacio: 'Solares',
    parque_degradado: 'Parques',
    zona_abandonada: 'Zonas abandonadas',
    espacio_abandonado: 'Espacios abandonados',
    zona_industrial: 'Zonas industriales',
    fachada: 'Fachadas',
    muro: 'Muros',
    otro: 'Otros',
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-green-600"></div>
        <p className="mt-4 text-gray-600">Cargando conjuntos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (conjuntos.length === 0) {
    return (
      <div className="p-8 text-center">
        <Layers size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay conjuntos guardados
        </h3>
        <p className="text-gray-600 mb-4">
          Usa la herramienta de selección múltiple en el mapa para crear tu primer conjunto de zonas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Layers size={28} />
          <span>Conjuntos de Zonas</span>
        </h2>
        <p className="text-gray-600 mt-1">
          {conjuntos.length} {conjuntos.length === 1 ? 'conjunto guardado' : 'conjuntos guardados'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conjuntos.map((conjunto) => (
          <div
            key={conjunto.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {conjunto.nombre}
                  </h3>
                  {conjunto.descripcion && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {conjunto.descripcion}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin size={16} className="mr-2 text-gray-400" />
                  <span>
                    {conjunto.cantidad_zonas} {conjunto.cantidad_zonas === 1 ? 'zona' : 'zonas'}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{conjunto.area_total_m2?.toFixed(0) || 0} m²</span>
                </div>

                {/* Zone types breakdown */}
                {conjunto.tipos_zonas && Object.keys(conjunto.tipos_zonas).length > 0 && (
                  <div className="text-sm text-gray-600">
                    {Object.entries(conjunto.tipos_zonas).map(([type, count], idx) => (
                      <span key={type}>
                        {idx > 0 && ' • '}
                        {typeLabels[type] || type}: {count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>
                    {new Date(conjunto.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                {onViewOnMap && (
                  <button
                    onClick={() => onViewOnMap(conjunto.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Ver en mapa
                  </button>
                )}
                <button
                  onClick={() => handleDelete(conjunto.id, conjunto.nombre)}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  title="Eliminar conjunto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConjuntosGallery;
