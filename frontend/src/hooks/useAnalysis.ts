/**
 * useAnalysis Hook
 * 
 * React hook for managing AI analysis state and operations
 */

import { useState, useCallback } from 'react';
import { AnalysisResponse, GeoJSONPolygon } from '../types';
import { analyzeZone, coordinatesToGeoJSON } from '../services/ai-analysis';

interface UseAnalysisReturn {
  /** Whether analysis is currently in progress */
  isAnalyzing: boolean;
  
  /** Analysis result */
  result: AnalysisResponse | null;
  
  /** Error message if analysis failed */
  error: string | null;
  
  /** Analyze a polygon */
  analyze: (polygon: GeoJSONPolygon | [number, number][]) => Promise<AnalysisResponse | null>;
  
  /** Reset analysis state */
  reset: () => void;
}

/**
 * Hook for managing zone analysis with AI
 * 
 * @example
 * ```tsx
 * const { analyze, isAnalyzing, result, error, reset } = useAnalysis();
 * 
 * const handleDrawComplete = async (coords: [number, number][]) => {
 *   const analysis = await analyze(coords);
 *   if (analysis) {
 *     console.log('Green score:', analysis.green_score);
 *   }
 * };
 * ```
 */
export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze a zone
   */
  const analyze = useCallback(async (
    polygon: GeoJSONPolygon | [number, number][]
  ): Promise<AnalysisResponse | null> => {
    console.log('🔬 useAnalysis: Iniciando análisis...');
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Convert coordinates to GeoJSON if needed
      let geoJSONPolygon: GeoJSONPolygon;
      
      if (Array.isArray(polygon)) {
        console.log('📍 Convirtiendo coordenadas a GeoJSON...');
        geoJSONPolygon = coordinatesToGeoJSON(polygon);
      } else {
        geoJSONPolygon = polygon;
      }

      console.log('📡 Enviando solicitud de análisis...');
      const analysisResult = await analyzeZone(geoJSONPolygon);

      if (analysisResult.success) {
        console.log('✅ Análisis exitoso:', {
          greenScore: analysisResult.green_score,
          area: analysisResult.area_m2,
          species: analysisResult.especies_recomendadas.length,
          time: analysisResult.processing_time
        });
        
        setResult(analysisResult);
        return analysisResult;
      } else {
        const errorMsg = analysisResult.error || 'Analysis failed';
        console.error('❌ Análisis falló:', errorMsg);
        setError(errorMsg);
        return null;
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error en análisis:', errorMsg, err);
      setError(errorMsg);
      return null;
      
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Reset analysis state
   */
  const reset = useCallback(() => {
    console.log('🔄 Reseteando estado de análisis');
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    result,
    error,
    analyze,
    reset
  };
}
