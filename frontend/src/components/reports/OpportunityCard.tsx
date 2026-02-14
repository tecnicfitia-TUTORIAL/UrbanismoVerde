/**
 * OpportunityCard Component
 * Displays a single green roof or reforestation opportunity
 */

import React from 'react';
import { MapPin, TrendingUp, DollarSign, Leaf, Star } from 'lucide-react';
import type { GreenRoofOpportunity, ReforestationOpportunity } from '../../types';

interface OpportunityCardProps {
  opportunity: GreenRoofOpportunity | ReforestationOpportunity;
  type: 'green_roof' | 'reforestation';
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, type }) => {
  // Convert viability score to stars (1-5)
  const stars = Math.round((opportunity.viability_score / 100) * 5);

  // Determine if it's a green roof or reforestation opportunity
  const isGreenRoof = type === 'green_roof';
  const specificOpportunity = opportunity as GreenRoofOpportunity;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={opportunity.image_url}
          alt={opportunity.address}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder on error
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Satellite+View';
          }}
        />
        {/* Viability badge */}
        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-md">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{opportunity.address}</h3>
            <p className="text-xs text-gray-500">
              {opportunity.coordinates[0].toFixed(5)}, {opportunity.coordinates[1].toFixed(5)}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Área</p>
            <p className="font-medium">{opportunity.area_m2} m²</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Viabilidad</p>
            <p className="font-medium">{opportunity.viability_score}%</p>
          </div>
          {isGreenRoof && (
            <>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="font-medium capitalize">{specificOpportunity.roof_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <p className="font-medium capitalize">{specificOpportunity.condition}</p>
              </div>
            </>
          )}
        </div>

        {/* Obstructions (for green roofs) */}
        {isGreenRoof && specificOpportunity.obstructions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Obstrucciones</p>
            <div className="flex flex-wrap gap-1">
              {specificOpportunity.obstructions.slice(0, 3).map((obs, i) => (
                <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  {obs}
                </span>
              ))}
              {specificOpportunity.obstructions.length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  +{specificOpportunity.obstructions.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Investment & Impact */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign size={16} />
              <span>Inversión</span>
            </div>
            <span className="font-semibold text-gray-900">
              {opportunity.estimated_cost_eur.toLocaleString('es-ES')} €
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Leaf size={16} />
              <span>CO₂/año</span>
            </div>
            <span className="font-semibold text-green-700">
              {isGreenRoof 
                ? (specificOpportunity as GreenRoofOpportunity).co2_savings_kg_year
                : (opportunity as ReforestationOpportunity).co2_capture_kg_year
              } kg
            </span>
          </div>
        </div>

        {/* AI Notes (collapsible) */}
        {opportunity.ai_notes && (
          <div className="mt-3 pt-3 border-t">
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                Notas IA
              </summary>
              <p className="mt-2 line-clamp-3">{opportunity.ai_notes}</p>
            </details>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors">
            Ver detalles
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
            <MapPin size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
