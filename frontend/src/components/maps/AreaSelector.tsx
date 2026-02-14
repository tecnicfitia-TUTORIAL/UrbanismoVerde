/**
 * AreaSelector Component
 * Allows users to select an area on the map by drawing a rectangle
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
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

  useEffect(() => {
    if (!map || disabled) return;

    let tempRectangle: L.Rectangle | null = null;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      
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
      if (!isDrawing || !startPoint || !tempRectangle || disabled) return;
      
      // Update rectangle bounds
      const bounds = L.latLngBounds(startPoint, e.latlng);
      tempRectangle.setBounds(bounds);
    };

    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !startPoint || disabled) return;
      
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
      
      // Call callback with bounds
      onAreaSelected(areaBounds);
      
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
  }, [map, disabled, isDrawing, startPoint, onAreaSelected]);

  return null;
};

export default AreaSelector;
