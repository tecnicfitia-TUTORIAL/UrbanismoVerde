/**
 * SatelliteMap Component
 * 
 * Interactive satellite map with zone highlighting and sub-zone selection
 * Uses Leaflet with ESRI satellite tiles
 */

import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSONPolygon } from '../../types';

interface SatelliteMapProps {
  polygon: GeoJSONPolygon;
  height?: string;
  onSubZoneSelect?: (subZones: any[]) => void;
  showControls?: boolean;
}

// Component to fit map to polygon bounds
function FitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  polygon,
  height = '100%',
  onSubZoneSelect,
  showControls = true,
}) => {
  const mapRef = useRef<any>(null);
  const [selectedSubZones, setSelectedSubZones] = useState<string[]>([]);

  // Convert GeoJSON coordinates to Leaflet format
  // GeoJSON uses [lon, lat], Leaflet uses [lat, lon]
  const convertToLeafletCoords = (coords: number[][][]): LatLngExpression[] => {
    if (!coords || !coords[0]) return [];
    return coords[0].map(([lon, lat]) => [lat, lon] as LatLngExpression);
  };

  const leafletCoords = convertToLeafletCoords(polygon.coordinates);

  // Calculate bounds for the polygon
  const calculateBounds = (): LatLngBounds | null => {
    if (leafletCoords.length === 0) return null;

    const lats = leafletCoords.map((coord: any) => coord[0]);
    const lngs = leafletCoords.map((coord: any) => coord[1]);

    const bounds = new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );

    return bounds;
  };

  const bounds = calculateBounds();

  // Default center (Madrid) if bounds are not available
  const defaultCenter: LatLngExpression = [40.4168, -3.7038];
  const center: LatLngExpression =
    bounds && bounds.isValid()
      ? bounds.getCenter()
      : defaultCenter;

  const handlePolygonClick = () => {
    console.log('🗺️ Polígono clickeado');
    // TODO: Implement sub-zone selection logic
  };

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={17}
        style={{ width: '100%', height: '100%' }}
        zoomControl={showControls}
      >
        {/* Satellite Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Hybrid Labels Layer (optional overlay) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          opacity={0.7}
        />

        {/* Main Polygon */}
        {leafletCoords.length > 0 && (
          <Polygon
            positions={leafletCoords}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.3,
              weight: 3,
            }}
            eventHandlers={{
              click: handlePolygonClick,
            }}
          />
        )}

        {/* Fit bounds to polygon */}
        {bounds && bounds.isValid() && <FitBounds bounds={bounds} />}
      </MapContainer>

      {/* Map Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="text-sm font-medium text-gray-700 mb-2">Vista Satelital</div>
          <div className="text-xs text-gray-500">
            Click en zona para seleccionar
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-medium text-gray-700 mb-2">Leyenda</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500 bg-opacity-30"></div>
            <span className="text-xs text-gray-600">Zona analizada</span>
          </div>
        </div>
      </div>

      {/* Area Info */}
      {leafletCoords.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
          <div className="text-xs font-medium text-gray-700">Información de la zona</div>
          <div className="text-xs text-gray-600 mt-1">
            Puntos: {leafletCoords.length}
          </div>
        </div>
      )}
    </div>
  );
};
