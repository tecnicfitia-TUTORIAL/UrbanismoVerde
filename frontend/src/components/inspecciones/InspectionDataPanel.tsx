import React, { useState } from 'react';
import { MapPin, Ruler, Compass, Star } from 'lucide-react';
import { InspeccionTejado } from '../../types';

interface InspectionDataPanelProps {
  rooftop: Partial<InspeccionTejado>;
  onSave: (inspectionData: InspeccionTejado) => void;
  onCancel: () => void;
}

const InspectionDataPanel: React.FC<InspectionDataPanelProps> = ({
  rooftop,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nombre: `Inspección ${rooftop.direccion || ''}`,
    notas: '',
    tipo_cubierta: 'plana' as 'plana' | 'inclinada' | 'mixta' | 'desconocido',
    estado_conservacion: 'bueno' as 'excelente' | 'bueno' | 'regular' | 'malo' | 'muy_malo',
    viabilidad_preliminar: 'alta' as 'alta' | 'media' | 'baja' | 'nula',
    prioridad: 3
  });

  const handleSave = () => {
    onSave({
      ...rooftop,
      ...formData
    } as InspeccionTejado);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Datos del Tejado</h2>

      {/* Auto-detected data */}
      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <MapPin size={20} className="text-blue-600 mt-1" />
            <div>
              <div className="font-semibold text-blue-900">Ubicación</div>
              <div className="text-sm text-blue-700">
                {rooftop.direccion}<br />
                {rooftop.codigo_postal} {rooftop.municipio}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Ruler size={16} />
              Área
            </div>
            <div className="text-lg font-semibold">{rooftop.area_m2?.toFixed(2)} m²</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Compass size={16} />
              Orientación
            </div>
            <div className="text-lg font-semibold">{rooftop.orientacion}</div>
          </div>
        </div>
      </div>

      {/* Manual input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Cubierta</label>
          <select
            value={formData.tipo_cubierta}
            onChange={(e) => setFormData({...formData, tipo_cubierta: e.target.value as any})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="plana">Plana</option>
            <option value="inclinada">Inclinada</option>
            <option value="mixta">Mixta</option>
            <option value="desconocido">Desconocido</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Estado de Conservación</label>
          <select
            value={formData.estado_conservacion}
            onChange={(e) => setFormData({...formData, estado_conservacion: e.target.value as any})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="excelente">Excelente</option>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="malo">Malo</option>
            <option value="muy_malo">Muy Malo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Viabilidad Preliminar</label>
          <select
            value={formData.viabilidad_preliminar}
            onChange={(e) => setFormData({...formData, viabilidad_preliminar: e.target.value as any})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
            <option value="nula">Nula</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <Star size={16} />
            Prioridad (1-5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.prioridad}
            onChange={(e) => setFormData({...formData, prioridad: parseInt(e.target.value)})}
            className="w-full"
          />
          <div className="text-center text-sm text-gray-600 mt-1">
            {'★'.repeat(formData.prioridad)}{'☆'.repeat(5 - formData.prioridad)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({...formData, notas: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observaciones, obstrucciones, comentarios..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💾 Guardar Inspección
        </button>
      </div>
    </div>
  );
};

export default InspectionDataPanel;
