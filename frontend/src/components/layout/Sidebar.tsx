import React, { useState } from 'react';
import { Home, MapPin, PlusCircle, Brain, BarChart3, Settings, Menu, X, Euro } from 'lucide-react';
import { Area } from '../../types';
import ZoneCard from '../cards/ZoneCard';
import MaterialsPanel from '../panels/MaterialsPanel';

interface SidebarProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  areas: Area[];
  onDeleteArea: (id: string) => void;
  onCenterArea: (coords: [number, number][]) => void;
  selectedArea: Area | null;
  onSelectArea: (area: Area | null) => void;
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
  onCenterArea,
  selectedArea,
  onSelectArea
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<string>('zonas');

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
      active: activeView === 'dashboard',
      disabled: true
    },
    {
      id: 'zonas',
      icon: <MapPin size={20} />,
      label: 'Zonas Verdes',
      active: activeView === 'zonas',
      onClick: () => setActiveView('zonas')
    },
    {
      id: 'dibujar',
      icon: <PlusCircle size={20} />,
      label: 'Dibujar Nueva Zona',
      onClick: () => {
        setActiveView('dibujar');
        onStartDrawing();
      },
      active: isDrawing || activeView === 'dibujar'
    },
    {
      id: 'analisis',
      icon: <Brain size={20} />,
      label: 'Análisis IA',
      onClick: () => setActiveView('analisis'),
      active: activeView === 'analisis'
    },
    {
      id: 'presupuestos',
      icon: <Euro size={20} />,
      label: 'Presupuestos',
      onClick: () => setActiveView('presupuestos'),
      active: activeView === 'presupuestos'
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

      <nav className="flex-shrink-0 border-b border-gray-200">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`
              w-full flex items-center px-4 py-3 transition-colors relative
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
            {!isCollapsed && item.id === 'dibujar' && isDrawing && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Sección de Zonas Guardadas */}
      {!isCollapsed && activeView === 'zonas' && (
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

      {/* Ayuda Contextual para Análisis IA */}
      {!isCollapsed && activeView === 'analisis' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Modo Análisis IA</p>
                  <p className="text-sm text-blue-800">
                    Haz clic en cualquier punto del mapa para analizar su potencial de reforestación.
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Click en el mapa para seleccionar un punto</li>
                    <li>Se abrirá un panel con las coordenadas</li>
                    <li>Click en "Analizar Potencial Verde"</li>
                    <li>Recibe resultados con especies recomendadas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Presupuestos */}
      {!isCollapsed && activeView === 'presupuestos' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedArea ? (
            <MaterialsPanel 
              area={selectedArea}
              onClose={() => onSelectArea(null)}
            />
          ) : (
            <div className="p-4">
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-start gap-3">
                  <Euro className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary-900 mb-2">Presupuestos y Materiales</p>
                    <p className="text-sm text-primary-800 mb-3">
                      Selecciona una zona guardada para ver su presupuesto detallado y productos recomendados.
                    </p>
                    {areas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-primary-700 font-semibold">Zonas disponibles:</p>
                        {areas.map((area) => (
                          <button
                            key={area.id}
                            onClick={() => onSelectArea(area)}
                            className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-primary-100 transition-colors border border-primary-200"
                          >
                            <p className="text-sm font-semibold text-gray-800">{area.nombre}</p>
                            <p className="text-xs text-gray-600">{area.areaM2.toFixed(2)} m²</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {areas.length === 0 && (
                      <p className="text-xs text-primary-700 mt-2">
                        No hay zonas guardadas. Dibuja una nueva zona para comenzar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
