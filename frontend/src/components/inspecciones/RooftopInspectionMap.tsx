import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { InspeccionTejado } from '../../types';
import SearchControl from '../maps/SearchControl';

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
  // Size is approximately 15x15 meters (roughly 0.00015 degrees at mid-latitudes)
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
  selectionMode = 'single'
}) => {
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);

  const handleMapClick = async (lat: number, lng: number) => {
    setClickedPoint([lat, lng]);
    
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
          onLocationSelected={(lat, lng, label) => {
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
          
          const coords = inspection.coordenadas.coordinates[0].map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
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
          
          const coords = rooftop.coordenadas.coordinates[0].map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
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
        {selectionMode === 'single' && selectedRooftop?.coordenadas?.coordinates?.[0] && (
          <Polygon
            positions={selectedRooftop.coordenadas.coordinates[0].map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            )}
            pathOptions={{
              color: '#16a34a',
              fillColor: '#22c55e',
              fillOpacity: 0.5,
              weight: 3
            }}
          />
        )}
      </MapContainer>

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="font-semibold mb-2">
          {selectionMode === 'multi' ? 'Multi-Selección Activa' : 'Herramienta de Inspección'}
        </h3>
        <p className="text-sm text-gray-600">
          {selectionMode === 'multi' 
            ? 'Haz clic en múltiples tejados para seleccionarlos. Usa el botón "Analizar con IA" cuando termines.'
            : 'Haz clic en cualquier ubicación del mapa para crear una inspección de tejado. Se creará un área inicial que podrás ajustar después.'}
        </p>
      </div>
    </div>
  );
};

export default RooftopInspectionMap;
