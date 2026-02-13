import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import FullScreenMap from '../maps/FullScreenMap';
import DashboardContent from '../dashboard/DashboardContent';
import ZonesGalleryContent from '../zones/ZonesGalleryContent';
import ZoneDetailContent from '../zones/ZoneDetailContent';
import AnalysisWorkflowContent from '../analysis/AnalysisWorkflowContent';
import BudgetGalleryContent from '../budget/BudgetGalleryContent';
import { AnalysisResults } from '../analysis/AnalysisResults';
import { AnalysisReportPage } from '../analysis/AnalysisReportPage';
import SpecializedAnalysisGallery from '../analysis/SpecializedAnalysisGallery';
import SpecializedAnalysisDetail from '../analysis/SpecializedAnalysisDetail';
import ConjuntosGallery from '../conjuntos/ConjuntosGallery';
import { Area, FormData, GeoJSONPolygon } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';
import { coordinatesToGeoJSON } from '../../services/ai-analysis';
import { supabase, TABLES } from '../../config/supabase';
import { saveZonaVerde, loadZonasVerdes, deleteZonaVerde } from '../../services/zona-storage';
import { SpecializedAnalysisWithZone } from '../../services/specialized-analysis-service';

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
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedSpecializedAnalysis, setSelectedSpecializedAnalysis] = useState<SpecializedAnalysisWithZone | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [dbZonasCount, setDbZonasCount] = useState(0);
  const tempCoordsRef = useRef<[number, number][]>([]);
  
  // AI Analysis state
  const { analyze, isAnalyzing, result: analysisResult, reset: resetAnalysis } = useAnalysis();
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<GeoJSONPolygon | null>(null);

  const loadZonasCount = async () => {
    try {
      const { count } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('*', { count: 'exact', head: true });
      
      setDbZonasCount(count || 0);
      console.log(`📊 Zonas en BD: ${count}`);
    } catch (error) {
      console.error('Error al cargar contador de zonas:', error);
    }
  };

  // Load DB zones count and subscribe to real-time updates
  useEffect(() => {
    loadZonasCount();
    
    // Subscribe to real-time changes in zonas_verdes table
    const subscription = supabase
      .channel('zonas-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.ZONAS_VERDES,
        },
        () => {
          console.log('🔄 Zonas actualizadas, recargando contador...');
          loadZonasCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    tempCoordsRef.current = [];
  };

  const handleCompleteDrawing = async (coords: [number, number][]) => {
    // Validate minimum points
    if (coords.length < 3) {
      toast.error('Polígono inválido: se requieren al menos 3 puntos', {
        duration: 4000,
        icon: '⚠️',
      });
      setIsDrawing(false);
      return;
    }
    
    // Calculate approximate area for validation (rough estimate)
    const areaEstimada = calcularArea(coords);
    
    // Validate minimum area (50 m²)
    if (areaEstimada < 50) {
      toast.error('Área muy pequeña: se requiere un mínimo de 50 m²', {
        duration: 4000,
        icon: '⚠️',
      });
      setIsDrawing(false);
      return;
    }
    
    tempCoordsRef.current = coords;
    setIsDrawing(false);
    
    // Automatically analyze the drawn polygon
    console.log('🎯 Polígono completado, iniciando análisis automático...');
    try {
      const result = await analyze(coords);
      if (result && result.success) {
        // Convert coordinates to GeoJSON for the report page
        const geoJSONPolygon = coordinatesToGeoJSON(coords);
        setCurrentPolygon(geoJSONPolygon);
        
        // Show new comprehensive report page instead of simple modal
        setShowAnalysisReport(true);
      } else {
        // Analysis failed - show error and allow retry
        toast.error('No se pudo analizar la zona. Por favor, intenta de nuevo.');
        // Clear drawing state
        tempCoordsRef.current = [];
        setIsDrawing(false);
      }
    } catch (error) {
      console.error('Error en análisis automático:', error);
      toast.error('Error al analizar la zona. Por favor, intenta de nuevo.');
      tempCoordsRef.current = [];
      setIsDrawing(false);
    }
  };

  const handleGenerateBudget = () => {
    console.log('💰 Generando presupuesto con datos del análisis...');
    // Just close the report - budget generation will be implemented separately
    setShowAnalysisReport(false);
    setShowAnalysisResults(false);
    toast.info('función de presupuesto en desarrollo');
  };
  
  const handleCloseAnalysisResults = () => {
    setShowAnalysisResults(false);
    // Clear drawing state
    tempCoordsRef.current = [];
  };

  const handleCloseAnalysisReport = () => {
    setShowAnalysisReport(false);
    setCurrentPolygon(null);
    // Clear drawing state
    tempCoordsRef.current = [];
  };

  const handleDeleteArea = async (id: string) => {
    try {
      // Try to delete from database first
      await deleteZonaVerde(id);
      console.log('✅ Zona eliminada de la base de datos:', id);
      
      // Reload zones count
      await loadZonasCount();
    } catch (error) {
      console.error('Error deleting zone from database:', error);
      // Fallback: remove from local state only (for backward compatibility)
      setAreas(areas.filter(area => area.id !== id));
    }
  };

  const handleCenterArea = (coords: [number, number][]) => {
    // Esta función se puede mejorar para centrar realmente el mapa
    // Por ahora, simplemente mostramos un mensaje
    console.log('Centering map on area:', coords);
    // TODO: Implementar centrado del mapa usando ref del MapContainer
  };

  const handleNavigate = (view: string, data?: any) => {
    console.log('Navigating to:', view, data);
    setCurrentView(view);
    
    if (data?.selectedArea) {
      setSelectedArea(data.selectedArea);
    }
    if (data?.selectedSpecializedAnalysis) {
      setSelectedSpecializedAnalysis(data.selectedSpecializedAnalysis);
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
      
      case 'analisis-especializados':
        return <SpecializedAnalysisGallery onNavigate={handleNavigate} />;
      
      case 'analisis-especializado-detalle':
        return selectedSpecializedAnalysis ? (
          <SpecializedAnalysisDetail
            analysis={selectedSpecializedAnalysis}
            onBack={() => setCurrentView('analisis-especializados')}
          />
        ) : null;
      
      case 'conjuntos-zonas':
        return (
          <ConjuntosGallery
            onViewOnMap={(conjuntoId) => {
              console.log('View conjunto on map:', conjuntoId);
              toast.info('Visualización en mapa en desarrollo');
            }}
            onConjuntoDeleted={() => {
              // Reload count in sidebar
              loadZonasCount();
            }}
          />
        );
      
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
        dbZonasCount={dbZonasCount}
        onDeleteArea={handleDeleteArea}
        onCenterArea={handleCenterArea}
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
        activeView={currentView}
        onViewChange={handleViewChange}
      />
      
      {showMap ? (
        <div className="flex-1 relative">
          <FullScreenMap
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            onCompleteDrawing={handleCompleteDrawing}
            areas={areas}
            onDeleteArea={handleDeleteArea}
          />
          
          {/* Loading overlay while analyzing */}
          {isAnalyzing && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center"
              style={{ zIndex: 9999 }}
            >
              <div className="bg-white rounded-lg p-6 text-center max-w-md">
                <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                <div className="font-semibold text-lg mb-2">Analizando con IA...</div>
                <div className="text-sm text-gray-600">
                  Procesando imagen satelital y detectando características
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Esto puede tardar hasta 10 segundos
                </div>
              </div>
            </div>
          )}
          
          {/* Analysis results overlay */}
          {showAnalysisResults && analysisResult && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-auto" style={{ zIndex: 9999 }}>
              <AnalysisResults
                analysis={analysisResult}
                onGenerateBudget={handleGenerateBudget}
                onClose={handleCloseAnalysisResults}
              />
            </div>
          )}
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="transition-opacity duration-200 animate-fade-in">
            {renderContent()}
          </div>
        </main>
      )}

      {/* New Comprehensive Analysis Report Page */}
      {showAnalysisReport && analysisResult && currentPolygon && (
        <AnalysisReportPage
          analysisResult={analysisResult}
          polygon={currentPolygon}
          zoneName={`Zona ${new Date().toLocaleDateString('es-ES')}`}
          onClose={handleCloseAnalysisReport}
        />
      )}
    </div>
  );
};

export default Layout;
