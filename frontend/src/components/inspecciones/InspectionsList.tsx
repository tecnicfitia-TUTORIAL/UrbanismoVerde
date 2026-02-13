import React from 'react';
import { MapPin, Trash2, FileText, Star } from 'lucide-react';
import { InspeccionTejado } from '../../types';

interface InspectionsListProps {
  inspections: InspeccionTejado[];
  onSelectInspection: (inspection: InspeccionTejado) => void;
  onDeleteInspection: (id: string) => void;
}

const InspectionsList: React.FC<InspectionsListProps> = ({
  inspections,
  onSelectInspection,
  onDeleteInspection
}) => {
  const getViabilityColor = (viabilidad: string) => {
    switch (viabilidad) {
      case 'alta': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-orange-100 text-orange-800';
      case 'nula': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Inspecciones Guardadas</h2>

      {inspections.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No hay inspecciones guardadas</p>
          <p className="text-sm text-gray-500">
            Haz clic en un tejado del mapa para crear una inspección
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectInspection(inspection)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {inspection.nombre || inspection.codigo}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{inspection.direccion}</span>
                  </div>
                  {inspection.municipio && (
                    <div className="text-sm text-gray-500">
                      {inspection.municipio}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inspection.id) onDeleteInspection(inspection.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-sm">
                  <span className="text-gray-500">Área:</span>{' '}
                  <span className="font-medium">{inspection.area_m2?.toFixed(2)} m²</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Orientación:</span>{' '}
                  <span className="font-medium">{inspection.orientacion}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getViabilityColor(inspection.viabilidad_preliminar)}`}>
                  {inspection.viabilidad_preliminar?.toUpperCase()}
                </span>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < inspection.prioridad ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>

              {inspection.informe_id && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                  <FileText size={12} />
                  <span>Añadido a informe</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionsList;
