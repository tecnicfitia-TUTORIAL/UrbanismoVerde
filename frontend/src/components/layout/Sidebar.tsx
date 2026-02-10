import React, { useState } from 'react';
import { Home, MapPin, PlusCircle, Brain, BarChart3, Settings, Menu, X } from 'lucide-react';
import { Area } from '../../types';
import ZoneCard from '../cards/ZoneCard';

interface SidebarProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  areas: Area[];
  onDeleteArea: (id: string) => void;
  onCenterArea: (coords: [number, number][]) => void;
}

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isDrawing,
  onStartDrawing,
  areas,
  onDeleteArea,
  onCenterArea
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
      active: false,
      disabled: true
    },
    {
      id: 'zonas',
      icon: <MapPin size={20} />,
      label: 'Zonas Verdes',
      active: true
    },
    {
      id: 'dibujar',
      icon: <PlusCircle size={20} />,
      label: 'Dibujar Nueva Zona',
      onClick: onStartDrawing,
      active: isDrawing
    },
    {
      id: 'analisis',
      icon: <Brain size={20} />,
      label: 'Análisis IA',
      disabled: true
    },
    {
      id: 'estadisticas',
      icon: <BarChart3 size={20} />,
      label: 'Estadísticas',
      disabled: true
    },
    {
      id: 'configuracion',
      icon: <Settings size={20} />,
      label: 'Configuración',
      disabled: true
    }
  ];

  const handleCenterArea = (coords: [number, number][]) => {
    onCenterArea(coords);
  };

  const handleDeleteArea = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      onDeleteArea(id);
    }
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-16' : 'w-[280px]'
      } bg-white border-r border-gray-200 shadow-xl transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-[1000] md:relative`}
    >
      {/* Header con Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <h1 className="text-lg font-bold text-primary-600">EcoUrbe AI</h1>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-shrink-0 border-b border-gray-200">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`
              w-full flex items-center px-4 py-3 transition-colors
              ${item.active ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600' : 'text-gray-700 hover:bg-gray-50'}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <span className={item.active ? 'text-primary-600' : 'text-gray-600'}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
            {!isCollapsed && item.disabled && (
              <span className="ml-auto text-xs text-gray-400">(próximo)</span>
            )}
          </button>
        ))}
      </nav>

      {/* Sección de Zonas Guardadas */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Zonas Guardadas</h2>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                {areas.length}
              </span>
            </div>
            {areas.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Total: {areas.reduce((sum, a) => sum + a.areaM2, 0).toLocaleString()} m²
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {areas.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p>No hay zonas guardadas</p>
                <p className="text-xs mt-1">Dibuja una nueva zona para comenzar</p>
              </div>
            ) : (
              areas.map((area) => (
                <ZoneCard
                  key={area.id}
                  area={area}
                  onCenter={() => handleCenterArea(area.coordenadas)}
                  onDelete={() => handleDeleteArea(area.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Estado Colapsado - Solo Contador */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-start pt-4">
          <div className="flex flex-col items-center">
            <MapPin size={24} className="text-gray-400 mb-2" />
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {areas.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
