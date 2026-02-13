import React, { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Ruler, Trash2, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Breadcrumbs from '../common/Breadcrumbs';
import { toast } from 'react-hot-toast';
import { deleteZonaVerde } from '../../services/zona-storage';
import { calculateCenter, calculateBounds } from '../../utils/map-helpers';

interface ZoneDetailViewProps {
  zone: {
    id: string;
    nombre: string;
    tipo: string;
    coordenadas: [number, number][];
    areaM2: number;
    created_at?: string;
  };
  onBack: () => void;
  onViewAnalysis?: (zoneId: string) => void;
}

const ZoneDetailView: React.FC<ZoneDetailViewProps> = ({
  zone,
  onBack,
  onViewAnalysis
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const breadcrumbItems = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Zonas Verdes', path: 'zonas' },
    { label: zone.nombre }
  ];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteZonaVerde(zone.id);
      toast.success('Zona eliminada exitosamente');
      onBack();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Error al eliminar la zona');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Calculate center and bounds for the map
  const center = calculateCenter(zone.coordenadas);
  const bounds = calculateBounds(zone.coordenadas);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {zone.nombre}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {getTipoLabel(zone.tipo)}
                  </span>
                  {zone.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(zone.created_at).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={20} />
              <span>Eliminar Zona</span>
            </button>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
          <div className="relative h-96 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={center}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              bounds={bounds}
              boundsOptions={{ padding: [50, 50] }}
            >
              <TileLayer
                url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                attribution='&copy; Google'
              />
              <Polygon
                positions={zone.coordenadas}
                pathOptions={{
                  color: '#16a34a',
                  fillColor: '#22c55e',
                  fillOpacity: 0.3,
                  weight: 3
                }}
              />
            </MapContainer>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Ruler size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Área</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {zone.areaM2.toLocaleString('es-ES')} m²
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Tipo</h3>
            </div>
            <p className="text-lg font-medium text-gray-700">
              {getTipoLabel(zone.tipo)}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">Coordenadas</h3>
            </div>
            <p className="text-sm text-gray-600">
              {zone.coordenadas.length} puntos definidos
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          <div className="flex gap-3">
            {onViewAnalysis && (
              <button
                onClick={() => onViewAnalysis(zone.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Análisis
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">¿Eliminar Zona Verde?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. Se eliminará permanentemente la zona "{zone.nombre}".
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    azotea: 'Azotea',
    tejado: 'Tejado',
    solar_vacio: 'Solar Vacío',
    parque_degradado: 'Parque Degradado',
    zona_abandonada: 'Zona Abandonada',
    espacio_abandonado: 'Espacio Abandonado',
    zona_industrial: 'Zona Industrial',
    fachada: 'Fachada',
    muro: 'Muro',
    otro: 'Otro'
  };
  return labels[tipo] || tipo;
}

export default ZoneDetailView;
