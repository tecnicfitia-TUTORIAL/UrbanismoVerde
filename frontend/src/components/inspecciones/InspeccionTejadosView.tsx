import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import RooftopInspectionMap from './RooftopInspectionMap';
import InspectionDataPanel from './InspectionDataPanel';
import InspectionsList from './InspectionsList';
import { InspeccionTejado } from '../../types';
import {
  saveInspeccion,
  loadInspecciones,
  deleteInspeccion,
  reverseGeocode,
  calculateCentroid,
  calculatePolygonArea,
  calculatePerimeter,
  calculateOrientation
} from '../../services/inspeccion-service';

interface InspeccionTejadosViewProps {
  onNavigate?: (view: string) => void;
}

const InspeccionTejadosView: React.FC<InspeccionTejadosViewProps> = ({ onNavigate }) => {
  const [selectedRooftop, setSelectedRooftop] = useState<Partial<InspeccionTejado> | null>(null);
  const [inspections, setInspections] = useState<InspeccionTejado[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing inspections on mount
  useEffect(() => {
    loadExistingInspections();
  }, []);

  const loadExistingInspections = async () => {
    try {
      setIsLoading(true);
      const data = await loadInspecciones();
      setInspections(data);
    } catch (error) {
      console.error('Error loading inspections:', error);
      toast.error('Error al cargar inspecciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRooftopClick = async (geometry: any, coordinates: [number, number]) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Obteniendo información del tejado...');

      // Reverse geocode to get address
      const address = await reverseGeocode(coordinates[0], coordinates[1]);

      // Calculate metrics
      // Note: coords will be in [lon, lat] order (GeoJSON standard)
      const coords = geometry.coordinates[0].map(
        ([lon, lat]: [number, number]) => [lon, lat] as [number, number]
      );
      const area = calculatePolygonArea(coords);
      const perimeter = calculatePerimeter(coords);
      const orientation = calculateOrientation(coords);
      const centroid = calculateCentroid(coords);

      // No need to convert - geometry is already in GeoJSON [lon, lat] format

      setSelectedRooftop({
        coordenadas: {
          type: 'Polygon',
          coordinates: [coords]
        },
        centroide: centroid,
        direccion: address.street || 'Dirección no disponible',
        numero: address.number,
        municipio: address.city || 'Municipio no disponible',
        provincia: address.province,
        codigo_postal: address.postalCode,
        pais: address.country,
        area_m2: area,
        perimetro_m: perimeter,
        orientacion: orientation
      });

      setIsInspecting(true);
      toast.dismiss(loadingToast);
      toast.success('Datos del tejado obtenidos');
    } catch (error) {
      console.error('Error processing rooftop:', error);
      toast.error('Error al procesar el tejado');
    }
  };

  const handleSaveInspection = async (inspectionData: InspeccionTejado) => {
    try {
      const loadingToast = toast.loading('Guardando inspección...');
      const saved = await saveInspeccion(inspectionData);
      setInspections([saved, ...inspections]);
      setIsInspecting(false);
      setSelectedRooftop(null);
      toast.dismiss(loadingToast);
      toast.success('Inspección guardada exitosamente');
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('Error al guardar la inspección');
    }
  };

  const handleDeleteInspection = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta inspección?')) {
      return;
    }

    try {
      await deleteInspeccion(id);
      setInspections(inspections.filter(i => i.id !== id));
      toast.success('Inspección eliminada');
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast.error('Error al eliminar la inspección');
    }
  };

  const handleSelectInspection = (inspection: InspeccionTejado) => {
    setSelectedRooftop(inspection);
    setIsInspecting(false);
  };

  return (
    <div className="h-screen flex">
      {/* Map (70% width) */}
      <div className="w-[70%] relative">
        <RooftopInspectionMap
          onRooftopClick={handleRooftopClick}
          selectedRooftop={selectedRooftop}
          existingInspections={inspections}
        />
      </div>

      {/* Sidebar (30% width) */}
      <div className="w-[30%] bg-white border-l overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : isInspecting && selectedRooftop ? (
          <InspectionDataPanel
            rooftop={selectedRooftop}
            onSave={handleSaveInspection}
            onCancel={() => {
              setIsInspecting(false);
              setSelectedRooftop(null);
            }}
          />
        ) : (
          <InspectionsList
            inspections={inspections}
            onSelectInspection={handleSelectInspection}
            onDeleteInspection={handleDeleteInspection}
          />
        )}
      </div>
    </div>
  );
};

export default InspeccionTejadosView;
