import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import FullScreenMap from '../maps/FullScreenMap';
import ZoneFormModal from '../modals/ZoneFormModal';
import DashboardContent from '../dashboard/DashboardContent';
import ZonesGalleryContent from '../zones/ZonesGalleryContent';
import ZoneDetailContent from '../zones/ZoneDetailContent';
import AnalysisWorkflowContent from '../analysis/AnalysisWorkflowContent';
import BudgetGalleryContent from '../budget/BudgetGalleryContent';
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
  const [currentView, setCurrentView] = useState('dashboard');
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

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    if (data) {
      setSelectedArea(data);
    }
    if (view === 'zonas-create') {
      setIsDrawing(true);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'zonas-create') {
      handleStartDrawing();
    }
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardContent areas={areas} onNavigate={handleNavigate} />;
      
      case 'zonas-gallery':
      case 'zonas':
      case 'zonas-search':
        return (
          <ZonesGalleryContent
            areas={areas}
            onSelectZone={setSelectedArea}
            onNavigate={handleNavigate}
            onDeleteArea={handleDeleteArea}
          />
        );
      
      case 'zonas-detail':
        return selectedArea ? (
          <ZoneDetailContent
            area={selectedArea}
            onBack={() => setCurrentView('zonas-gallery')}
            onNavigate={handleNavigate}
            onDelete={handleDeleteArea}
          />
        ) : null;
      
      case 'analisis-new':
      case 'analisis-point':
      case 'analisis-zone':
      case 'analisis':
      case 'analisis-history':
        return <AnalysisWorkflowContent areas={areas} onNavigate={handleNavigate} />;
      
      case 'presupuestos-gallery':
      case 'presupuestos':
        return <BudgetGalleryContent areas={areas} onNavigate={handleNavigate} />;
      
      case 'presupuestos-create':
      case 'presupuestos-detail':
      case 'zonas-create':
        // Show map for these views
        return null;
      
      default:
        return <DashboardContent areas={areas} onNavigate={handleNavigate} />;
    }
  };

  const showMap = currentView === 'zonas-create' || currentView === 'presupuestos-create' || currentView === 'presupuestos-detail' || isDrawing;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isDrawing={isDrawing}
        onStartDrawing={handleStartDrawing}
        areas={areas}
        onDeleteArea={handleDeleteArea}
        onCenterArea={handleCenterArea}
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
        activeView={currentView}
        onViewChange={handleViewChange}
      />
      
      {showMap ? (
        <div className="flex-1">
          <FullScreenMap
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            onCompleteDrawing={handleCompleteDrawing}
            areas={areas}
            onDeleteArea={handleDeleteArea}
          />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="transition-opacity duration-200 animate-fade-in">
            {renderContent()}
          </div>
        </main>
      )}

      <ZoneFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSaveArea}
      />
    </div>
  );
};

export default Layout;
