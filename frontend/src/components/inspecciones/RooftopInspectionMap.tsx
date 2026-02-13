import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { InspeccionTejado } from '../../types';

interface RooftopInspectionMapProps {
  onRooftopClick: (geometry: any, coordinates: [number, number]) => void;
  selectedRooftop: Partial<InspeccionTejado> | null;
  existingInspections: InspeccionTejado[];
}

// Component to handle map clicks
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const RooftopInspectionMap: React.FC<RooftopInspectionMapProps> = ({
  onRooftopClick,
  selectedRooftop,
  existingInspections
}) => {
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setClickedPoint([lat, lng]);
    
    // Create a simple square polygon around the clicked point
    // This is a placeholder - in a real implementation, you'd detect building footprints
    const size = 0.0001; // Approximate size in degrees
    const geometry = {
      type: 'Polygon',
      coordinates: [[
        [lng - size, lat - size],
        [lng + size, lat - size],
        [lng + size, lat + size],
        [lng - size, lat + size],
        [lng - size, lat - size]
      ]]
    };

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

        <ClickHandler onClick={handleMapClick} />

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

        {/* Show selected rooftop */}
        {selectedRooftop?.coordenadas?.coordinates?.[0] && (
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
        <h3 className="font-semibold mb-2">Herramienta de Inspección</h3>
        <p className="text-sm text-gray-600">
          Haz clic en cualquier ubicación del mapa para crear una inspección de tejado y obtener datos completos.
        </p>
      </div>
    </div>
  );
};

export default RooftopInspectionMap;
