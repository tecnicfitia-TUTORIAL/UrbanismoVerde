import React, { useEffect, useState } from 'react';
import { MapIcon, Brain, Euro, MapPin, Calendar } from 'lucide-react';
import { Area } from '../../types';
import StatsCard from '../common/StatsCard';
import { supabase, TABLES } from '../../config/supabase';

interface DashboardContentProps {
  areas: Area[];
  onNavigate: (view: string, data?: any) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ areas, onNavigate }) => {
  // State for database stats
  const [dbStats, setDbStats] = useState({
    zonasVerdesCount: 0,
    zonasVerdesArea: 0,
    analisisCount: 0,
  });

  // Calcular estadísticas locales
  const stats = {
    zonasCreadas: areas.length + dbStats.zonasVerdesCount,
    areaTotal: areas.reduce((sum, a) => sum + a.areaM2, 0) + dbStats.zonasVerdesArea,
    presupuestosGenerados: areas.length, // Un presupuesto simulado por cada zona local
    analisisRealizados: dbStats.analisisCount,
  };

  // Load stats from database and subscribe to real-time updates
  useEffect(() => {
    loadDatabaseStats();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.ZONAS_VERDES,
        },
        () => {
          console.log('🔄 Zonas verdes actualizadas, recargando stats...');
          loadDatabaseStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.ANALISIS,
        },
        () => {
          console.log('🔄 Análisis actualizados, recargando stats...');
          loadDatabaseStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadDatabaseStats() {
    try {
      // Count zonas verdes
      const { count: zonasCount } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('*', { count: 'exact', head: true });

      // Calculate total area from database
      const { data: zonas } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('area_m2');

      const zonasArea = zonas?.reduce((sum, z) => sum + (z.area_m2 || 0), 0) || 0;

      // Count analysis
      const { count: analisisCount } = await supabase
        .from(TABLES.ANALISIS)
        .select('*', { count: 'exact', head: true });

      setDbStats({
        zonasVerdesCount: zonasCount || 0,
        zonasVerdesArea: zonasArea,
        analisisCount: analisisCount || 0,
      });

      console.log('📊 Dashboard stats loaded:', {
        zonasVerdes: zonasCount,
        zonasArea,
        analisis: analisisCount,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  // Obtener últimas 5 zonas
  const recentAreas = [...areas]
    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
    .slice(0, 5);

  const quickAccessCards = [
    {
      icon: <MapIcon size={48} />,
      title: 'Dibujar Zonas',
      description: 'Mapea espacios y crea zonas verdes',
      cta: 'Comenzar',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      onClick: () => onNavigate('zonas-create')
    },
    {
      icon: <Brain size={48} />,
      title: 'Análisis IA',
      description: 'Evalúa el potencial de reforestación',
      cta: 'Analizar',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      onClick: () => onNavigate('analisis-new')
    },
    {
      icon: <Euro size={48} />,
      title: 'Presupuestos',
      description: 'Calcula materiales y costes',
      cta: 'Ver presupuestos',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      onClick: () => onNavigate('presupuestos-gallery')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a EcoUrbe AI
          </h1>
          <p className="text-gray-600">
            Transforma espacios urbanos en zonas verdes sostenibles con ayuda de la inteligencia artificial
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickAccessCards.map((card, index) => (
            <button
              key={index}
              onClick={card.onClick}
              className="group relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-500 hover:shadow-xl transition-all duration-300 cursor-pointer text-left overflow-hidden"
            >
              <div className={`absolute inset-0 ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="relative z-10">
                <div className={`${card.color} text-white p-4 rounded-lg inline-flex mb-4`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {card.description}
                </p>
                <span className="inline-flex items-center text-primary-600 font-medium text-sm group-hover:text-primary-700">
                  {card.cta}
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Estadísticas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<MapPin size={24} />}
              label="Zonas Creadas"
              value={stats.zonasCreadas}
              color="green"
            />
            <StatsCard
              icon={<MapIcon size={24} />}
              label="Área Total"
              value={Math.round(stats.areaTotal).toLocaleString()}
              unit="m²"
              color="blue"
            />
            <StatsCard
              icon={<Euro size={24} />}
              label="Presupuestos"
              value={stats.presupuestosGenerados}
              color="purple"
            />
            <StatsCard
              icon={<Brain size={24} />}
              label="Análisis IA"
              value={stats.analisisRealizados}
              color="orange"
            />
          </div>
        </div>

        {/* Recent Activity Section */}
        {recentAreas.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Actividad Reciente
              </h2>
              <button
                onClick={() => onNavigate('zonas-gallery')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todas →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => onNavigate('zonas-detail', area)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {area.nombre}
                    </h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-semibold ml-2">
                      {area.tipo.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapIcon size={14} className="mr-1" />
                    <span>{area.areaM2.toFixed(2)} m²</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    <span>
                      {new Date(area.fechaCreacion).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for new users */}
        {areas.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Comienza tu primer proyecto verde!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Dibuja una zona en el mapa o analiza un punto específico para comenzar a transformar espacios urbanos
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onNavigate('zonas-create')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Dibujar mi primera zona
              </button>
              <button
                onClick={() => onNavigate('analisis-new')}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Analizar un punto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
