/**
 * AreaSelector Component
 * Allows users to select an area on the map by drawing a rectangle
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Square, X } from 'lucide-react';
import type { AreaBounds } from '../../types';

interface AreaSelectorProps {
  onAreaSelected: (bounds: AreaBounds) => void;
  disabled?: boolean;
}

const AreaSelector: React.FC<AreaSelectorProps> = ({ onAreaSelected, disabled = false }) => {
  const map = useMap();
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  // Handle enabling/disabling map dragging based on selection mode
  useEffect(() => {
    if (!map) return;

    if (selectionMode && !disabled) {
      // Disable map dragging during selection
      map.dragging.disable();
      map.getContainer().style.cursor = 'crosshair';
    } else {
      // Enable map dragging when not in selection mode
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    }

    return () => {
      // Restore defaults on unmount
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    };
  }, [map, selectionMode, disabled]);

  useEffect(() => {
    if (!map || disabled || !selectionMode) return;

    let tempRectangle: L.Rectangle | null = null;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (disabled || !selectionMode) return;
      
      setIsDrawing(true);
      setStartPoint(e.latlng);
      
      // Create initial rectangle (zero size)
      const bounds = L.latLngBounds(e.latlng, e.latlng);
      tempRectangle = L.rectangle(bounds, {
        color: '#10b981',
        weight: 2,
        fillOpacity: 0.1,
        dashArray: '5, 5'
      }).addTo(map);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !startPoint || !tempRectangle || disabled || !selectionMode) return;
      
      // Update rectangle bounds
      const bounds = L.latLngBounds(startPoint, e.latlng);
      tempRectangle.setBounds(bounds);
    };

    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !startPoint || disabled || !selectionMode) return;
      
      setIsDrawing(false);
      
      // Calculate final bounds
      const bounds = L.latLngBounds(startPoint, e.latlng);
      const areaBounds: AreaBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
      
      // Remove temp rectangle
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
        tempRectangle = null;
      }
      
      // Validate minimum size (at least 0.0001 degrees difference)
      const minDiff = 0.0001;
      if (Math.abs(areaBounds.north - areaBounds.south) < minDiff ||
          Math.abs(areaBounds.east - areaBounds.west) < minDiff) {
        console.warn('⚠️ Area too small, skipping');
        return;
      }
      
      // Call callback with bounds and exit selection mode
      onAreaSelected(areaBounds);
      setSelectionMode(false);
      setStartPoint(null);
    };

    // Add event listeners
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      
      if (tempRectangle) {
        map.removeLayer(tempRectangle);
      }
    };
  }, [map, disabled, isDrawing, startPoint, onAreaSelected, selectionMode]);

  const handleActivateSelection = () => {
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setIsDrawing(false);
    setStartPoint(null);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {!selectionMode ? (
        <button
          onClick={handleActivateSelection}
          disabled={disabled}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-lg border border-gray-300 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Activar modo selección de área"
        >
          <Square size={18} />
          Seleccionar Área
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <Square size={16} className="animate-pulse" />
            <span>Arrastra para seleccionar</span>
          </div>
          <button
            onClick={handleCancelSelection}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded flex items-center justify-center gap-2 transition-all"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default AreaSelector;
