/**
 * MapWithAnalysis Component
 * Map interface for urban analysis with area selection
 */

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import SearchControl from './SearchControl';
import AreaSelector from './AreaSelector';
import type { AreaBounds } from '../../types';

interface MapWithAnalysisProps {
  onAreaSelected: (bounds: AreaBounds) => void;
  disabled?: boolean;
}

const MapWithAnalysis: React.FC<MapWithAnalysisProps> = ({ onAreaSelected, disabled = false }) => {
  // Default center: Madrid, Spain
  const defaultCenter: [number, number] = [40.4168, -3.7038];
  const defaultZoom = 13;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        zoomControl={true}
      >
        {/* Satellite Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Satellite imagery (alternative) - requires API key in production */}
        {/* <TileLayer
          attribution='Imagery &copy; Google'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
        /> */}

        {/* Search Control */}
        <SearchControl />

        {/* Area Selector */}
        <AreaSelector onAreaSelected={onAreaSelected} disabled={disabled} />
      </MapContainer>

      {/* Instructions overlay (when not disabled) */}
      {!disabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              🗺️ <strong>Selecciona un área:</strong> Haz clic en "Seleccionar Área" y luego arrastra
            </p>
          </div>
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 z-[900] pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="text-sm font-medium">
                ⏳ Análisis en progreso...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWithAnalysis;
