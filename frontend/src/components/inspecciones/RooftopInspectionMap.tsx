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

// Type definitions for OpenStreetMap Overpass API response
interface OSMNode {
  lon: number;
  lat: number;
}

interface OSMWay {
  type: 'way';
  geometry: OSMNode[];
}

interface OSMRelation {
  type: 'relation';
  members: Array<{
    role: string;
    geometry?: OSMNode[];
  }>;
}

type OSMElement = OSMWay | OSMRelation;

/**
 * Query OpenStreetMap Overpass API for building at clicked location
 * @param lat - Latitude of the clicked location
 * @param lng - Longitude of the clicked location
 * @returns GeoJSON polygon geometry or null if no building found
 * 
 * Search radius is set to 10 meters, which is appropriate for:
 * - Detecting small to medium buildings
 * - Minimizing false positives from nearby buildings
 * - Allowing slight click inaccuracies
 */
async function queryBuildingAtLocation(lat: number, lng: number): Promise<any | null> {
  const radius = 10; // Search radius in meters
  const query = `
    [out:json];
    (
      way["building"](around:${radius},${lat},${lng});
      relation["building"](around:${radius},${lat},${lng});
    );
    out geom;
  `;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    if (!response.ok) {
      throw new Error('Overpass API request failed');
    }
    
    const data = await response.json();
    
    if (data.elements && data.elements.length > 0) {
      // Get the first building found
      const building = data.elements[0] as OSMElement;
      
      // Extract coordinates based on element type
      let coordinates: [number, number][] = [];
      
      if (building.type === 'way' && building.geometry) {
        // For ways, use the geometry directly
        coordinates = building.geometry.map((node: OSMNode) => [node.lon, node.lat]);
      } else if (building.type === 'relation' && building.members) {
        // For relations, extract outer way coordinates
        const outerWay = building.members.find((m) => m.role === 'outer');
        if (outerWay && outerWay.geometry) {
          coordinates = outerWay.geometry.map((node: OSMNode) => [node.lon, node.lat]);
        }
      }
      
      // Ensure the polygon is closed
      if (coordinates.length > 0 && 
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
           coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
        coordinates.push(coordinates[0]);
      }
      
      if (coordinates.length >= 4) {
        return {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying Overpass API:', error);
    return null;
  }
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
    
    // Try to detect building from OpenStreetMap
    const buildingGeometry = await queryBuildingAtLocation(lat, lng);
    
    let geometry;
    if (buildingGeometry) {
      // Use detected building geometry
      geometry = buildingGeometry;
    } else {
      // Fallback: Create a simple square polygon around the clicked point
      // This is a placeholder when no building is detected
      const size = 0.0001; // Approximate size in degrees
      geometry = {
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
            : 'Haz clic en cualquier ubicación del mapa para crear una inspección de tejado y obtener datos completos.'}
        </p>
      </div>
    </div>
  );
};

export default RooftopInspectionMap;
