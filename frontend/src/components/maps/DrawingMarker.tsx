import React from 'react';
import { Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';

interface DrawingMarkersProps {
  points: [number, number][];
  onRemovePoint?: (index: number) => void;
}

// Icono personalizado para puntos
const pointIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzEwYjk4MSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const firstPointIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzM3ODZmZiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPgo=',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

export const DrawingMarkers: React.FC<DrawingMarkersProps> = ({ points, onRemovePoint }) => {
  if (points.length === 0) return null;

  // Líneas conectoras
  const linePositions: LatLngExpression[] = points.map(p => [p[0], p[1]]);

  return (
    <>
      {/* Línea que conecta los puntos */}
      {points.length > 1 && (
        <Polyline
          positions={linePositions}
          color="#10b981"
          weight={3}
          opacity={0.7}
          dashArray="5, 10"
        />
      )}

      {/* Línea de cierre (del último punto al primero) */}
      {points.length >= 3 && (
        <Polyline
          positions={[linePositions[linePositions.length - 1], linePositions[0]]}
          color="#10b981"
          weight={2}
          opacity={0.4}
          dashArray="5, 10"
        />
      )}

      {/* Marcadores en cada punto */}
      {points.map((point, idx) => (
        <React.Fragment key={idx}>
          {/* Círculo de área de influencia */}
          <Circle
            center={[point[0], point[1]]}
            radius={10}
            pathOptions={{
              color: idx === 0 ? '#3b82f6' : '#10b981',
              fillColor: idx === 0 ? '#3b82f6' : '#10b981',
              fillOpacity: 0.1,
              weight: 1
            }}
          />

          {/* Marcador del punto */}
          <Marker
            position={[point[0], point[1]]}
            icon={idx === 0 ? firstPointIcon : pointIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-sm mb-1">
                  {idx === 0 ? 'Punto Inicial' : `Punto ${idx + 1}`}
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  {point[0].toFixed(6)}, {point[1].toFixed(6)}
                </p>
                {onRemovePoint && idx === points.length - 1 && (
                  <button
                    onClick={() => onRemovePoint(idx)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </>
  );
};
