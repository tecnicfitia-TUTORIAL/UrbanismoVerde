import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Area, coloresPorTipo } from '../../types';
import { AnalysisPanel } from '../panels/AnalysisPanel';
import { DrawingToolsPanel } from '../panels/DrawingToolsPanel';
import { DrawingMarkers } from './DrawingMarker';

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

  return (
    <div className="relative w-full h-full">
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
          onPointClick={handleMapClick}
          onAnalysisClick={(latlng) => {
            setSelectedPoint({ lat: latlng.lat, lon: latlng.lng });
            setShowAnalysis(true);
          }}
        />

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
