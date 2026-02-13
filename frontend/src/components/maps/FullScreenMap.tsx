import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, LayersControl, Marker } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Area, coloresPorTipo, SelectedZone } from '../../types';
import { AnalysisPanel } from '../panels/AnalysisPanel';
import { DrawingToolsPanel } from '../panels/DrawingToolsPanel';
import { DrawingMarkers } from './DrawingMarker';
import SearchControl from './SearchControl';
import MultiSelectionMode from './MultiSelectionMode';
import SelectionToolbar from './SelectionToolbar';
import SaveSelectionModal from './SaveSelectionModal';
import { saveConjuntoZonas } from '../../services/conjunto-zonas-service';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom icon for search marker
const searchMarkerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDQ4QzE2IDQ4IDMyIDI4IDE2IDhDMTYgOCAwIDI4IDE2IDQ4WiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

interface FullScreenMapProps {
  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
  onCompleteDrawing: (coords: [number, number][]) => void;
  areas: Area[];
  onDeleteArea: (id: string) => void;
}

// Componente para manejar eventos de dibujo en el mapa
const DrawingHandler: React.FC<{
  isDrawing: boolean;
  onPointClick: (latlng: LatLng) => void;
  onAnalysisClick: (latlng: LatLng) => void;
}> = ({ isDrawing, onPointClick, onAnalysisClick }) => {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onPointClick(e.latlng);
      } else {
        // Si no está dibujando, permitir análisis
        onAnalysisClick(e.latlng);
      }
    }
  });
  return null;
};

