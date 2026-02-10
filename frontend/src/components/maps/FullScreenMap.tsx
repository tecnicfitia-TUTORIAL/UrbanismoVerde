import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tipos de zona según especificación
type TipoZona = 'azotea' | 'solar_vacio' | 'parque_degradado' | 'espacio_abandonado' | 'zona_industrial' | 'otro';

// Interfaz para las áreas detectadas/dibujadas
interface Area {
  id: string;
  nombre: string;
  tipo: TipoZona;
  coordenadas: [number, number][];
  areaM2: number;
  notas?: string;
  fechaCreacion: Date;
}

// Interfaz para datos del formulario
interface FormData {
  nombre: string;
  tipo: TipoZona;
  notas: string;
}

// Colores por tipo de zona
const coloresPorTipo: Record<TipoZona, string> = {
  azotea: '#3b82f6',
  solar_vacio: '#ef4444',
  parque_degradado: '#f59e0b',
  espacio_abandonado: '#8b5cf6',
  zona_industrial: '#6b7280',
  otro: '#14b8a6'
};

// Componente para manejar eventos de dibujo en el mapa
const DrawingHandler: React.FC<{
  isDrawing: boolean;
  onPointClick: (latlng: LatLng) => void;
}> = ({ isDrawing, onPointClick }) => {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onPointClick(e.latlng);
      }
    }
  });
  return null;
};

const FullScreenMap: React.FC = () => {
  // Estados del componente
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: 'solar_vacio',
    notas: ''
  });

  // Referencia para almacenar coordenadas temporales
  const tempCoordsRef = useRef<[number, number][]>([]);

  // Calcular área usando fórmula de Haversine (aproximación para polígonos pequeños)
  const calcularArea = (coords: [number, number][]): number => {
    if (coords.length < 3) return 0;

    const R = 6371000; // Radio de la Tierra en metros
    let area = 0;

    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const lat1 = coords[i][0] * Math.PI / 180;
      const lat2 = coords[j][0] * Math.PI / 180;
      const lon1 = coords[i][1] * Math.PI / 180;
      const lon2 = coords[j][1] * Math.PI / 180;

      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2);
    return Math.round(area * 100) / 100; // Redondear a 2 decimales
  };

  // Iniciar modo de dibujo
  const handleStartDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
    tempCoordsRef.current = [];
  };

  // Manejar click en el mapa para agregar punto
  const handleMapClick = (latlng: LatLng) => {
    const newPoint: [number, number] = [latlng.lat, latlng.lng];
    const updatedCoords = [...tempCoordsRef.current, newPoint];
    tempCoordsRef.current = updatedCoords;
    setCurrentPolygon(updatedCoords);
  };

  // Completar dibujo y abrir modal
  const handleCompleteDrawing = () => {
    if (tempCoordsRef.current.length < 3) {
      alert('Necesitas al menos 3 puntos para crear un área');
      return;
    }
    setIsDrawing(false);
    setShowModal(true);
  };

  // Cancelar dibujo
  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPolygon([]);
    tempCoordsRef.current = [];
  };

  // Guardar área con datos del formulario
  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    const newArea: Area = {
      id: `area-${Date.now()}`,
      nombre: formData.nombre,
      tipo: formData.tipo,
      coordenadas: tempCoordsRef.current,
      areaM2: calcularArea(tempCoordsRef.current),
      notas: formData.notas || undefined,
      fechaCreacion: new Date()
    };

    setAreas([...areas, newArea]);
    setShowModal(false);
    setCurrentPolygon([]);
    tempCoordsRef.current = [];
    setFormData({ nombre: '', tipo: 'solar_vacio', notas: '' });
  };

  // Eliminar área
  const handleDeleteArea = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      setAreas(areas.filter(area => area.id !== id));
    }
  };

  // Cerrar modal sin guardar
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPolygon([]);
    tempCoordsRef.current = [];
    setFormData({ nombre: '', tipo: 'solar_vacio', notas: '' });
  };

  return (
    <div className="relative w-full h-full">
      {/* Mapa principal */}
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* Control de capas base */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="ESRI Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="OpenTopoMap">
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Manejador de eventos de dibujo */}
        <DrawingHandler isDrawing={isDrawing} onPointClick={handleMapClick} />

        {/* Polígono en construcción */}
        {currentPolygon.length >= 2 && (
          <Polygon
            positions={currentPolygon}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.3,
              weight: 3,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Áreas guardadas */}
        {areas.map((area) => (
          <Polygon
            key={area.id}
            positions={area.coordenadas}
            pathOptions={{
              color: coloresPorTipo[area.tipo],
              fillColor: coloresPorTipo[area.tipo],
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{area.nombre}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Tipo:</strong> {area.tipo.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Área:</strong> {area.areaM2.toLocaleString()} m²
                </p>
                {area.notas && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Notas:</strong> {area.notas}
                  </p>
                )}
                <button
                  onClick={() => handleDeleteArea(area.id)}
                  className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>

      {/* Panel de control */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-[250px]">
        <h2 className="text-xl font-bold text-primary-600 mb-4">🌱 EcoUrbe AI</h2>
        
        {!isDrawing ? (
          <div>
            <button
              onClick={handleStartDrawing}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold mb-3"
            >
              Dibujar Nueva Zona
            </button>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Áreas detectadas:</strong> {areas.length}
              </p>
              {areas.length > 0 && (
                <p className="text-xs">
                  Área total: {areas.reduce((sum, a) => sum + a.areaM2, 0).toLocaleString()} m²
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 mb-3">
              Haz click en el mapa para dibujar los puntos del polígono.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Puntos: {currentPolygon.length}
            </p>
            
            <div className="space-y-2">
              <button
                onClick={handleCompleteDrawing}
                disabled={currentPolygon.length < 3}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Completar Dibujo
              </button>
              
              <button
                onClick={handleCancelDrawing}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Datos de la Zona Verde
            </h3>
            
            <form onSubmit={handleSaveArea}>
              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Solar Calle Mayor"
                  required
                />
              </div>

              {/* Tipo */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Zona <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoZona })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="solar_vacio">Solar Vacío</option>
                  <option value="azotea">Azotea</option>
                  <option value="parque_degradado">Parque Degradado</option>
                  <option value="espacio_abandonado">Espacio Abandonado</option>
                  <option value="zona_industrial">Zona Industrial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Notas */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenMap;
