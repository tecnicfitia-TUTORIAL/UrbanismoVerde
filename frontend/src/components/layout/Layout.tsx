import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import FullScreenMap from '../maps/FullScreenMap';
import MapWithAnalysis from '../maps/MapWithAnalysis';
import DashboardContent from '../dashboard/DashboardContent';
import ZoneDetailView from '../zones/ZoneDetailView';
import AnalysisWorkflowContent from '../analysis/AnalysisWorkflowContent';
import BudgetGalleryContent from '../budget/BudgetGalleryContent';
import { AnalysisResults } from '../analysis/AnalysisResults';
import { AnalysisReportPage } from '../analysis/AnalysisReportPage';
import SpecializedAnalysisDetail from '../analysis/SpecializedAnalysisDetail';
import InspeccionTejadosView from '../inspecciones/InspeccionTejadosView';
import ReportView from '../reports/ReportView';
import ProyectosView from '../proyectos/ProyectosView';
import { Area, GeoJSONPolygon, AreaBounds, UrbanAnalysisReport } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';
import { coordinatesToGeoJSON } from '../../services/ai-analysis';
import { analyzeUrbanArea } from '../../services/urban-analysis';
import { supabase, TABLES } from '../../config/supabase';
import { deleteZonaVerde } from '../../services/zona-storage';
import { SpecializedAnalysisWithZone } from '../../services/specialized-analysis-service';
import { Z_INDEX } from '../../constants/zIndex';

// Type guard to check if an object is an Area
const isArea = (obj: unknown): obj is Area => {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'nombre' in obj &&
    'tipo' in obj &&
    'coordenadas' in obj &&
    'areaM2' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).nombre === 'string' &&
    typeof (obj as any).tipo === 'string' &&
    Array.isArray((obj as any).coordenadas) &&
    typeof (obj as any).areaM2 === 'number';
};

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

  // Urban Analysis state
  const [isAnalyzingUrban, setIsAnalyzingUrban] = useState(false);
  const [urbanReport, setUrbanReport] = useState<UrbanAnalysisReport | null>(null);
  const [showUrbanReport, setShowUrbanReport] = useState(false);

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

  // Urban Analysis handlers
  const handleUrbanAreaSelected = async (bounds: AreaBounds) => {
    console.log('🗺️ Area selected for urban analysis:', bounds);
    setIsAnalyzingUrban(true);
    
    try {
      const report = await analyzeUrbanArea(bounds);
      setUrbanReport(report);
      setShowUrbanReport(true);
      toast.success('Análisis completado');
    } catch (error) {
      console.error('❌ Error analyzing urban area:', error);
      toast.error('Error al analizar el área');
    } finally {
      setIsAnalyzingUrban(false);
    }
  };

  const handleCloseUrbanReport = () => {
    setShowUrbanReport(false);
    setUrbanReport(null);
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
    
    // Handle direct area/zone object or wrapped in selectedArea
    if (data) {
      if (data.selectedArea) {
        setSelectedArea(data.selectedArea);
      } else if (isArea(data)) {
        // Direct area object passed (from ZonesGalleryContent)
        setSelectedArea(data);
      }
      
      if (data.selectedSpecializedAnalysis) {
        setSelectedSpecializedAnalysis(data.selectedSpecializedAnalysis);
      }
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

  // Render content based on current view - SIMPLIFIED TO 6 MAIN CASES
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardContent areas={areas} onNavigate={handleNavigate} />;
      
      // Unified projects view - replaces multiple zone/analysis views
      case 'proyectos':
      case 'zonas-gallery':
      case 'zonas':
      case 'zonas-search':
      case 'analisis-especializados':
      case 'conjuntos-zonas':
        return (
          <ProyectosView
            areas={areas}
            onNavigate={handleNavigate}
            onDeleteArea={handleDeleteArea}
            onSelectZone={setSelectedArea}
          />
        );
      
      case 'zonas-detail':
        return selectedArea ? (
          <ZoneDetailView
            zone={selectedArea}
            onBack={() => setCurrentView('proyectos')}
            onViewAnalysis={(zoneId) => {
              toast.error('Vista de análisis no implementada aún');
            }}
          />
        ) : (
          <div>No zone selected</div>
        );
      
      case 'analisis-especializado-detalle':
        return selectedSpecializedAnalysis ? (
          <SpecializedAnalysisDetail
            analysis={selectedSpecializedAnalysis}
            onBack={() => setCurrentView('proyectos')}
          />
        ) : null;
      
      case 'inspecciones-tejados':
        return <InspeccionTejadosView onNavigate={handleNavigate} />;
      
      // Analysis workflows
      case 'analisis-new':
      case 'analisis-point':
      case 'analisis-zone':
      case 'analisis':
      case 'analisis-history':
        return <AnalysisWorkflowContent areas={areas} onNavigate={handleNavigate} />;
      
      // Budget views
      case 'presupuestos-gallery':
      case 'presupuestos':
        return <BudgetGalleryContent areas={areas} onNavigate={handleNavigate} />;
      
      // Map-based views
      case 'presupuestos-create':
      case 'presupuestos-detail':
      case 'zonas-create':
      case 'analisis-urbano':
        // Show map for these views
        return null;
      
      default:
        return <DashboardContent areas={areas} onNavigate={handleNavigate} />;
    }
  };

  const showMap = currentView === 'zonas-create' || currentView === 'presupuestos-create' || currentView === 'presupuestos-detail' || isDrawing;
  const showUrbanMap = currentView === 'analisis-urbano';

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
      
      {showUrbanMap ? (
        <div className="flex-1 relative">
          <MapWithAnalysis 
            onAreaSelected={handleUrbanAreaSelected}
            disabled={isAnalyzingUrban}
          />
          
          {/* Loading overlay while analyzing */}
          {isAnalyzingUrban && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center"
              style={{ zIndex: Z_INDEX.PAGE_OVERLAY }}
            >
              <div className="bg-white rounded-lg p-6 text-center max-w-md">
                <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                <div className="font-semibold text-lg mb-2">🤖 Analizando área...</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>✓ Detectando tejados</div>
                  <div>✓ Analizando con IA...</div>
                  <div>⏳ Generando informe...</div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Esto puede tardar 30-60 segundos
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showMap ? (
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
              style={{ zIndex: Z_INDEX.PAGE_OVERLAY }}
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
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-auto" 
              style={{ zIndex: Z_INDEX.SAVE_DIALOG_OVERLAY }}
            >
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

      {/* Urban Analysis Report Modal */}
      {showUrbanReport && urbanReport && (
        <ReportView
          report={urbanReport}
          onClose={handleCloseUrbanReport}
        />
      )}
    </div>
  );
};

export default Layout;