const FullScreenMap: React.FC<FullScreenMapProps> = ({
  isDrawing,
  setIsDrawing,
  onCompleteDrawing,
  areas,
  onDeleteArea
}) => {
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const tempCoordsRef = useRef<[number, number][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Multi-selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedZones, setSelectedZones] = useState<SelectedZone[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Deshacer último punto
  const handleUndoPoint = useCallback(() => {
    setCurrentPolygon(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
  }, []);

  // Reiniciar todo
  const handleResetDrawing = useCallback(() => {
    setCurrentPolygon([]);
    setIsDrawing(true);
  }, [setIsDrawing]);

  // Cancelar dibujo
  const handleCancelDrawing = useCallback(() => {
    setCurrentPolygon([]);
    setIsDrawing(false);
  }, [setIsDrawing]);

  // Completar polígono
  const handleCompleteDrawing = useCallback(() => {
    if (currentPolygon.length >= 3) {
      onCompleteDrawing(currentPolygon);
      setCurrentPolygon([]);
      setIsDrawing(false);
    }
  }, [currentPolygon, onCompleteDrawing, setIsDrawing]);

  // Manejar click en el mapa para agregar punto
  const handleMapClick = (latlng: LatLng) => {
    const newPoint: [number, number] = [latlng.lat, latlng.lng];
    setCurrentPolygon(prev => [...prev, newPoint]);
  };

  // Hook para atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isDrawing) return;

      switch(e.key) {
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleUndoPoint();
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleCancelDrawing();
          break;
        case 'Enter':
          if (currentPolygon.length >= 3) {
            e.preventDefault();
            handleCompleteDrawing();
          }
          break;
        case 'Backspace':
          e.preventDefault();
          handleUndoPoint();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDrawing, currentPolygon, handleUndoPoint, handleCancelDrawing, handleCompleteDrawing]);

  // Reiniciar el polígono actual cuando se cancela el dibujo
  React.useEffect(() => {
    if (!isDrawing) {
      setCurrentPolygon([]);
    }
  }, [isDrawing]);

  const handleDeleteArea = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      onDeleteArea(id);
    }
  };

  // Handle location selection from search
  const handleLocationSelected = (lat: number, lng: number, label: string) => {
    setSearchMarker({ lat, lng, label });
  };

  // Clear search marker when starting to draw or clicking on map
  const handleMapClickWrapper = (latlng: LatLng) => {
    setSearchMarker(null);
    handleMapClick(latlng);
  };

  // Multi-selection handlers
  const handleStartSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedZones([]);
    // Disable drawing mode if active
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentPolygon([]);
    }
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedZones([]);
  };

  const handleOpenSaveModal = () => {
    setShowSaveModal(true);
  };

  const handleSaveSelection = async (nombre: string, descripcion?: string) => {
    try {
      // Convert selected zones to ZonaEnConjunto format
      const zonas = selectedZones.map((zone, index) => ({
        tipo_zona: zone.type,
        coordenadas: zone.geometry,
        area_m2: zone.area_m2,
        orden: index,
        metadata: {},
      }));

      await saveConjuntoZonas(nombre, descripcion, zonas);
      
      toast.success(`Conjunto "${nombre}" guardado exitosamente`);
      
      // Reset selection state
      setIsSelectionMode(false);
      setSelectedZones([]);
      setShowSaveModal(false);
    } catch (error) {
      console.error('Error saving conjunto:', error);
      throw error; // Let the modal handle the error display
    }
  };

  const calculateTotalArea = (zones: SelectedZone[]) => {
    return zones.reduce((sum, zone) => sum + zone.area_m2, 0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Multi-Selection Mode Button */}
      {!isDrawing && !isSelectionMode && (
        <button
          onClick={handleStartSelectionMode}
          className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-2 transition-colors"
          title="Activar selección múltiple"
        >
          <Layers size={20} />
          <span>Selección Múltiple</span>
        </button>
      )}

      {/* Multi-Selection Components */}
      {isSelectionMode && (
        <>
          <SelectionToolbar
            selectedZones={selectedZones}
            totalArea={calculateTotalArea(selectedZones)}
            onClear={() => setSelectedZones([])}
            onSave={handleOpenSaveModal}
            onCancel={handleCancelSelectionMode}
          />
          <SaveSelectionModal
            isOpen={showSaveModal}
            selectedZones={selectedZones}
            onSave={handleSaveSelection}
            onClose={() => setShowSaveModal(false)}
          />
        </>
      )}

      {/* Mapa principal */}
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* Control de capas base */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="ESRI Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="OpenTopoMap">
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Manejador de eventos de dibujo */}
        <DrawingHandler
          isDrawing={isDrawing}
          onPointClick={handleMapClickWrapper}
          onAnalysisClick={(latlng) => {
            setSelectedPoint({ lat: latlng.lat, lon: latlng.lng });
            setShowAnalysis(true);
            setSearchMarker(null);
          }}
        />

        {/* Multi-Selection Mode Handler */}
        {isSelectionMode && (
          <MultiSelectionMode
            isActive={isSelectionMode}
            areas={areas}
            onSelectionChange={setSelectedZones}
            onComplete={handleOpenSaveModal}
            onCancel={handleCancelSelectionMode}
          />
        )}

        {/* Search Control */}
        <SearchControl onLocationSelected={handleLocationSelected} />

        {/* Search Marker */}
        {searchMarker && (
          <Marker
            position={[searchMarker.lat, searchMarker.lng]}
            icon={searchMarkerIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm">{searchMarker.label}</p>
                <button
                  onClick={() => setSearchMarker(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Eliminar marcador
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drawing Markers & Lines */}
        {isDrawing && currentPolygon.length > 0 && (
          <DrawingMarkers
            points={currentPolygon}
            onRemovePoint={(idx) => {
              setCurrentPolygon(prev => prev.filter((_, i) => i !== idx));
            }}
          />
        )}

        {/* Polígono en construcción */}
        {currentPolygon.length >= 2 && (
          <Polygon
            positions={currentPolygon}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.3,
              weight: 3,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Áreas guardadas */}
        {areas.map((area) => (
          <Polygon
            key={area.id}
            positions={area.coordenadas}
            pathOptions={{
              color: coloresPorTipo[area.tipo],
              fillColor: coloresPorTipo[area.tipo],
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{area.nombre}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Tipo:</strong> {area.tipo.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Área:</strong> {area.areaM2.toLocaleString()} m²
                </p>
                {area.notas && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Notas:</strong> {area.notas}
                  </p>
                )}
                <button
                  onClick={() => handleDeleteArea(area.id)}
                  className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>

      {/* Drawing Tools Panel */}
      <DrawingToolsPanel
        isDrawing={isDrawing}
        pointCount={currentPolygon.length}
        onUndo={handleUndoPoint}
        onReset={handleResetDrawing}
        onComplete={handleCompleteDrawing}
        onCancel={handleCancelDrawing}
        minPoints={3}
      />

      {/* Analysis Panel */}
      {showAnalysis && (
        <AnalysisPanel
          coordinates={selectedPoint}
          onClose={() => {
            setShowAnalysis(false);
            setSelectedPoint(null);
          }}
        />
      )}
    </div>
  );
};

export default FullScreenMap;
