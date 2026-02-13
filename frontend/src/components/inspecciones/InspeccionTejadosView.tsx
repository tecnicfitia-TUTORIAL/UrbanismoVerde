import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import RooftopInspectionMap from './RooftopInspectionMap';
import InspectionDataPanel from './InspectionDataPanel';
import InspectionsList from './InspectionsList';
import MultiSelectionToolbar from './MultiSelectionToolbar';
import AIAnalysisPanel from './AIAnalysisPanel';
import { InspeccionTejado } from '../../types';
import {
  saveInspeccion,
  loadInspecciones,
  deleteInspeccion,
  reverseGeocode,
  calculateCentroid,
  calculatePolygonArea,
  calculatePerimeter,
  calculateOrientation,
  captureRooftopImage,
  analyzeRooftopWithAI,
  batchAnalyzeRooftops,
  batchSaveInspecciones,
  AIAnalysisResult
} from '../../services/inspeccion-service';

interface InspeccionTejadosViewProps {
  onNavigate?: (view: string) => void;
}

interface SelectedRooftop extends Partial<InspeccionTejado> {
  tempId?: string;
}

const InspeccionTejadosView: React.FC<InspeccionTejadosViewProps> = ({ onNavigate }) => {
  const [selectedRooftop, setSelectedRooftop] = useState<SelectedRooftop | null>(null);
  const [inspections, setInspections] = useState<InspeccionTejado[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Multi-selection state
  const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
  const [selectedRooftops, setSelectedRooftops] = useState<SelectedRooftop[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AIAnalysisResult[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);

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
      const coords = geometry.coordinates[0];
      const area = calculatePolygonArea(coords);
      const perimeter = calculatePerimeter(coords);
      const orientation = calculateOrientation(coords);
      const centroid = calculateCentroid(coords);

      const rooftopData: SelectedRooftop = {
        tempId: `temp-${Date.now()}-${Math.random()}`,
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
      };

      // If in multi-selection mode, add to selection array
      if (selectionMode === 'multi') {
        setSelectedRooftops([...selectedRooftops, rooftopData]);
        toast.dismiss(loadingToast);
        toast.success(`${selectedRooftops.length + 1} tejados seleccionados`);
      } else {
        // Single selection mode - open inspection form
        setSelectedRooftop(rooftopData);
        setIsInspecting(true);
        toast.dismiss(loadingToast);
        toast.success('Datos del tejado obtenidos');
      }
    } catch (error) {
      console.error('Error processing rooftop:', error);
      toast.error('Error al procesar el tejado');
    }
  };

  const handleClearSelection = () => {
    setSelectedRooftops([]);
    setAiResults([]);
    setShowAIResults(false);
    toast.success('Selección limpiada');
  };

  const handleAnalyzeWithAI = async () => {
    if (selectedRooftops.length === 0) {
      toast.error('No hay tejados seleccionados para analizar');
      return;
    }

    setIsAnalyzing(true);
    const loadingToast = toast.loading(`Analizando ${selectedRooftops.length} tejados con IA...`);

    try {
      // Prepare data for batch analysis
      const rooftopsForAnalysis = await Promise.all(
        selectedRooftops.map(async (rooftop) => {
          const imageUrl = await captureRooftopImage(rooftop.coordenadas!);
          return {
            coordinates: rooftop.coordenadas!,
            imageUrl: imageUrl,
            area_m2: rooftop.area_m2!,
            orientacion: rooftop.orientacion!
          };
        })
      );

      // Perform batch analysis
      const results = await batchAnalyzeRooftops(rooftopsForAnalysis);
      
      setAiResults(results);
      setShowAIResults(true);
      toast.dismiss(loadingToast);
      toast.success(`¡Análisis completado! ${results.length} tejados analizados`);
    } catch (error) {
      console.error('Error analyzing rooftops:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al analizar tejados con IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = async () => {
    if (selectedRooftops.length === 0 || aiResults.length === 0) {
      toast.error('No hay resultados para guardar');
      return;
    }

    const loadingToast = toast.loading(`Guardando ${selectedRooftops.length} inspecciones...`);

    try {
      const inspectionsToSave: InspeccionTejado[] = selectedRooftops.map((rooftop, idx) => {
        const aiResult = aiResults[idx];
        
        return {
          nombre: `Inspección ${rooftop.direccion || idx + 1}`,
          direccion: rooftop.direccion!,
          numero: rooftop.numero,
          municipio: rooftop.municipio!,
          provincia: rooftop.provincia,
          codigo_postal: rooftop.codigo_postal!,
          pais: rooftop.pais,
          coordenadas: rooftop.coordenadas!,
          centroide: rooftop.centroide!,
          area_m2: rooftop.area_m2!,
          perimetro_m: rooftop.perimetro_m!,
          orientacion: rooftop.orientacion!,
          tipo_cubierta: aiResult.tipo_cubierta,
          estado_conservacion: aiResult.estado_conservacion,
          inclinacion_estimada: aiResult.inclinacion_estimada,
          obstrucciones: aiResult.obstrucciones,
          viabilidad_preliminar: 'media',
          prioridad: 3,
          analisis_ia_resultado: aiResult,
          analisis_ia_confianza: aiResult.confianza,
          fecha_analisis_ia: new Date().toISOString(),
          notas: aiResult.notas_ia
        };
      });

      const savedIds = await batchSaveInspecciones(inspectionsToSave);
      
      // Reload inspections
      await loadExistingInspections();
      
      // Clear selection
      setSelectedRooftops([]);
      setAiResults([]);
      setShowAIResults(false);
      
      toast.dismiss(loadingToast);
      toast.success(`¡${savedIds.length} inspecciones guardadas exitosamente!`);
    } catch (error) {
      console.error('Error saving inspections:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al guardar las inspecciones');
    }
  };

  const handleEditAIResult = (index: number) => {
    // Set the selected rooftop with AI result for manual editing
    const rooftop = selectedRooftops[index];
    const aiResult = aiResults[index];
    
    setSelectedRooftop({
      ...rooftop,
      tipo_cubierta: aiResult.tipo_cubierta,
      estado_conservacion: aiResult.estado_conservacion,
      inclinacion_estimada: aiResult.inclinacion_estimada,
      obstrucciones: aiResult.obstrucciones,
      notas: aiResult.notas_ia,
      analisis_ia_resultado: aiResult,
      analisis_ia_confianza: aiResult.confianza,
      revisado_por_usuario: true
    });
    setIsInspecting(true);
    setShowAIResults(false);
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

  const toggleSelectionMode = () => {
    const newMode = selectionMode === 'single' ? 'multi' : 'single';
    setSelectionMode(newMode);
    
    if (newMode === 'single') {
      // Clear multi-selection when switching to single mode
      handleClearSelection();
    }
    
    toast.success(`Modo ${newMode === 'multi' ? 'multi-selección' : 'selección simple'} activado`);
  };

  return (
    <div className="h-screen flex relative">
      {/* Multi-selection toolbar */}
      <MultiSelectionToolbar
        count={selectedRooftops.length}
        onClear={handleClearSelection}
        onAnalyze={handleAnalyzeWithAI}
        onSave={handleSaveAll}
        isAnalyzing={isAnalyzing}
        hasResults={aiResults.length > 0}
      />

      {/* Map (70% width) */}
      <div className="w-[70%] relative">
        <RooftopInspectionMap
          onRooftopClick={handleRooftopClick}
          selectedRooftop={selectedRooftop}
          existingInspections={inspections}
          selectedRooftops={selectedRooftops}
          selectionMode={selectionMode}
        />
        
        {/* Selection mode toggle button */}
        <button
          onClick={toggleSelectionMode}
          className={`absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg font-medium transition-all z-10 ${
            selectionMode === 'multi'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {selectionMode === 'multi' ? '✓ Multi-Selección' : '+ Multi-Selección'}
        </button>
      </div>

      {/* Sidebar (30% width) */}
      <div className="w-[30%] bg-white border-l overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : showAIResults && aiResults.length > 0 ? (
          <AIAnalysisPanel
            results={aiResults}
            onEdit={handleEditAIResult}
            onSave={handleSaveAll}
          />
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
