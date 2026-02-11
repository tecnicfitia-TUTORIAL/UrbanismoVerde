/**
 * useAnalysisReport Hook
 * 
 * Manages analysis report state and operations including save, PDF generation
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AnalysisResponse, GeoJSONPolygon, SavedAnalysis, SubZone } from '../types';
import { saveAnalysis, generateReport } from '../services/analysis-storage';
import { generateCompletePDF, downloadCompletePDF } from '../services/pdf-complete-generator';

interface UseAnalysisReportOptions {
  analysisResult: AnalysisResponse;
  polygon: GeoJSONPolygon;
  zoneName?: string;
}

interface UseAnalysisReportReturn {
  // State
  isSaving: boolean;
  isGeneratingPDF: boolean;
  savedAnalysisId: string | null;
  pdfUrl: string | null;
  error: string | null;
  subZones: SubZone[];

  // Actions
  saveToDatabase: (nombre?: string) => Promise<SavedAnalysis | null>;
  generatePDF: () => Promise<void>;
  downloadPDF: (filename?: string) => Promise<void>;
  updateSubZones: (zones: SubZone[]) => void;
  recalculateAnalysis: () => Promise<void>;
}

/**
 * Hook for managing analysis report operations
 */
export function useAnalysisReport(options: UseAnalysisReportOptions): UseAnalysisReportReturn {
  const { analysisResult, polygon, zoneName } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subZones, setSubZones] = useState<SubZone[]>([]);

  /**
   * Save analysis to database
   */
  const saveToDatabase = useCallback(async (nombre?: string): Promise<SavedAnalysis | null> => {
    console.log('💾 Guardando análisis en base de datos...');
    setIsSaving(true);
    setError(null);

    const toastId = toast.loading('Guardando análisis...');

    try {
      const savedData = await saveAnalysis(
        analysisResult,
        polygon,
        nombre || zoneName
      );

      setSavedAnalysisId(savedData.analisisId);
      console.log('✅ Análisis guardado exitosamente');
      
      toast.success('✅ Análisis guardado correctamente', { id: toastId });
      
      return savedData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error guardando análisis';
      console.error('❌ Error guardando análisis:', errorMsg);
      setError(errorMsg);
      
      toast.error(`❌ Error al guardar: ${errorMsg}`, { id: toastId });
      
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [analysisResult, polygon, zoneName]);

  /**
   * Generate PDF report
   */
  const generatePDF = useCallback(async (): Promise<void> => {
    console.log('📄 Generando PDF completo...');
    setIsGeneratingPDF(true);
    setError(null);

    const toastId = toast.loading('Generando PDF completo...');

    try {
      const blob = await generateCompletePDF({
        analysisResult,
        polygon,
        zoneName,
      });

      // Create temporary URL for preview
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Save report record to database if analysis is saved
      if (savedAnalysisId) {
        await generateReport(savedAnalysisId, 'pdf', undefined, url);
      }

      console.log('✅ PDF completo generado exitosamente');
      toast.success('✅ PDF completo generado correctamente', { id: toastId });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error generando PDF';
      console.error('❌ Error generando PDF:', errorMsg);
      setError(errorMsg);
      toast.error(`❌ Error al generar PDF: ${errorMsg}`, { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [analysisResult, polygon, zoneName, savedAnalysisId]);

  /**
   * Download PDF report
   */
  const downloadPDF = useCallback(async (filename?: string): Promise<void> => {
    console.log('📥 Descargando PDF completo...');
    setIsGeneratingPDF(true);
    setError(null);

    const toastId = toast.loading('Descargando PDF completo...');

    try {
      await downloadCompletePDF(
        {
          analysisResult,
          polygon,
          zoneName,
        },
        filename
      );

      console.log('✅ PDF completo descargado');
      toast.success('✅ PDF completo descargado correctamente', { id: toastId });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error descargando PDF';
      console.error('❌ Error descargando PDF:', errorMsg);
      setError(errorMsg);
      toast.error(`❌ Error al descargar PDF: ${errorMsg}`, { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [analysisResult, polygon, zoneName]);

  /**
   * Update sub-zones for satellite map
   */
  const updateSubZones = useCallback((zones: SubZone[]) => {
    console.log('🗺️ Actualizando sub-zonas:', zones.length);
    setSubZones(zones);
  }, []);

  /**
   * Recalculate analysis with updated sub-zones
   * This would trigger a new analysis with selected sub-zones
   */
  const recalculateAnalysis = useCallback(async (): Promise<void> => {
    console.log('🔄 Recalculando análisis con sub-zonas...');
    // TODO: Implement recalculation logic
    // This would need to call the analysis API again with selected sub-zones
    // When implemented, use subZones state to filter the polygon
    console.warn('⚠️ Recalculación no implementada aún');
  }, []); // No dependencies - will be implemented later with proper API call

  return {
    // State
    isSaving,
    isGeneratingPDF,
    savedAnalysisId,
    pdfUrl,
    error,
    subZones,

    // Actions
    saveToDatabase,
    generatePDF,
    downloadPDF,
    updateSubZones,
    recalculateAnalysis,
  };
}
