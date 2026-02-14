import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { InspeccionTejado } from '../../types';
import SearchControl from '../maps/SearchControl';
import L from 'leaflet';

interface SelectedRooftop {
  tempId?: string;
  coordenadas?: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

interface RooftopInspectionMapProps {
  onRooftopClick: (geometry: any, coordinates: [number, number]) => void;
  selectedRooftop: SelectedRooftop | null;
  existingInspections: InspeccionTejado[];
  selectedRooftops?: SelectedRooftop[];
  selectionMode?: 'single' | 'multi';
  onPolygonEdit?: (newCoordinates: [number, number][][]) => void;
  editMode?: boolean;
}

type InspectionMode = 'auto' | 'manual';


/**
 * Create a simple polygon geometry around a clicked point.
 * This is used as a placeholder for rooftop selection when precise building
 * boundaries are not available from the map tiles.
 * 
 * The user can later adjust the area or geometry as needed.
 * 
 * @param lat - Latitude of the clicked location
 * @param lng - Longitude of the clicked location
 * @returns GeoJSON polygon geometry representing a simple square area
 */
function createPlaceholderGeometry(lat: number, lng: number): any {
  // Create a simple square polygon around the clicked point
  // Size is approximately 30x30 meters (0.00015 degrees creates 15m radius from center)
  const size = 0.00015;
  
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - size, lat - size],
      [lng + size, lat - size],
      [lng + size, lat + size],
      [lng - size, lat + size],
      [lng - size, lat - size]
    ]]
  };
}

// Component to handle map clicks and set cursor
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    // Set crosshair cursor for precision
    const container = map.getContainer();
    container.style.cursor = 'crosshair';
    
    return () => {
      container.style.cursor = '';
    };
  }, [map]);
  
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Type for GeoJSON Polygon geometry
interface PolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

// Component to handle editable polygon using React-Leaflet's proper API
function EditablePolygon({ 
  geometry, 
  onEdit, 
  editable = false 
}: { 
  geometry: PolygonGeometry; 
  onEdit?: (coords: [number, number][][]) => void;
  editable?: boolean;
}) {
  const polygonRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    if (!geometry?.coordinates?.[0] || !editable || !onEdit || !polygonRef.current) return;
    
    const leafletPolygon = polygonRef.current as L.Polygon & {
      editing?: {
        enable?: () => void;
        disable?: () => void;
      };
    };
    
    // Enable editing if the Leaflet polygon supports it
    if (leafletPolygon.editing && typeof leafletPolygon.editing.enable === 'function') {
      leafletPolygon.editing.enable();
      
      const handleEdit = () => {
        try {
          const latlngs = leafletPolygon.getLatLngs()[0];
          if (!latlngs || latlngs.length === 0) return;
          
          const newCoords = latlngs.map((latlng: L.LatLng) => [latlng.lng, latlng.lat]);
          // Close the polygon
          newCoords.push([latlngs[0].lng, latlngs[0].lat]);
          onEdit([newCoords]);
        } catch (err) {
          console.error('Error handling polygon edit:', err);
        }
      };

      // Listen for both edit and vertex drag events
      leafletPolygon.on('edit', handleEdit);
      
      return () => {
        if (leafletPolygon.editing && typeof leafletPolygon.editing.disable === 'function') {
          leafletPolygon.editing.disable();
        }
        leafletPolygon.off('edit', handleEdit);
      };
    }
  }, [geometry, editable, onEdit]);

  if (!geometry?.coordinates?.[0]) return null;

  const positions = (geometry.coordinates[0] as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number]
  );

  return (
    <Polygon
      ref={polygonRef}
      positions={positions}
      pathOptions={{
        color: editable ? '#f59e0b' : '#16a34a',
        fillColor: editable ? '#fbbf24' : '#22c55e',
        fillOpacity: editable ? 0.4 : 0.5,
        weight: editable ? 4 : 3,
      }}
    />
  );
}

// Component to auto-zoom to selected rooftop
function AutoZoom({ geometry }: { geometry: any }) {
  const map = useMap();
  
  useEffect(() => {
    if (geometry && geometry.coordinates && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0];
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const bounds = coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
    }
  }, [geometry, map]);
  
  return null;
}

