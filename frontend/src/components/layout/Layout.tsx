import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import FullScreenMap from '../maps/FullScreenMap';
import ZoneFormModal from '../modals/ZoneFormModal';
import { Area, FormData } from '../../types';

// Calcular área usando fórmula de Haversine (aproximación para polígonos pequeños)
const calcularArea = (coords: [number, number][]): number => {
  if (coords.length < 3) return 0;

  const R = 6371000; // Radio de la Tierra en metros
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i][0] * Math.PI / 180;
    const lat2 = coords[j][0] * Math.PI / 180;
    const lon1 = coords[i][1] * Math.PI / 180;
    const lon2 = coords[j][1] * Math.PI / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area * R * R / 2);
  return Math.round(area * 100) / 100; // Redondear a 2 decimales
};

const Layout: React.FC = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const tempCoordsRef = useRef<[number, number][]>([]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    tempCoordsRef.current = [];
  };

  const handleCompleteDrawing = (coords: [number, number][]) => {
    if (coords.length < 3) {
      alert('Necesitas al menos 3 puntos para crear un área');
      setIsDrawing(false);
      return;
    }
    tempCoordsRef.current = coords;
    setIsDrawing(false);
    setShowModal(true);
  };

  const handleSaveArea = (formData: FormData) => {
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    const newArea: Area = {
      id: `area-${Date.now()}`,
      nombre: formData.nombre,
      tipo: formData.tipo,
      coordenadas: tempCoordsRef.current,
      areaM2: calcularArea(tempCoordsRef.current),
      notas: formData.notas || undefined,
      fechaCreacion: new Date()
    };

    setAreas([...areas, newArea]);
    setShowModal(false);
    tempCoordsRef.current = [];
  };

  const handleDeleteArea = (id: string) => {
    setAreas(areas.filter(area => area.id !== id));
  };

  const handleCenterArea = (coords: [number, number][]) => {
    // Esta función se puede mejorar para centrar realmente el mapa
    // Por ahora, simplemente mostramos un mensaje
    console.log('Centering map on area:', coords);
    // TODO: Implementar centrado del mapa usando ref del MapContainer
  };

  const handleCloseModal = () => {
    setShowModal(false);
    tempCoordsRef.current = [];
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        isDrawing={isDrawing}
        onStartDrawing={handleStartDrawing}
        areas={areas}
        onDeleteArea={handleDeleteArea}
        onCenterArea={handleCenterArea}
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
      />
      <div className="flex-1">
        <FullScreenMap
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          onCompleteDrawing={handleCompleteDrawing}
          areas={areas}
          onDeleteArea={handleDeleteArea}
        />
      </div>

      <ZoneFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSaveArea}
      />
    </div>
  );
};

export default Layout;
