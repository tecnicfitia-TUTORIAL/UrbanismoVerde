/**
 * Map Helper Utilities
 * 
 * Shared utilities for map calculations and transformations
 */

import { LatLngBoundsExpression } from 'leaflet';

/**
 * Calculate the center point of a polygon from coordinates
 */
export function calculateCenter(coords: [number, number][]): [number, number] {
  if (!coords.length) return [0, 0];
  const sum = coords.reduce((acc, coord) => {
    return [acc[0] + coord[0], acc[1] + coord[1]];
  }, [0, 0]);
  return [sum[0] / coords.length, sum[1] / coords.length];
}

/**
 * Calculate the bounding box for a polygon from coordinates
 */
export function calculateBounds(coords: [number, number][]): LatLngBoundsExpression {
  if (!coords.length) return [[0, 0], [0, 0]];
  
  let minLat = coords[0][0];
  let maxLat = coords[0][0];
  let minLng = coords[0][1];
  let maxLng = coords[0][1];
  
  coords.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  return [[minLat, minLng], [maxLat, maxLng]];
}
