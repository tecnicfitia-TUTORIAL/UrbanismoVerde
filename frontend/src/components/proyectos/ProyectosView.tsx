/**
 * ProyectosView Component
 * Unified view for all project types with tabbed interface
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Building2, Grid } from 'lucide-react';
import ZonesGalleryContent from '../zones/ZonesGalleryContent';
import SpecializedAnalysisGallery from '../analysis/SpecializedAnalysisGallery';
import ConjuntosGallery from '../conjuntos/ConjuntosGallery';
import { Area } from '../../types';
import { countSpecializedAnalyses } from '../../services/specialized-analysis-service';
import { countConjuntosZonas } from '../../services/conjunto-zonas-service';
import { supabase, TABLES } from '../../config/supabase';

interface ProyectosViewProps {
  areas: Area[];
  onNavigate: (view: string, data?: any) => void;
  onDeleteArea: (id: string) => void;
  onSelectZone: (area: Area | null) => void;
}

type TabId = 'todos' | 'zonas' | 'conjuntos' | 'especializados';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

const ProyectosView: React.FC<ProyectosViewProps> = ({
  areas,
  onNavigate,
  onDeleteArea,
  onSelectZone
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('todos');
  const [zonasCount, setZonasCount] = useState(0);
  const [conjuntosCount, setConjuntosCount] = useState(0);
  const [especialesCount, setEspecialesCount] = useState(0);

  const tabs: Tab[] = [
    {
      id: 'todos',
      label: 'Todos los Proyectos',
      icon: <Grid size={18} />,
      count: zonasCount + conjuntosCount + especialesCount
    },
    {
      id: 'zonas',
      label: 'Zonas Individuales',
      icon: <MapPin size={18} />,
      count: zonasCount
    },
    {
      id: 'conjuntos',
      label: 'Conjuntos',
      icon: <Layers size={18} />,
      count: conjuntosCount
    },
    {
      id: 'especializados',
      label: 'Análisis Urbanos',
      icon: <Building2 size={18} />,
      count: especialesCount
    }
  ];

  // Load counts when component mounts
  useEffect(() => {
    loadCounts();
  }, [areas]);

  const loadCounts = async () => {
    try {
      // Load zonas count from DB
      const { count: dbZonasCount } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('*', { count: 'exact', head: true });
      setZonasCount((dbZonasCount || 0) + areas.length);

      // Load specialized analyses count
      const especialesCount = await countSpecializedAnalyses();
      setEspecialesCount(especialesCount);

      // Load conjuntos count
      const conjuntosCountValue = await countConjuntosZonas();
      setConjuntosCount(conjuntosCountValue);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'todos':
        // Show all project types in a combined view
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Zonas Verdes</h3>
              <ZonesGalleryContent
                areas={areas}
                onSelectZone={onSelectZone}
                onNavigate={onNavigate}
                onDeleteArea={onDeleteArea}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Análisis Especializados</h3>
              <SpecializedAnalysisGallery onNavigate={onNavigate} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Conjuntos de Zonas</h3>
              <ConjuntosGallery
                onViewOnMap={(conjuntoId) => {
                  // TODO: Implement visualization on map
                  console.log('View conjunto on map:', conjuntoId);
                }}
                onConjuntoDeleted={loadCounts}
              />
            </div>
          </div>
        );
      
      case 'zonas':
        return (
          <ZonesGalleryContent
            areas={areas}
            onSelectZone={onSelectZone}
            onNavigate={onNavigate}
            onDeleteArea={onDeleteArea}
          />
        );
      
      case 'conjuntos':
        return (
          <ConjuntosGallery
            onViewOnMap={(conjuntoId) => {
              // TODO: Implement visualization on map
              console.log('View conjunto on map:', conjuntoId);
            }}
            onConjuntoDeleted={() => {
              loadCounts();
            }}
          />
        );
      
      case 'especializados':
        return <SpecializedAnalysisGallery onNavigate={onNavigate} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proyectos Urbanos
          </h1>
          <p className="text-gray-600">
            Gestiona todas tus zonas verdes, análisis y proyectos en un solo lugar
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`
                          ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProyectosView;
