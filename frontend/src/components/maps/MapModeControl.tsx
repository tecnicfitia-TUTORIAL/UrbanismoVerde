import React from 'react';
import { Pencil, Search, Grid, X } from 'lucide-react';

export type MapMode = 'idle' | 'draw' | 'analyze' | 'gallery';

interface MapModeControlProps {
  currentMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  disabled?: boolean;
}

interface ModeButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  tooltip: string;
  disabled?: boolean;
}

const ModeButton: React.FC<ModeButtonProps> = ({
  icon,
  label,
  active,
  onClick,
  tooltip,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
        ${active 
          ? 'bg-green-600 text-white shadow-lg scale-105' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        disabled:hover:bg-gray-50
      `}
      title={tooltip}
    >
      <span className={active ? 'text-white' : 'text-gray-600'}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
      {active && (
        <span className="ml-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </span>
      )}
    </button>
  );
};

export const MapModeControl: React.FC<MapModeControlProps> = ({
  currentMode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-xl p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Modo de Mapa
        </h3>
        {currentMode !== 'idle' && (
          <button
            onClick={() => onModeChange('idle')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Desactivar modo"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <ModeButton
          icon={<Pencil size={18} />}
          label="Dibujar"
          active={currentMode === 'draw'}
          onClick={() => onModeChange('draw')}
          tooltip="Dibujar nuevas zonas verdes en el mapa"
          disabled={disabled}
        />
        <ModeButton
          icon={<Search size={18} />}
          label="Analizar"
          active={currentMode === 'analyze'}
          onClick={() => onModeChange('analyze')}
          tooltip="Hacer clic en ubicaciones para análisis con IA"
          disabled={disabled}
        />
        <ModeButton
          icon={<Grid size={18} />}
          label="Galería"
          active={currentMode === 'gallery'}
          onClick={() => onModeChange('gallery')}
          tooltip="Ver y gestionar zonas guardadas"
          disabled={disabled}
        />
      </div>
      
      {currentMode === 'idle' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Selecciona un modo para comenzar
          </p>
        </div>
      )}
    </div>
  );
};
