/**
 * SaveSelectionModal Component
 * 
 * Modal for saving a collection of selected zones.
 * Allows user to provide a name and optional description.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SelectedZone } from '../../types';

interface SaveSelectionModalProps {
  isOpen: boolean;
  selectedZones: SelectedZone[];
  onSave: (nombre: string, descripcion?: string) => Promise<void>;
  onClose: () => void;
}

export const SaveSelectionModal: React.FC<SaveSelectionModalProps> = ({
  isOpen,
  selectedZones,
  onSave,
  onClose,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setDescripcion('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate summary
  const totalArea = selectedZones.reduce((sum, zone) => sum + zone.area_m2, 0);
  const countByType: Record<string, number> = {};
  selectedZones.forEach(zone => {
    countByType[zone.type] = (countByType[zone.type] || 0) + 1;
  });

  // Type labels in Spanish
  const typeLabels: Record<string, string> = {
    tejado: 'tejados',
    azotea: 'azoteas',
    solar_vacio: 'solares vacíos',
    parque_degradado: 'parques degradados',
    zona_abandonada: 'zonas abandonadas',
    espacio_abandonado: 'espacios abandonados',
    zona_industrial: 'zonas industriales',
    otro: 'otros',
  };

  const handleSave = async () => {
    // Validate
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave(nombre.trim(), descripcion.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Error saving conjunto:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el conjunto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4"
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Guardar Conjunto de Zonas
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Manzana Centro - Tejados Prioritarios"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: 5 tejados aptos para instalación inmediata"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Resumen de selección:
            </h3>
            <ul className="space-y-1 text-sm text-gray-700">
              {Object.entries(countByType).map(([type, count]) => (
                <li key={type}>
                  • {count} {typeLabels[type] || type} ({(selectedZones.filter(z => z.type === type).reduce((sum, z) => sum + z.area_m2, 0)).toFixed(0)} m²)
                </li>
              ))}
              <li className="font-semibold pt-1 border-t border-gray-200 mt-2">
                • Área total: {totalArea.toFixed(0)} m²
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nombre.trim() || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar Conjunto'}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="px-6 pb-3 text-xs text-gray-500 text-center">
          Presiona <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Ctrl+Enter</kbd> para guardar
        </div>
      </div>
    </div>
  );
};

export default SaveSelectionModal;
