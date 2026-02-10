import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Area, TipoZona } from '../../types';

interface ZoneCardProps {
  area: Area;
  onCenter: () => void;
  onDelete: () => void;
}

const getBadgeClasses = (tipo: TipoZona): string => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const typeClasses: Record<TipoZona, string> = {
    azotea: 'bg-blue-100 text-blue-800',
    solar_vacio: 'bg-red-100 text-red-800',
    parque_degradado: 'bg-amber-100 text-amber-800',
    espacio_abandonado: 'bg-violet-100 text-violet-800',
    zona_industrial: 'bg-gray-100 text-gray-800',
    otro: 'bg-teal-100 text-teal-800'
  };
  return `${baseClasses} ${typeClasses[tipo]}`;
};

const ZoneCard: React.FC<ZoneCardProps> = ({ area, onCenter, onDelete }) => {
  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 truncate">{area.nombre}</h4>
          <span className={getBadgeClasses(area.tipo)}>
            {area.tipo.replace('_', ' ')}
          </span>
          <p className="text-sm text-gray-600 mt-1">
            {area.areaM2.toLocaleString()} m²
          </p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={onCenter}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label="Centrar en el mapa"
            title="Centrar en el mapa"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="Eliminar zona"
            title="Eliminar zona"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneCard;
