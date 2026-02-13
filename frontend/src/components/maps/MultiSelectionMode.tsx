/**
 * MultiSelectionMode Component
 * 
 * Enables multi-selection of buildings/zones on the map.
 * Features:
 * - Click on existing zones (polygons) to select/deselect
 * - Selected zones highlighted with green outline
 * - Calculate area for each selected zone
 * - Support for deselection by clicking again
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SelectedZone, GeoJSONPolygon, Area } from '../../types';

interface MultiSelectionModeProps {
  isActive: boolean;
  areas: Area[]; // Existing zones that can be selected
  onSelectionChange: (zones: SelectedZone[]) => void;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Convert Area coordinates to GeoJSON Polygon
 */
function convertToGeoJSON(coords: [number, number][]): GeoJSONPolygon {
  // Close the polygon if not already closed
  const polygonCoords = [...coords];
  if (polygonCoords.length > 0 && 
      (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
       polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])) {
    polygonCoords.push(polygonCoords[0]);
  }

  return {
    type: 'Polygon',
    coordinates: [polygonCoords.map(([lat, lng]) => [lng, lat])] // GeoJSON uses [lng, lat]
  };
}

export const MultiSelectionMode: React.FC<MultiSelectionModeProps> = ({
  isActive,
  areas,
  onSelectionChange,
  onComplete,
  onCancel,
}) => {
  const map = useMap();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [highlightLayers, setHighlightLayers] = useState<Map<string, L.Polygon>>(new Map());

  /**
   * Create selected zone from area
   */
  const createSelectedZone = useCallback((area: Area): SelectedZone => {
    return {
      id: area.id,
      type: area.tipo as any, // Cast to match SelectedZone type
      coordinates: area.coordenadas,
      area_m2: area.areaM2,
      geometry: convertToGeoJSON(area.coordenadas),
    };
  }, []);

  /**
   * Toggle selection of a zone
   */
  const toggleZoneSelection = useCallback((area: Area) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(area.id)) {
        newSet.delete(area.id);
        // Remove highlight
        const layer = highlightLayers.get(area.id);
        if (layer && map) {
          map.removeLayer(layer);
        }
        setHighlightLayers(prevLayers => {
          const newLayers = new Map(prevLayers);
          newLayers.delete(area.id);
          return newLayers;
        });
      } else {
        newSet.add(area.id);
        // Add highlight
        if (map) {
          const highlightLayer = L.polygon(area.coordenadas, {
            color: '#10b981', // green-500
            weight: 3,
            fillColor: '#10b981',
            fillOpacity: 0.2,
            className: 'selection-highlight',
          }).addTo(map);
          
          setHighlightLayers(prevLayers => {
            const newLayers = new Map(prevLayers);
            newLayers.set(area.id, highlightLayer);
            return newLayers;
          });
        }
      }
      return newSet;
    });
  }, [map, highlightLayers]);

  /**
   * Update selected zones when selectedIds changes
   */
  useEffect(() => {
    const selectedZones: SelectedZone[] = areas
      .filter(area => selectedIds.has(area.id))
      .map(area => createSelectedZone(area));
    
    onSelectionChange(selectedZones);
  }, [selectedIds, areas, createSelectedZone, onSelectionChange]);

  /**
   * Setup click handlers on areas when active
   */
  useEffect(() => {
    if (!isActive || !map) return;

    // Find all polygon elements on the map and add click handlers
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if we clicked on an area using proper point-in-polygon check
      const clickedArea = areas.find(area => {
        // Create a Leaflet polygon from coordinates
        const polygon = L.polygon(area.coordenadas);
        // Use Leaflet's built-in contains method for accurate point-in-polygon check
        const bounds = polygon.getBounds();
        if (!bounds.contains(e.latlng)) {
          return false; // Quick reject if outside bounds
        }
        // Check if point is actually inside the polygon
        // Convert to geojson and use ray casting algorithm
        const point = [e.latlng.lat, e.latlng.lng];
        return isPointInPolygon(point, area.coordenadas);
      });

      if (clickedArea) {
        toggleZoneSelection(clickedArea);
        L.DomEvent.stopPropagation(e);
      }
    };

    // Ray casting algorithm for point-in-polygon test
    const isPointInPolygon = (point: number[], polygon: [number, number][]): boolean => {
      const [lat, lng] = point;
      let inside = false;
      
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        const intersect = ((yi > lng) !== (yj > lng))
          && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      
      return inside;
    };

    map.on('click', handleMapClick);

    // Change cursor when hovering over selectable areas
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [isActive, map, areas, toggleZoneSelection]);

  /**
   * Cleanup highlights when component unmounts or mode is disabled
   */
  useEffect(() => {
    if (!isActive) {
      // Remove all highlights
      highlightLayers.forEach((layer) => {
        if (map) {
          map.removeLayer(layer);
        }
      });
      setHighlightLayers(new Map());
      setSelectedIds(new Set());
    }

    return () => {
      // Cleanup on unmount
      highlightLayers.forEach((layer) => {
        if (map) {
          map.removeLayer(layer);
        }
      });
    };
  }, [isActive, map, highlightLayers]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
        case 'Enter':
          if (selectedIds.size > 0) {
            e.preventDefault();
            onComplete();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, selectedIds.size, onComplete, onCancel]);

  // This component doesn't render anything itself
  // It just manages the selection state and highlights
  return null;
};

export default MultiSelectionMode;
