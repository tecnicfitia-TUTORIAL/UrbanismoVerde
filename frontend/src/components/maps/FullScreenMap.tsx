import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Area, coloresPorTipo } from '../../types';
import { AnalysisPanel } from '../panels/AnalysisPanel';

interface FullScreenMapProps {
  isDrawing: boolean;
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
  onCompleteDrawing,
  areas,
  onDeleteArea
}) => {
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const tempCoordsRef = useRef<[number, number][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Manejar click en el mapa para agregar punto
  const handleMapClick = (latlng: LatLng) => {
    const newPoint: [number, number] = [latlng.lat, latlng.lng];
    const updatedCoords = [...tempCoordsRef.current, newPoint];
    tempCoordsRef.current = updatedCoords;
    setCurrentPolygon(updatedCoords);

    // Auto-completar si se hace doble click (más de 2 puntos y se vuelve al inicio)
    if (updatedCoords.length >= 3) {
      const firstPoint = updatedCoords[0];
      const lastPoint = newPoint;
      const distance = Math.sqrt(
        Math.pow(firstPoint[0] - lastPoint[0], 2) +
        Math.pow(firstPoint[1] - lastPoint[1], 2)
      );
      
      // Si el último punto está muy cerca del primero, completar automáticamente
      if (distance < 0.0001) {
        onCompleteDrawing(updatedCoords.slice(0, -1)); // Excluir el último punto duplicado
        setCurrentPolygon([]);
        tempCoordsRef.current = [];
      }
    }
  };

  // Reiniciar el polígono actual cuando se cancela el dibujo
  React.useEffect(() => {
    if (!isDrawing) {
      setCurrentPolygon([]);
      tempCoordsRef.current = [];
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

      {/* Indicador de modo de dibujo */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">
            🖊️ Modo Dibujo Activo - Haz click para agregar puntos ({currentPolygon.length})
          </p>
          <p className="text-xs mt-1">
            Haz click cerca del primer punto o usa el botón de la barra lateral para completar
          </p>
        </div>
      )}

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
