/**
 * PDF Generator Service
 * 
 * Generates PDF reports for analysis results using jsPDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResponse, GeoJSONPolygon } from '../types';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export interface PDFReportOptions {
  analysisResult: AnalysisResponse;
  polygon: GeoJSONPolygon;
  zoneName?: string;
  mapImageUrl?: string;
}

/**
 * Generate PDF report from analysis data
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<Blob> {
  const { analysisResult, zoneName = 'Zona Verde', mapImageUrl } = options;
  
  console.log('📄 Generando PDF...');
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Colors
  const primaryColor = '#10b981'; // Green
  const secondaryColor = '#3b82f6'; // Blue
  const textColor = '#1f2937';
  const lightGray = '#f3f4f6';

  // Helper function to add new page if needed
  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header - Title
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE VIABILIDAD', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(zoneName, pageWidth / 2, 32, { align: 'center' });

  yPos = 50;

  // Date and basic info
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, yPos);
  yPos += 10;

  // 1. RESUMEN EJECUTIVO
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('1. RESUMEN EJECUTIVO', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  // Green Score with colored box
  const scoreColor = getScoreColor(analysisResult.green_score);
  doc.setFillColor(scoreColor);
  doc.roundedRect(margin, yPos, 60, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Green Score: ${analysisResult.green_score.toFixed(1)}`, margin + 30, yPos + 8, { align: 'center' });
  
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'normal');
  yPos += 16;

  // Stats
  const stats = [
    `• Área: ${analysisResult.area_m2.toLocaleString('es-ES')} m²`,
    `• Perímetro: ${analysisResult.perimetro_m.toFixed(1)} m`,
    `• Viabilidad: ${getViabilidad(analysisResult.green_score)}`,
    `• Especies recomendadas: ${analysisResult.especies_recomendadas.length}`,
  ];

  stats.forEach(stat => {
    doc.text(stat, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // 2. CARACTERÍSTICAS DE LA ZONA
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('2. CARACTERÍSTICAS DE LA ZONA', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  if (analysisResult.tags && analysisResult.tags.length > 0) {
    analysisResult.tags.forEach(tag => {
      checkPageBreak(8);
      doc.text(`• ${tag}`, margin + 5, yPos);
      yPos += 6;
    });
  }

  yPos += 5;

  // 3. ESPECIES RECOMENDADAS
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('3. ESPECIES RECOMENDADAS', margin, yPos);
  yPos += 10;

  // Species table
  const speciesData = analysisResult.especies_recomendadas.map(especie => [
    especie.nombre_comun,
    especie.nombre_cientifico,
    especie.tipo,
    `${(especie.viabilidad * 100).toFixed(0)}%`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Nombre Común', 'Nombre Científico', 'Tipo', 'Viabilidad']],
    body: speciesData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      3: { halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // 4. COSTOS Y BENEFICIOS
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('4. COSTOS Y BENEFICIOS', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  const costePorM2 = 150;
  const inversionInicial = analysisResult.area_m2 * costePorM2;
  const ahorroAnual = analysisResult.area_m2 * 7.95; // Estimated annual savings
  const roi = (ahorroAnual / inversionInicial) * 100;
  const amortizacion = inversionInicial / ahorroAnual;

  const costos = [
    `• Inversión inicial: €${inversionInicial.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
    `• Costo por m²: €${costePorM2}`,
    `• Ahorro anual estimado: €${ahorroAnual.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
    `• ROI: ${roi.toFixed(1)}%`,
    `• Amortización: ${amortizacion.toFixed(1)} años`,
    `• Subvenciones disponibles: 30-50% del costo`,
  ];

  costos.forEach(costo => {
    checkPageBreak(8);
    doc.text(costo, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // 5. BENEFICIOS AMBIENTALES
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('5. BENEFICIOS AMBIENTALES', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  const co2Absorption = analysisResult.area_m2 * 0.5;
  const o2Production = analysisResult.area_m2 * 0.8;

  const beneficios = [
    `• Absorción de CO₂: ${co2Absorption.toFixed(0)} kg/año`,
    `• Producción de O₂: ${o2Production.toFixed(0)} kg/año`,
    `• Reducción temperatura: 2-5°C`,
    `• Mejora calidad del aire`,
    `• Incremento biodiversidad urbana`,
    `• Reducción escorrentía pluvial`,
  ];

  beneficios.forEach(beneficio => {
    checkPageBreak(8);
    doc.text(beneficio, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // 6. RECOMENDACIONES TÉCNICAS
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('6. RECOMENDACIONES TÉCNICAS', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  analysisResult.recomendaciones.forEach((rec, index) => {
    checkPageBreak(10);
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, contentWidth - 10);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 2;
  });

  // 7. NORMATIVA APLICABLE
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('7. NORMATIVA APLICABLE', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);

  const normativas = [
    '• Plan Estratégico de Cubiertas Verdes Madrid 2025',
    '• Estrategia Nacional de Infraestructura Verde (MITECO 2024)',
    '• Código Técnico de la Edificación (CTE DB-HS)',
    '• Ordenanzas municipales de sostenibilidad',
  ];

  normativas.forEach(norm => {
    checkPageBreak(8);
    doc.text(norm, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'EcoUrbe AI - Plataforma Inteligente de Regeneración Urbana',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  console.log('✅ PDF generado exitosamente');
  
  return doc.output('blob');
}

/**
 * Download PDF report
 */
export async function downloadPDFReport(options: PDFReportOptions, filename?: string): Promise<void> {
  const blob = await generatePDFReport(options);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `informe-${new Date().getTime()}.pdf`;
  link.click();
  
  URL.revokeObjectURL(url);
  
  console.log('✅ PDF descargado');
}

// Helper functions

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981'; // Green
  if (score >= 50) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
}

function getViabilidad(score: number): string {
  if (score >= 70) return 'Alta';
  if (score >= 50) return 'Media';
  if (score >= 30) return 'Baja';
  return 'Nula';
}
