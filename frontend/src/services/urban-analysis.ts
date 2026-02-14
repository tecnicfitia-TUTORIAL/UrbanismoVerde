/**
 * Urban Analysis Service
 * Handles automatic area analysis for green roof opportunities
 */

import type { UrbanAnalysisReport, AreaBounds } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Analyze an urban area for green roof and reforestation opportunities
 */
export async function analyzeUrbanArea(bounds: AreaBounds): Promise<UrbanAnalysisReport> {
  try {
    console.log('🔍 Analyzing urban area:', bounds);
    
    const response = await fetch(`${API_BASE_URL}/api/analysis/analyze-area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bounds),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analysis failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }
    
    console.log('✅ Analysis completed:', data.report);
    return data.report;
    
  } catch (error) {
    console.error('❌ Error analyzing area:', error);
    throw error;
  }
}

/**
 * Test if the analysis service is available
 */
export async function testAnalysisService(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/test`);
    const data = await response.json();
    return data.status === 'ok' || data.status === 'warning';
  } catch (error) {
    console.error('❌ Analysis service unavailable:', error);
    return false;
  }
}
