import React, { useState, useEffect } from 'react';
import { MapIcon, MapPin, Search, SlidersHorizontal, Calendar, Trash2, Eye, Euro } from 'lucide-react';
import toast from 'react-hot-toast';
import { Area, TipoZona } from '../../types';
import { ZonaVerde } from '../../config/supabase';
import { loadZonasVerdes, deleteZonaVerde } from '../../services/zona-storage';
import EmptyState from '../common/EmptyState';
import { coloresPorTipo } from '../../types';

interface ZonesGalleryContentProps {
  areas: Area[];
  onSelectZone: (area: Area) => void;
  onNavigate: (view: string, data?: any) => void;
  onDeleteArea: (id: string) => void;
}

const ZonesGalleryContent: React.FC<ZonesGalleryContentProps> = ({
  areas,
  onSelectZone,
  onNavigate,
  onDeleteArea
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'area' | 'name'>('recent');
  const [dbZones, setDbZones] = useState<ZonaVerde[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load zones from database
  useEffect(() => {
    async function loadZones() {
      try {
        setIsLoading(true);
        console.log('🔍 ZonesGallery: Loading zones from database...');
        const zones = await loadZonasVerdes();
        console.log(`✅ ZonesGallery: Loaded ${zones.length} zones from DB:`, zones);
        setDbZones(zones);
      } catch (error) {
        console.error('❌ ZonesGallery: Error loading zones:', error);
        toast.error('Error al cargar zonas guardadas');
      } finally {
        setIsLoading(false);
      }
    }

    loadZones();
  }, []);

  // Convert ZonaVerde to Area format for compatibility
  const convertZonaToArea = (zona: ZonaVerde): Area => {
    console.log('🔄 Converting zona to area format:', zona);
    
    const converted = {
      id: zona.id,
      nombre: zona.nombre,
      tipo: zona.tipo as TipoZona,
      coordenadas: zona.coordenadas?.coordinates?.[0] || [],
      areaM2: zona.area_m2,
      notas: zona.notas,
      fechaCreacion: new Date(zona.created_at),
    };
    
    console.log('✅ Converted result:', converted);
    return converted;
  };

  // Combine DB zones with local areas (for backward compatibility)
  const convertedDbZones = dbZones.map(convertZonaToArea);
  console.log(`📊 ZonesGallery: DB zones (${dbZones.length}) → converted (${convertedDbZones.length})`);
  console.log(`📊 ZonesGallery: Local areas: ${areas.length}`);

  const allZones = [
    ...convertedDbZones,
    ...areas
  ];

  console.log(`📊 ZonesGallery: Total zones to display: ${allZones.length}`, allZones);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando zonas...</p>
        </div>
      </div>
    );
  }

  // Filtrar zonas
  const filteredAreas = allZones.filter(area => {
    const matchesSearch = area.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || area.tipo === filterType;
    return matchesSearch && matchesType;
  });

  // Ordenar zonas
  const sortedAreas = [...filteredAreas].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      case 'area':
        return b.areaM2 - a.areaM2;
      case 'name':
        return a.nombre.localeCompare(b.nombre);
      default:
        return 0;
    }
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('¿Estás seguro de eliminar esta zona? Esta acción no se puede deshacer.')) {
      return;
    }

    const toastId = toast.loading('Eliminando zona...');

    try {
      // Check if this is a database zone (UUID format) or local zone
      const isDbZone = dbZones.some(z => z.id === id);

      if (isDbZone) {
        // Delete from database
        await deleteZonaVerde(id);
        
        // Update local state
        setDbZones(dbZones.filter(z => z.id !== id));
        
        toast.success('✅ Zona eliminada de la base de datos', { id: toastId });
      } else {
        // Delete local zone only (fallback for backward compatibility)
        onDeleteArea(id);
        toast.success('✅ Zona eliminada', { id: toastId });
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('❌ Error al eliminar la zona', { id: toastId });
    }
  };

  if (allZones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <EmptyState
          icon={<MapIcon size={64} />}
          title="No hay zonas creadas todavía"
          description="Comienza dibujando una zona en el mapa para empezar a transformar espacios urbanos en áreas verdes"
          primaryAction={{
            label: 'Crear mi primera zona',
            onClick: () => onNavigate('zonas-create')
          }}
          secondaryAction={{
            label: 'Ver tutorial',
            onClick: () => alert('Tutorial próximamente')
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zonas Verdes
          </h1>
          <p className="text-gray-600">
            Gestiona todas tus zonas verdes creadas
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar zonas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <SlidersHorizontal size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos los tipos</option>
                <option value="azotea">Azotea</option>
                <option value="solar_vacio">Solar vacío</option>
                <option value="parque_degradado">Parque degradado</option>
                <option value="espacio_abandonado">Espacio abandonado</option>
                <option value="zona_industrial">Zona industrial</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'area' | 'name')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="recent">Más reciente</option>
                <option value="area">Mayor área</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {sortedAreas.length} de {allZones.length} zonas
        </div>

        {/* Zones Grid */}
        {sortedAreas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No se encontraron zonas con los filtros aplicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAreas.map((area) => {
              const isNew = (new Date().getTime() - new Date(area.fechaCreacion).getTime()) < 7 * 24 * 60 * 60 * 1000;
              
              return (
                <div
                  key={area.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {/* Mini Map Preview */}
                  <div 
                    className="h-32 relative cursor-pointer"
                    style={{ backgroundColor: coloresPorTipo[area.tipo] + '20' }}
                    onClick={() => onNavigate('zonas-detail', area)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapIcon size={48} style={{ color: coloresPorTipo[area.tipo] }} className="opacity-40" />
                    </div>
                    {isNew && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                        🆕 Nueva
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 
                        className="font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-primary-600"
                        onClick={() => onNavigate('zonas-detail', area)}
                      >
                        {area.nombre}
                      </h3>
                      <span 
                        className="px-2 py-1 rounded text-xs font-semibold ml-2 flex-shrink-0"
                        style={{ 
                          backgroundColor: coloresPorTipo[area.tipo] + '20',
                          color: coloresPorTipo[area.tipo]
                        }}
                      >
                        {area.tipo.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{area.areaM2.toFixed(2)} m²</span>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Calendar size={12} className="mr-1" />
                      <span>
                        {new Date(area.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigate('zonas-detail', area)}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <Eye size={14} className="mr-1" />
                        Ver detalle
                      </button>
                      <button
                        onClick={() => {
                          onSelectZone(area);
                          onNavigate('presupuestos-create', area);
                        }}
                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        title="Generar presupuesto"
                      >
                        <Euro size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(area.id, e)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZonesGalleryContent;