const RooftopInspectionMap: React.FC<RooftopInspectionMapProps> = ({
  onRooftopClick,
  selectedRooftop,
  existingInspections,
  selectedRooftops = [],
  selectionMode = 'single',
  onPolygonEdit,
  editMode = false
}) => {
  const [inspectionMode, setInspectionMode] = React.useState<InspectionMode>('manual');
  const [showModeSelector, setShowModeSelector] = React.useState(true);

  const handleAutoDetect = () => {
    // Placeholder for future auto-detection feature
    // This would use ML/AI to detect building boundaries
    console.log('Auto-detect clicked - feature coming soon');
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (inspectionMode === 'manual') {
      // Create a placeholder geometry around the clicked point
      // Note: We no longer query external APIs which can timeout or be unreliable.
      // The user can adjust the rooftop boundary in the inspection form if needed.
      const geometry = createPlaceholderGeometry(lat, lng);

      onRooftopClick(geometry, [lat, lng]);
      setShowModeSelector(false);
    } else {
      // Auto mode - would trigger ML detection (placeholder)
      handleAutoDetect();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Mode Selector - Only show when no rooftop is selected */}
      {showModeSelector && !selectedRooftop && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-2">
          <button
            onClick={() => setInspectionMode('manual')}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all flex items-center gap-2 ${
              inspectionMode === 'manual'
                ? 'bg-green-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
            title="Dibujar manualmente el área del tejado"
          >
            ✏️ <span>Dibujar Manualmente</span>
          </button>
          <button
            onClick={() => setInspectionMode('auto')}
            disabled={true}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all flex items-center gap-2 opacity-50 cursor-not-allowed ${
              inspectionMode === 'auto'
                ? 'bg-blue-600 text-white scale-105'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
            title="Detectar automáticamente - Próximamente"
          >
            🤖 <span>Detectar Automáticamente</span>
            <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded">Próximamente</span>
          </button>
        </div>
      )}

      <MapContainer
        center={[40.4168, -3.7038]} // Madrid center
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; Google'
        />

        {/* Address Search Control */}
        {/* Note: SearchControl internally handles map panning to selected location with smooth flyTo animation */}
        <SearchControl 
          onLocationSelected={(_lat, _lng, label) => {
            console.log('📍 Dirección encontrada:', label);
            // Map is automatically centered by SearchControl at zoom level 18 with smooth animation
          }}
        />

        <ClickHandler onClick={handleMapClick} />
        
        {/* Auto-zoom to selected rooftop */}
        {selectedRooftop?.coordenadas && (
          <AutoZoom geometry={selectedRooftop.coordenadas} />
        )}

        {/* Show existing inspections */}
        {existingInspections.map((inspection) => {
          if (!inspection.coordenadas?.coordinates?.[0]) return null;
          
          const coords = (inspection.coordenadas.coordinates[0] as [number, number][]).map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );

          return (
            <Polygon
              key={inspection.id}
              positions={coords}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.3,
                weight: 2
              }}
            />
          );
        })}

        {/* Show multi-selected rooftops in green */}
        {selectionMode === 'multi' && selectedRooftops.map((rooftop, idx) => {
          if (!rooftop.coordenadas?.coordinates?.[0]) return null;
          
          const coords = (rooftop.coordenadas.coordinates[0] as [number, number][]).map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );

          return (
            <Polygon
              key={rooftop.tempId || `selected-${idx}`}
              positions={coords}
              pathOptions={{
                color: '#16a34a',
                fillColor: '#22c55e',
                fillOpacity: 0.5,
                weight: 3
              }}
            />
          );
        })}

        {/* Show currently selected rooftop (for single mode or preview) */}
        {selectionMode === 'single' && selectedRooftop?.coordenadas && (
          <EditablePolygon
            geometry={selectedRooftop.coordenadas}
            editable={editMode}
            onEdit={onPolygonEdit}
          />
        )}
      </MapContainer>

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="font-semibold mb-2 flex items-center gap-2" role="heading" aria-level={3}>
          <span aria-label={selectionMode === 'multi' ? 'Multi-selección activa' : 'Herramienta de inspección'}>
            {selectionMode === 'multi' ? '🎯 Multi-Selección Activa' : '📍 Herramienta de Inspección'}
          </span>
        </h3>
        
        {!selectedRooftop ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              {selectionMode === 'multi' 
                ? 'Haz clic en múltiples tejados para seleccionarlos. Usa el botón "Analizar con IA" cuando termines.'
                : '¿Cómo inspeccionar un tejado?'}
            </p>
            {selectionMode === 'single' && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Busca la dirección o navega el mapa</li>
                <li>Selecciona el modo de selección arriba</li>
                <li>Haz clic en el tejado para crear el área</li>
                <li>Ajusta la forma si es necesario</li>
              </ol>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {editMode
                ? '✏️ Modo de edición activo: Arrastra los puntos del polígono para ajustar la forma del tejado.'
                : '✅ Tejado seleccionado. Continúa con el formulario de inspección.'}
            </p>
            {editMode && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                💡 <strong>Tip:</strong> Arrastra los vértices (puntos) para ajustar la forma exacta del tejado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RooftopInspectionMap;
