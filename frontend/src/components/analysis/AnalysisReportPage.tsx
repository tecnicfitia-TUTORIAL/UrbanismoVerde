/**
 * AnalysisReportPage Component
 * 
 * Complete landing page for analysis results with satellite map and summary panel
 */

import React, { useState } from 'react';
import { X, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { AnalysisResponse, GeoJSONPolygon } from '../../types';
import { SatelliteMap } from './SatelliteMap';
import { ReportSummary } from './ReportSummary';
import { useAnalysisReport } from '../../hooks/useAnalysisReport';
import { Z_INDEX } from '../../constants/zIndex';

interface AnalysisReportPageProps {
  analysisResult: AnalysisResponse;
  polygon: GeoJSONPolygon;
  zoneName?: string;
  onClose: () => void;
  onSave?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-600';
  if (score >= 50) return 'bg-yellow-600';
  return 'bg-red-600';
}

export const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({
  analysisResult,
  polygon,
  zoneName = 'Zona Verde',
  onClose,
  onSave,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveZoneName, setSaveZoneName] = useState(zoneName);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    isSaving,
    isGeneratingPDF,
    error,
    saveToDatabase,
    downloadPDF,
  } = useAnalysisReport({
    analysisResult,
    polygon,
    zoneName,
  });

  const scoreColor = getScoreColor(analysisResult.green_score);

  const handleSave = async () => {
    if (onSave) {
      // Use parent's save handler if provided
      onSave();
    } else {
      // Show save dialog
      setShowSaveDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    const saved = await saveToDatabase(saveZoneName);
    if (saved) {
      setShowSaveDialog(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleDownloadPDF = async () => {
    await downloadPDF(`informe-${zoneName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className={`${scoreColor} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{zoneName}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>Área: {analysisResult.area_m2.toLocaleString('es-ES')} m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{new Date().toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="text-center bg-white bg-opacity-20 rounded-lg px-6 py-2">
                    <div className="text-3xl font-bold">
                      {analysisResult.green_score.toFixed(1)}
                    </div>
                    <div className="text-xs font-medium">Green Score</div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section - Left Side */}
        <div className="flex-1 bg-gray-100 relative">
          <SatelliteMap
            polygon={polygon}
            height="100%"
            showControls={true}
          />
        </div>

        {/* Summary Panel - Right Side */}
        <div className="w-full md:w-96 lg:w-[32rem] bg-white border-l border-gray-200 flex flex-col">
          <ReportSummary
            analysis={analysisResult}
            onSave={handleSave}
            onDownloadPDF={handleDownloadPDF}
            isSaving={isSaving}
            isGeneratingPDF={isGeneratingPDF}
          />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center gap-2">
            <X size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span>Análisis guardado exitosamente</span>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: Z_INDEX.SAVE_DIALOG_OVERLAY }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            style={{ zIndex: Z_INDEX.SAVE_DIALOG_CONTENT }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Guardar Análisis
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la zona
              </label>
              <input
                type="text"
                value={saveZoneName}
                onChange={(e) => setSaveZoneName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Azotea Edificio Central"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving || !saveZoneName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive: Stack vertically on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .flex-1.flex {
            flex-direction: column;
          }
          .w-full.md\\:w-96 {
            width: 100%;
            max-height: 50vh;
          }
        }
      `}</style>
    </div>
  );
};
