/**
 * useAnalysis Hook
 * 
 * React hook for managing AI analysis state and operations
 * Includes robust validation, error handling, and user feedback
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
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
 * Validate API response structure
 */
function validateAnalysisResponse(data: any): data is AnalysisResponse {
  console.log('🔍 Validando respuesta del análisis:', data);
  
  if (!data || typeof data !== 'object') {
    console.error('❌ Respuesta no es un objeto válido');
    return false;
  }

  // Check required fields
  const requiredFields = ['success', 'green_score', 'area_m2', 'perimetro_m'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`❌ Campo requerido faltante: ${field}`);
      return false;
    }
  }

  // Validate field types
  if (typeof data.success !== 'boolean') {
    console.error('❌ Campo "success" debe ser boolean');
    return false;
  }

  if (typeof data.green_score !== 'number' || data.green_score < 0 || data.green_score > 100) {
    console.error('❌ Campo "green_score" debe ser un número entre 0 y 100');
    return false;
  }

  if (typeof data.area_m2 !== 'number' || data.area_m2 < 0) {
    console.error('❌ Campo "area_m2" debe ser un número positivo');
    return false;
  }

  if (typeof data.perimetro_m !== 'number' || data.perimetro_m < 0) {
    console.error('❌ Campo "perimetro_m" debe ser un número positivo');
    return false;
  }

  // Validate array fields (optional but must be arrays if present)
  if (data.tags && !Array.isArray(data.tags)) {
    console.error('❌ Campo "tags" debe ser un array');
    return false;
  }

  if (data.especies_recomendadas && !Array.isArray(data.especies_recomendadas)) {
    console.error('❌ Campo "especies_recomendadas" debe ser un array');
    return false;
  }

  if (data.recomendaciones && !Array.isArray(data.recomendaciones)) {
    console.error('❌ Campo "recomendaciones" debe ser un array');
    return false;
  }

  console.log('✅ Respuesta validada correctamente');
  return true;
}

/**
 * Create fallback analysis result
 */
function createFallbackResult(area_m2: number = 0, errorMessage?: string): AnalysisResponse {
  console.log('⚠️ Creando resultado fallback con área:', area_m2, 'error:', errorMessage || 'unknown');
  return {
    success: false,
    green_score: 0,
    area_m2,
    perimetro_m: 0,
    tags: ['Error en análisis', 'Requiere reanálisis'],
    especies_recomendadas: [],
    recomendaciones: ['Por favor, intente el análisis nuevamente'],
    processing_time: 0,
    error: errorMessage || 'Failed to analyze area'
  };
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

    // Show loading toast (note: loading toasts persist until dismissed)
    const loadingToastId = toast.loading('🔬 Analizando zona con IA...', {
      icon: '🔬',
    });

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

      // Validate API response
      if (!validateAnalysisResponse(analysisResult)) {
        const errorMsg = 'Respuesta del servidor no válida';
        console.error('❌ Validación fallo');
        setError(errorMsg);
        
        // Dismiss loading toast and show error
        toast.error('Error en análisis: Respuesta inválida del servidor', {
          id: loadingToastId,
          duration: 5000,
          icon: '⚠️',
        });
        
        // Return fallback result
        const fallback = createFallbackResult(analysisResult?.area_m2 || 0, errorMsg);
        setResult(fallback);
        return fallback;
      }

      if (analysisResult.success) {
        console.log('✅ Análisis exitoso:', {
          greenScore: analysisResult.green_score,
          area: analysisResult.area_m2,
          species: analysisResult.especies_recomendadas?.length || 0,
          time: analysisResult.processing_time
        });
        
        // Dismiss loading toast and show success
        toast.success(
          `Análisis completado: Green Score ${analysisResult.green_score.toFixed(1)}/100`,
          {
            id: loadingToastId,
            duration: 4000,
            icon: '✅',
          }
        );
        
        setResult(analysisResult);
        return analysisResult;
      } else {
        const errorMsg = analysisResult.error || 'Análisis fallo sin mensaje de error';
        console.error('❌ Análisis fallo:', errorMsg);
        setError(errorMsg);
        
        // Dismiss loading toast and show error
        toast.error(`Error en análisis: ${errorMsg}`, {
          id: loadingToastId,
          duration: 5000,
          icon: '❌',
        });
        
        // Return fallback result
        const fallback = createFallbackResult(analysisResult.area_m2, errorMsg);
        setResult(fallback);
        return fallback;
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Excepción en análisis:', errorMsg, err);
      setError(errorMsg);
      
      // Dismiss loading toast and show error with user-friendly message
      toast.error(
        'No se pudo conectar con el servicio de análisis. Por favor, verifique su conexión.',
        {
          id: loadingToastId,
          duration: 6000,
          icon: '🔌',
        }
      );
      
      // Return fallback result
      const fallback = createFallbackResult(0, errorMsg);
      setResult(fallback);
      return fallback;
      
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
