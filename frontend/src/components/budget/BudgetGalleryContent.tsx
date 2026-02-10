import React from 'react';
import { Euro, MapPin, Calendar, Eye, FileDown, Copy, Trash2 } from 'lucide-react';
import { Area } from '../../types';
import EmptyState from '../common/EmptyState';
import { coloresPorTipo } from '../../types';

interface BudgetGalleryContentProps {
  areas: Area[];
  onNavigate: (view: string, data?: any) => void;
}

const BudgetGalleryContent: React.FC<BudgetGalleryContentProps> = ({
  areas,
  onNavigate
}) => {
  // En una implementación real, esto vendría de un estado o API
  const budgets = areas.map(area => ({
    id: `budget-${area.id}`,
    areaId: area.id,
    areaNombre: area.nombre,
    areaTipo: area.tipo,
    areaM2: area.areaM2,
    costeTotal: Math.round(area.areaM2 * 85 + Math.random() * 200), // Simulado
    fechaCreacion: area.fechaCreacion,
    estado: 'finalizado' as const
  }));

  if (budgets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <EmptyState
          icon={<Euro size={64} />}
          title="No hay presupuestos creados"
          description="Crea tu primer presupuesto seleccionando una zona y calculando los materiales necesarios"
          primaryAction={{
            label: 'Ver zonas disponibles',
            onClick: () => onNavigate('zonas-gallery')
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
            Presupuestos
          </h1>
          <p className="text-gray-600">
            Gestiona los presupuestos de tus zonas verdes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Presupuestos</p>
                <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
              </div>
              <Euro size={32} className="text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Coste Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {budgets.reduce((sum, b) => sum + b.costeTotal, 0).toLocaleString()}€
                </p>
              </div>
              <div className="text-purple-100 text-4xl">💰</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Coste Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(budgets.reduce((sum, b) => sum + b.costeTotal, 0) / budgets.length).toLocaleString()}€
                </p>
              </div>
              <div className="text-gray-300 text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Budgets List */}
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Left: Zone Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {budget.areaNombre}
                    </h3>
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: coloresPorTipo[budget.areaTipo] + '20',
                        color: coloresPorTipo[budget.areaTipo]
                      }}
                    >
                      {budget.areaTipo.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      {budget.estado}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      <span>{budget.areaM2.toFixed(2)} m²</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>
                        {new Date(budget.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Cost and Actions */}
                <div className="text-right ml-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Coste Total</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {budget.costeTotal.toLocaleString()}€
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('presupuestos-detail', budget)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1"
                      title="Ver detalle"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                    <button
                      onClick={() => alert('Exportar PDF próximamente')}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      title="Exportar PDF"
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      onClick={() => alert('Duplicar presupuesto próximamente')}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      title="Duplicar"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Eliminar este presupuesto?')) {
                          alert('Eliminar próximamente');
                        }
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Budget Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('zonas-gallery')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Crear nuevo presupuesto
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetGalleryContent;
