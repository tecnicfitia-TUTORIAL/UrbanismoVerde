import React from 'react';
import { CheckCircle, Trash2, Bot, Save } from 'lucide-react';

interface MultiSelectionToolbarProps {
  count: number;
  onClear: () => void;
  onAnalyze: () => void;
  onSave: () => void;
  isAnalyzing: boolean;
  hasResults: boolean;
}

const MultiSelectionToolbar: React.FC<MultiSelectionToolbarProps> = ({
  count,
  onClear,
  onAnalyze,
  onSave,
  isAnalyzing,
  hasResults
}) => {
  if (count === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 z-50 border-2 border-green-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" size={24} />
          <span className="font-semibold text-lg">
            {count} tejado{count !== 1 ? 's' : ''} seleccionado{count !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="h-6 w-px bg-gray-300" />
        
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
          title="Limpiar selección"
        >
          <Trash2 size={16} />
          Limpiar
        </button>
        
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || count === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Analizando...
            </>
          ) : (
            <>
              <Bot size={18} />
              Analizar con IA
            </>
          )}
        </button>
        
        <button
          onClick={onSave}
          disabled={!hasResults}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
        >
          <Save size={18} />
          Guardar Todos
        </button>
      </div>
    </div>
  );
};

export default MultiSelectionToolbar;
