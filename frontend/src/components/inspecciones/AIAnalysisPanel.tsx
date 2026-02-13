import React from 'react';
import { Bot, AlertCircle, Edit2 } from 'lucide-react';
import { AIAnalysisResult } from '../../services/inspeccion-service';

interface AIAnalysisPanelProps {
  results: AIAnalysisResult[];
  onEdit: (index: number) => void;
  onSave: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ results, onEdit, onSave }) => {
  if (results.length === 0) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return '✓';
    if (confidence >= 60) return '⚠';
    return '!';
  };

  return (
    <div className="p-6 space-y-4 bg-gray-50 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bot className="text-blue-600" size={24} />
          Resultados del Análisis IA
        </h2>
        <span className="text-sm text-gray-600">
          {results.length} tejado{results.length !== 1 ? 's' : ''} analizado{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {results.map((result, idx) => (
        <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Tejado {idx + 1}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(result.confianza)}`}>
              {getConfidenceIcon(result.confianza)} Confianza: {result.confianza}%
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 font-medium">Tipo:</span>
              <span className="font-semibold text-gray-900 capitalize">
                {result.tipo_cubierta}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 font-medium">Estado:</span>
              <span className="font-semibold text-gray-900 capitalize">
                {result.estado_conservacion.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600 font-medium">Inclinación:</span>
              <span className="font-semibold text-gray-900">
                {result.inclinacion_estimada}°
              </span>
            </div>
            
            {result.obstrucciones && result.obstrucciones.length > 0 && (
              <div className="py-2 border-b">
                <span className="text-gray-600 font-medium block mb-2">Obstrucciones:</span>
                <ul className="ml-4 space-y-1">
                  {result.obstrucciones.map((obs, i) => (
                    <li key={i} className="text-xs text-gray-700">
                      • {obs.descripcion || obs.tipo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.notas_ia && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Bot size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">{result.notas_ia}</p>
                </div>
              </div>
            )}
            
            {result.error && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-900">{result.error}</p>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => onEdit(idx)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <Edit2 size={14} />
            Editar manualmente
          </button>
        </div>
      ))}
      
      <button
        onClick={onSave}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        💾 Guardar {results.length} Inspección{results.length !== 1 ? 'es' : ''}
      </button>
    </div>
  );
};

export default AIAnalysisPanel;
