import React from 'react';
import { Undo, RotateCcw, CheckCircle, MapPin, Trash2 } from 'lucide-react';

interface DrawingToolsPanelProps {
  isDrawing: boolean;
  pointCount: number;
  onUndo: () => void;
  onReset: () => void;
  onComplete: () => void;
  onCancel: () => void;
  minPoints?: number;
}

export const DrawingToolsPanel: React.FC<DrawingToolsPanelProps> = ({
  isDrawing,
  pointCount,
  onUndo,
  onReset,
  onComplete,
  onCancel,
  minPoints = 3
}) => {
  if (!isDrawing) return null;

  const canComplete = pointCount >= minPoints;

  const handleReset = () => {
    if (pointCount > 0) {
      if (window.confirm(`¿Estás seguro de que quieres reiniciar? Se perderán ${pointCount} puntos.`)) {
        onReset();
      }
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="bg-white rounded-lg shadow-xl p-4 min-w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-700">Dibujando Zona</span>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            title="Cancelar dibujo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Point Counter */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Puntos añadidos:</span>
            <span className="font-bold text-lg text-blue-800">{pointCount}</span>
          </div>
          {pointCount < minPoints && (
            <p className="text-xs text-blue-600 mt-1">
              Necesitas al menos {minPoints} puntos para completar el polígono
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={pointCount === 0}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg transition
              ${pointCount > 0
                ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Deshacer último punto"
          >
            <Undo className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Deshacer</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={pointCount === 0}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg transition
              ${pointCount > 0
                ? 'bg-red-50 hover:bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title="Reiniciar todo"
          >
            <RotateCcw className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Reiniciar</span>
          </button>

          {/* Complete Button */}
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg transition
              ${canComplete
                ? 'bg-green-50 hover:bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            title={canComplete ? 'Completar polígono' : `Necesitas ${minPoints - pointCount} puntos más`}
          >
            <CheckCircle className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Completar</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>Ayuda:</strong> Haz clic en el mapa para añadir puntos. Los puntos se conectarán automáticamente.</p>
        </div>
      </div>
    </div>
  );
};
