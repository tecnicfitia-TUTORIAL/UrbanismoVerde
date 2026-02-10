import React, { useState, useMemo } from 'react';
import { X, Package, Droplets, Leaf, Calculator, ShoppingCart, Plus } from 'lucide-react';
import { Area, MarketplaceProduct } from '../../types';
import { calcularPerimetro, calculateMaterials } from '../../utils/calculations';

interface MaterialsPanelProps {
  area: Area;
  onClose: () => void;
}

// Productos del marketplace
const marketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'prod-1',
    nombre: 'Kit Riego Inteligente WiFi',
    descripcion: 'Control automático con sensor de humedad',
    precio: 89,
    categoria: 'riego',
    badge: 'Recomendado'
  },
  {
    id: 'prod-2',
    nombre: 'Pack Semillas Autóctonas',
    descripcion: 'Especies adaptadas al clima local',
    precio: 25,
    categoria: 'semillas',
    badge: 'Eco-friendly'
  },
  {
    id: 'prod-3',
    nombre: 'Sustrato Premium Orgánico',
    descripcion: '100% compostado, rico en nutrientes',
    precio: 12,
    categoria: 'sustrato',
    badge: 'Mejor valorado'
  },
  {
    id: 'prod-4',
    nombre: 'Kit Jardinería Profesional',
    descripcion: 'Set completo de herramientas',
    precio: 45,
    categoria: 'herramientas',
    badge: 'Esencial'
  }
];

const MaterialsPanel: React.FC<MaterialsPanelProps> = ({ area, onClose }) => {
  const [productosEnPresupuesto, setProductosEnPresupuesto] = useState<string[]>([]);

  // Calcular perímetro y materiales
  const perimetro = useMemo(() => calcularPerimetro(area.coordenadas), [area.coordenadas]);
  const materiales = useMemo(() => calculateMaterials(area.areaM2, perimetro), [area.areaM2, perimetro]);

  // Calcular total con productos adicionales
  const totalConProductos = useMemo(() => {
    const totalProductos = marketplaceProducts
      .filter(p => productosEnPresupuesto.includes(p.id))
      .reduce((sum, p) => sum + p.precio, 0);
    return materiales.total + totalProductos;
  }, [materiales.total, productosEnPresupuesto]);

  const handleAddToPresupuesto = (productId: string) => {
    if (!productosEnPresupuesto.includes(productId)) {
      setProductosEnPresupuesto([...productosEnPresupuesto, productId]);
    }
  };

  const handleComprar = (productId: string) => {
    // TODO: Implementar lógica de compra o redirección
    alert('Funcionalidad de compra próximamente');
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'riego':
        return <Droplets className="w-5 h-5" />;
      case 'semillas':
        return <Leaf className="w-5 h-5" />;
      case 'sustrato':
        return <Package className="w-5 h-5" />;
      case 'herramientas':
        return <Calculator className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Recomendado':
        return 'bg-primary-100 text-primary-700';
      case 'Eco-friendly':
        return 'bg-green-100 text-green-700';
      case 'Mejor valorado':
        return 'bg-blue-100 text-blue-700';
      case 'Esencial':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-800">Presupuesto</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* A. Información del Polígono */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Información de la Zona</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Nombre:</span>
              <span className="text-sm font-semibold text-gray-800">{area.nombre}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Área total:</span>
              <span className="text-sm font-semibold text-gray-800">{area.areaM2.toFixed(2)} m²</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Perímetro:</span>
              <span className="text-sm font-semibold text-gray-800">{perimetro.toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* B. Cálculo de Presupuesto */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Cálculo de Materiales</h3>
          
          {/* Sustrato */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-sm text-gray-800">Sustrato necesario</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Volumen:</span>
                <span>{materiales.sustrato.volumenM3.toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Bolsas (0.05m³):</span>
                <span>{materiales.sustrato.bolsas} bolsas</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-800">
                <span>Coste:</span>
                <span>{materiales.sustrato.coste}€</span>
              </div>
            </div>
          </div>

          {/* Riego */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-gray-800">Sistema de riego por goteo</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Metros lineales:</span>
                <span>{materiales.riego.metrosLineales} m</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-800">
                <span>Coste:</span>
                <span>{materiales.riego.coste}€</span>
              </div>
            </div>
          </div>

          {/* Plantas */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-sm text-gray-800">Plantas/Especies</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Cantidad:</span>
                <span>{materiales.plantas.cantidad} plantas</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-800">
                <span>Coste:</span>
                <span>{materiales.plantas.coste}€</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-primary-50 border-2 border-primary-500 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800">Total Materiales:</span>
              <span className="font-bold text-xl text-primary-600">{materiales.total}€</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-600">Coste por m²:</span>
              <span className="text-xs text-gray-700">{(materiales.total / area.areaM2).toFixed(2)}€/m²</span>
            </div>
          </div>
        </div>

        {/* C. Desglose Visual */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Desglose Detallado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-2 font-semibold text-gray-700">Concepto</th>
                  <th className="text-right p-2 font-semibold text-gray-700">Cantidad</th>
                  <th className="text-right p-2 font-semibold text-gray-700">P. Unit.</th>
                  <th className="text-right p-2 font-semibold text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-2 text-gray-700">Sustrato</td>
                  <td className="text-right p-2 text-gray-600">{materiales.sustrato.bolsas} bolsas</td>
                  <td className="text-right p-2 text-gray-600">8€</td>
                  <td className="text-right p-2 font-semibold text-gray-800">{materiales.sustrato.coste}€</td>
                </tr>
                <tr>
                  <td className="p-2 text-gray-700">Riego</td>
                  <td className="text-right p-2 text-gray-600">{materiales.riego.metrosLineales} m</td>
                  <td className="text-right p-2 text-gray-600">2.5€</td>
                  <td className="text-right p-2 font-semibold text-gray-800">{materiales.riego.coste}€</td>
                </tr>
                <tr>
                  <td className="p-2 text-gray-700">Plantas</td>
                  <td className="text-right p-2 text-gray-600">{materiales.plantas.cantidad} uds</td>
                  <td className="text-right p-2 text-gray-600">5€</td>
                  <td className="text-right p-2 font-semibold text-gray-800">{materiales.plantas.coste}€</td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="p-2 text-gray-800" colSpan={3}>Total</td>
                  <td className="text-right p-2 text-primary-600">{materiales.total}€</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* D. Marketplace de Productos Recomendados */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">Productos Recomendados</h3>
          <div className="space-y-3">
            {marketplaceProducts.map((product) => {
              const isAdded = productosEnPresupuesto.includes(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getIconForCategory(product.categoria)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-800">{product.nombre}</h4>
                        {product.badge && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(product.badge)}`}>
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{product.descripcion}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-gray-800">{product.precio}€</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddToPresupuesto(product.id)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1 transition-colors ${
                              isAdded
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-500 hover:bg-primary-600 text-white'
                            }`}
                          >
                            <Plus size={14} />
                            <span>{isAdded ? 'Añadido' : 'Añadir'}</span>
                          </button>
                          <button
                            onClick={() => handleComprar(product.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1 transition-colors"
                          >
                            <ShoppingCart size={14} />
                            <span>Comprar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Final con productos */}
          {productosEnPresupuesto.length > 0 && (
            <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800">Total con Productos:</span>
                <span className="font-bold text-xl text-purple-600">{totalConProductos}€</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {productosEnPresupuesto.length} producto(s) adicional(es) incluido(s)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsPanel;
