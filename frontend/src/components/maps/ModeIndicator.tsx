import React from 'react';
import { MapMode } from './MapModeControl';

interface ModeIndicatorProps {
  mode: MapMode;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode }) => {
  if (mode === 'idle') return null;

  const modeConfig = {
    draw: {
      label: 'Modo Dibujo Activo',
      color: 'bg-green-600',
      icon: '✏️',
      description: 'Haz clic en el mapa para añadir puntos'
    },
    analyze: {
      label: 'Modo Análisis Activo',
      color: 'bg-blue-600',
      icon: '🔍',
      description: 'Haz clic en cualquier ubicación para analizar'
    },
    gallery: {
      label: 'Modo Galería Activo',
      color: 'bg-purple-600',
      icon: '📋',
      description: 'Navegando zonas guardadas'
    }
  };

  const config = modeConfig[mode];
  if (!config) return null;

  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-[999] ${config.color} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in`}>
      <span>{config.icon}</span>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">{config.label}</span>
        <span className="text-xs opacity-90">{config.description}</span>
      </div>
      <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-2" />
    </div>
  );
};
