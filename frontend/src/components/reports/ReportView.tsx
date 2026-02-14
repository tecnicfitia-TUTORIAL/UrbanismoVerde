/**
 * ReportView Component
 * Full-screen modal displaying the urban analysis report
 */

import React from 'react';
import { X, Download, Save, Mail, TrendingUp, MapPin, Leaf, DollarSign } from 'lucide-react';
import type { UrbanAnalysisReport } from '../../types';
import OpportunityCard from './OpportunityCard';

interface ReportViewProps {
  report: UrbanAnalysisReport;
  onClose: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, onClose }) => {
  const { summary, green_roofs, reforestation } = report;

  const handleDownloadPDF = () => {
    console.log('📄 Downloading PDF...');
    // TODO: Implement PDF generation
    alert('Función de descarga PDF en desarrollo');
  };

  const handleSave = () => {
    console.log('💾 Saving report...');
    // TODO: Implement save to Supabase
    alert('Función de guardado en desarrollo');
  };

  const handleSendEmail = () => {
    console.log('📧 Sending email...');
    // TODO: Implement email sending
    alert('Función de envío por email en desarrollo');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📊 Informe de Análisis Urbano</h2>
            <p className="text-green-100 text-sm mt-1">
              {report.area_name} • {new Date(report.analysis_date).toLocaleDateString('es-ES')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Executive Summary */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen Ejecutivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Opportunities */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Oportunidades</p>
                    <p className="text-2xl font-bold text-blue-900">{summary.total_opportunities}</p>
                  </div>
                </div>
              </div>

              {/* Total Investment */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Inversión Total</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(summary.total_investment_eur / 1000).toFixed(0)}k €
                    </p>
                  </div>
                </div>
              </div>

              {/* CO₂ Impact */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <Leaf size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">CO₂/año</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(summary.total_co2_impact_kg_year / 1000).toFixed(1)}t
                    </p>
                  </div>
                </div>
              </div>

              {/* Green Area */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600 rounded-lg">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Área Verde</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {summary.total_green_area_m2} m²
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Priorities */}
            {summary.top_priorities.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">🎯 Prioridades Principales:</h4>
                <ul className="space-y-1">
                  {summary.top_priorities.map((priority, i) => (
                    <li key={i} className="text-amber-800 flex items-start gap-2">
                      <span>•</span>
                      <span>{priority}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Green Roofs Section */}
          {green_roofs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🏢 Tejados Verdes ({green_roofs.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {green_roofs.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    type="green_roof"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reforestation Section */}
          {reforestation.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🌳 Reforestación ({reforestation.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reforestation.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    type="reforestation"
                  />
                ))}
              </div>
            </div>
          )}

          {/* No opportunities found */}
          {green_roofs.length === 0 && reforestation.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron oportunidades
              </h3>
              <p className="text-gray-600">
                Intenta seleccionar un área diferente o más grande
              </p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {summary.total_opportunities} oportunidades encontradas
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={18} />
              <span>Guardar</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail size={18} />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
