import React from 'react';
import { MapMode } from './MapModeControl';
import { HelpCircle, X } from 'lucide-react';

interface HelpPanelProps {
  mode: MapMode;
  onClose?: () => void;
  className?: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ mode, onClose, className = '' }) => {
  const helpContent = {
    idle: {
      title: "Bienvenido al Mapa Interactivo",
      icon: "🗺️",
      steps: [
        "Selecciona un modo en el panel superior derecho",
        "Modo Dibujar: Crea nuevas zonas verdes",
        "Modo Analizar: Obtén análisis con IA de cualquier ubicación",
        "Modo Galería: Explora las zonas guardadas"
      ],
      tip: "Usa el buscador para encontrar direcciones específicas"
    },
    draw: {
      title: "Modo Dibujo",
      icon: "✏️",
      steps: [
        "Haz clic en el mapa para añadir puntos al polígono",
        "Añade al menos 3 puntos para formar una zona",
        "Usa Ctrl+Z o Backspace para deshacer el último punto",
        "Presiona Enter o haz clic en 'Completar' para terminar",
        "Completa el formulario para guardar la zona"
      ],
      tip: "Presiona Escape para cancelar el dibujo en cualquier momento"
    },
    analyze: {
      title: "Modo Análisis",
      icon: "🔍",
      steps: [
        "Busca una dirección o navega por el mapa",
        "Haz clic en cualquier ubicación del mapa",
        "El sistema analizará automáticamente el área con IA",
        "Revisa los resultados y recomendaciones",
        "Opcionalmente, guarda el análisis como zona verde"
      ],
      tip: "El análisis incluye vegetación, superficie y recomendaciones"
    },
    gallery: {
      title: "Galería de Zonas",
      icon: "📋",
      steps: [
        "Navega por el mapa para ver todas las zonas guardadas",
        "Haz clic en cualquier zona para ver sus detalles",
        "Usa el modo multi-selección para crear conjuntos",
        "Exporta datos de zonas para informes"
      ],
      tip: "Las zonas se colorean según su tipo (parque, jardín, etc.)"
    }
  };

  const content = helpContent[mode];

  if (!content) return null;

  return (
    <div className={`absolute bottom-20 left-6 z-[1000] bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm animate-fade-in ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{content.icon}</span>
            <h3 className="font-bold text-gray-800">{content.title}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Cerrar ayuda"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-3">
          {content.steps.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
        
        {content.tip && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <HelpCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Consejo:</strong> {content.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
