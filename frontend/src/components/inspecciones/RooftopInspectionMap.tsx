import React, { useEffect, useRef, useCallback } from 'react';
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

// Component to handle editable polygon
function EditablePolygon({ 
  geometry, 
  onEdit, 
  editable = false 
}: { 
  geometry: any; 
  onEdit?: (coords: [number, number][][]) => void;
  editable?: boolean;
}) {
  const polygonRef = useRef<L.Polygon | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!geometry?.coordinates?.[0] || !editable || !onEdit) return;
    
    const polygon = polygonRef.current;
    if (!polygon) return;

    // Enable editing
    const leafletPolygon = polygon as any;
    if (leafletPolygon.editing) {
      leafletPolygon.editing.enable();
      
      // Listen for edit events
      const handleEdit = () => {
        const latlngs = leafletPolygon.getLatLngs()[0];
        const newCoords = latlngs.map((latlng: L.LatLng) => [latlng.lng, latlng.lat]);
        // Close the polygon by adding the first point at the end
        newCoords.push([latlngs[0].lng, latlngs[0].lat]);
        onEdit([newCoords]);
      };

      leafletPolygon.on('edit', handleEdit);

      return () => {
        if (leafletPolygon.editing) {
          leafletPolygon.editing.disable();
        }
        leafletPolygon.off('edit', handleEdit);
      };
    }
  }, [geometry, editable, onEdit, map]);

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
  const handleMapClick = async (lat: number, lng: number) => {
    // Create a placeholder geometry around the clicked point
    // Note: We no longer query external APIs which can timeout or be unreliable.
    // The user can adjust the rooftop boundary in the inspection form if needed.
    const geometry = createPlaceholderGeometry(lat, lng);

    onRooftopClick(geometry, [lat, lng]);
  };

  return (
    <div className="relative w-full h-full">
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
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          {selectionMode === 'multi' ? '🎯 Multi-Selección Activa' : '📍 Herramienta de Inspección'}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {selectionMode === 'multi' 
            ? 'Haz clic en múltiples tejados para seleccionarlos. Usa el botón "Analizar con IA" cuando termines.'
            : editMode
            ? '✏️ Modo de edición activo: Arrastra los puntos del polígono para ajustar la forma del tejado.'
            : 'Haz clic en cualquier ubicación del mapa para crear una inspección de tejado. Se creará un área inicial que podrás ajustar después.'}
        </p>
        {editMode && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            💡 <strong>Tip:</strong> Arrastra los vértices (puntos) para ajustar la forma exacta del tejado.
          </div>
        )}
      </div>
    </div>
  );
};

export default RooftopInspectionMap;
