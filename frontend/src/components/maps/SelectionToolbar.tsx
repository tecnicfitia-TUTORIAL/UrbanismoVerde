/**
 * SelectionToolbar Component
 * 
 * Toolbar displayed during multi-selection mode.
 * Shows selection count, total area, and action buttons.
 */

import React from 'react';
import { Trash2, Save, X } from 'lucide-react';
import { SelectedZone } from '../../types';

interface SelectionToolbarProps {
  selectedZones: SelectedZone[];
  totalArea: number;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedZones,
  totalArea,
  onClear,
  onSave,
  onCancel,
}) => {
  // Count zones by type
  const countByType: Record<string, number> = {};
  selectedZones.forEach(zone => {
    const type = zone.type;
    countByType[type] = (countByType[type] || 0) + 1;
  });

  // Type labels in Spanish
  const typeLabels: Record<string, string> = {
    tejado: 'Tejados',
    azotea: 'Azoteas',
    solar_vacio: 'Solares vacíos',
    parque_degradado: 'Parques degradados',
    zona_abandonada: 'Zonas abandonadas',
    espacio_abandonado: 'Espacios abandonados',
    zona_industrial: 'Zonas industriales',
    fachada: 'Fachadas',
    muro: 'Muros',
    otro: 'Otros',
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-lg shadow-2xl border border-gray-200 px-6 py-4 min-w-[600px]">
      <div className="flex items-center justify-between space-x-6">
        {/* Selection Info */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold text-lg">✓</span>
            <span className="font-semibold text-gray-900">
              {selectedZones.length} {selectedZones.length === 1 ? 'zona seleccionada' : 'zonas seleccionadas'}
            </span>
          </div>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div>
            <span className="text-gray-700">Área total:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {totalArea.toFixed(0)} m²
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClear}
            disabled={selectedZones.length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            title="Limpiar selección"
          >
            <Trash2 size={16} />
            <span>Limpiar</span>
          </button>
          
          <button
            onClick={onSave}
            disabled={selectedZones.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            title="Guardar selección"
          >
            <Save size={16} />
            <span>Guardar Selección</span>
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
            title="Cancelar"
          >
            <X size={16} />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      {/* Breakdown by Type */}
      {selectedZones.length > 0 && Object.keys(countByType).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center flex-wrap gap-4">
            {Object.entries(countByType).map(([type, count]) => (
              <div key={type} className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">{typeLabels[type] || type}:</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionToolbar;
