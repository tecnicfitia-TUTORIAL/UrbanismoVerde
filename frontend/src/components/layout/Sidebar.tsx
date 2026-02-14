import React, { useState, useEffect } from 'react';
import { Home, MapPin, PlusCircle, Brain, BarChart3, Euro, Menu, X, List, Search, Sparkles, Map, History, ChevronDown, ChevronRight, Layers, Clipboard, Building2 } from 'lucide-react';
import { Area, MenuItem as MenuItemType } from '../../types';
import SubMenu from './SubMenu';
import { countSpecializedAnalyses } from '../../services/specialized-analysis-service';
import { countConjuntosZonas } from '../../services/conjunto-zonas-service';

interface SidebarProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  areas: Area[];
  dbZonasCount: number;
  onDeleteArea: (id: string) => void;
  onCenterArea: (coords: [number, number][]) => void;
  selectedArea: Area | null;
  onSelectArea: (area: Area | null) => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isDrawing,
  onStartDrawing,
  areas,
  dbZonasCount,
  onDeleteArea,
  onCenterArea,
  selectedArea,
  onSelectArea,
  activeView,
  onViewChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);
  const [especialesCount, setEspecialesCount] = useState(0);
  const [conjuntosCount, setConjuntosCount] = useState(0);

  // Load specialized analysis count
  useEffect(() => {
    loadEspecialesCount();
    loadConjuntosCount();
  }, []);

  const loadEspecialesCount = async () => {
    try {
      const count = await countSpecializedAnalyses();
      setEspecialesCount(count);
    } catch (error) {
      console.error('Error loading specialized analyses count:', error);
    }
  };

  const loadConjuntosCount = async () => {
    try {
      const count = await countConjuntosZonas();
      setConjuntosCount(count);
    } catch (error) {
      console.error('Error loading conjuntos count:', error);
    }
  };

  // Menu structure with submenus - SIMPLIFIED TO 5 MAIN SECTIONS
  const menuStructure: MenuItemType[] = [
    {
      id: 'dashboard',
      icon: <Home size={20} />,
      label: 'Dashboard',
      view: 'dashboard',
      subItems: []
    },
    {
      id: 'analisis-urbano',
      icon: <Brain size={20} />,
      label: 'Análisis Urbano',
      view: 'proyectos',
      count: dbZonasCount + areas.length + especialesCount + conjuntosCount,
      subItems: [
        { id: 'zonas-verdes', label: 'Zonas Verdes', icon: <MapPin size={16} />, view: 'proyectos', count: dbZonasCount + areas.length },
        { id: 'analisis-ia', label: 'Análisis IA', icon: <Sparkles size={16} />, view: 'analisis-new' },
        { id: 'analisis-especializados', label: 'Análisis Especializados', icon: <Layers size={16} />, view: 'analisis-especializados', count: especialesCount },
        { id: 'conjuntos-zonas', label: 'Conjuntos de Zonas', icon: <Layers size={16} />, view: 'conjuntos-zonas', count: conjuntosCount },
        { id: 'crear-zona', label: 'Crear nueva zona', icon: <PlusCircle size={16} />, view: 'zonas-create' }
      ]
    },
    {
      id: 'inspecciones-tejados',
      icon: <Clipboard size={20} />,
      label: 'Inspección Tejados',
      view: 'inspecciones-tejados',
      subItems: []
    },
    {
      id: 'presupuestos',
      icon: <Euro size={20} />,
      label: 'Presupuestos',
      view: 'presupuestos',
      subItems: [
        { id: 'presupuestos-gallery', label: 'Ver todos', icon: <List size={16} />, view: 'presupuestos-gallery' },
        { id: 'presupuestos-create', label: 'Crear nuevo', icon: <PlusCircle size={16} />, view: 'presupuestos-create' }
      ]
    },
    {
      id: 'configuracion',
      icon: <BarChart3 size={20} />,
      label: 'Configuración',
      view: 'configuracion',
      disabled: true,
      subItems: []
    }
  ];

  const handleMenuClick = (item: MenuItemType) => {
    if (item.disabled) return;
    
    // Toggle expansion for items with submenus
    if (item.subItems && item.subItems.length > 0) {
      if (expandedSections.includes(item.id)) {
        setExpandedSections(expandedSections.filter(id => id !== item.id));
      } else {
        setExpandedSections([...expandedSections, item.id]);
      }
    }
    
    // Navigate to the view
    if (item.view === 'zonas-create') {
      onStartDrawing();
    }
    onViewChange(item.view);
  };

  const handleSubMenuClick = (item: any) => {
    if (item.view === 'zonas-create') {
      onStartDrawing();
    }
    onViewChange(item.view);
  };

  const isActive = (item: MenuItemType) => {
    // Check if the current view matches this item or any of its subitems
    if (activeView === item.view) return true;
    if (item.subItems) {
      return item.subItems.some(sub => activeView === sub.view);
    }
    return false;
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

      <nav className="flex-1 overflow-y-auto">
        {menuStructure.map((item) => {
          const active = isActive(item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedSections.includes(item.id);
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center px-4 py-3 transition-colors relative
                  ${active ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600' : 'text-gray-700 hover:bg-gray-50'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isCollapsed ? 'justify-center' : 'space-x-3'}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={active ? 'text-primary-600' : 'text-gray-600'}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        active ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                    {item.disabled && (
                      <span className="text-xs text-gray-400">(próximo)</span>
                    )}
                    {hasSubItems && (
                      <span className="text-gray-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                  </>
                )}
                {!isCollapsed && activeView === 'zonas-create' && isDrawing && item.view === 'zonas-create' && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </span>
                )}
              </button>
              
              {!isCollapsed && hasSubItems && (
                <SubMenu
                  items={item.subItems!.map(sub => ({
                    ...sub,
                    active: activeView === sub.view
                  }))}
                  parentActive={isExpanded}
                  onItemClick={handleSubMenuClick}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Estado Colapsado - Solo Contador */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-start pt-4">
          <div className="flex flex-col items-center">
            <MapPin size={24} className="text-gray-400 mb-2" />
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
              {dbZonasCount + areas.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
