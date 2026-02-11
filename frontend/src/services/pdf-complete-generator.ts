/**
 * Complete PDF Generator Service
 * 
 * Generates comprehensive PDF reports with ALL analysis data including:
 * - Resumen General
 * - Beneficios Ecosistémicos
 * - Presupuesto Detallado
 * - ROI (Retorno de Inversión)
 * - Subvenciones
 * - Especies Recomendadas
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResponse, GeoJSONPolygon } from '../types';
import { adaptAnalysisData } from './analysis-adapter';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export interface CompletePDFOptions {
  analysisResult: AnalysisResponse;
  polygon: GeoJSONPolygon;
  zoneName?: string;
}

/**
 * Generate complete PDF report with all 6 sections
 */
export async function generateCompletePDF(options: CompletePDFOptions): Promise<Blob> {
  const { analysisResult, zoneName = 'Zona Verde' } = options;
  
  console.log('📄 Generando PDF completo con todos los datos...');
  
  // Adapt analysis data for compatibility
  const adaptedAnalysis = adaptAnalysisData(analysisResult as any);
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors
  const primaryGreen = [16, 185, 129]; // #10b981
  const secondaryBlue = [59, 130, 246]; // #3b82f6
  const textColor = [31, 41, 55]; // #1f2937

  // Helper function to add new page if needed
  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      addFooter();
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add footer on current page
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'EcoUrbe AI - Plataforma Inteligente de Regeneración Urbana',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Página ${(doc as any).internal.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  // =====================
  // HEADER
  // =====================
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE VIABILIDAD COMPLETO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(zoneName, pageWidth / 2, 32, { align: 'center' });

  yPos = 50;

  // Date
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, yPos);
  yPos += 15;

  // =====================
  // 1. RESUMEN GENERAL
  // =====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('1. RESUMEN GENERAL', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  // Green Score with colored box
  const scoreColor = getScoreColorRGB(adaptedAnalysis.green_score);
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin, yPos, 60, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Green Score: ${adaptedAnalysis.green_score.toFixed(1)}`, margin + 30, yPos + 8, { align: 'center' });
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  yPos += 16;

  const resumenData = [
    ['Área', `${adaptedAnalysis.area_m2.toLocaleString('es-ES')} m²`],
    ['Perímetro', `${adaptedAnalysis.perimetro_m.toFixed(1)} m`],
    ['Factor Verde', adaptedAnalysis.normativa?.factor_verde.toFixed(2) || 'N/A'],
    ['Viabilidad', getViabilidad(adaptedAnalysis.green_score)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Parámetro', 'Valor']],
    body: resumenData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // =====================
  // 2. BENEFICIOS ECOSISTÉMICOS
  // =====================
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('2. BENEFICIOS ECOSISTÉMICOS', margin, yPos);
  yPos += 8;

  const beneficios = adaptedAnalysis.beneficios_ecosistemicos || {
    co2_capturado_kg_anual: 0,
    agua_retenida_litros_anual: 0,
    reduccion_temperatura_c: 0,
    ahorro_energia_kwh_anual: 0,
    ahorro_energia_eur_anual: 0
  };

  const beneficiosData = [
    ['CO₂ Capturado Anual', `${beneficios.co2_capturado_kg_anual.toLocaleString('es-ES')} kg/año`],
    ['Agua Retenida Anual', `${beneficios.agua_retenida_litros_anual.toLocaleString('es-ES')} L/año`],
    ['Reducción de Temperatura', `${beneficios.reduccion_temperatura_c.toFixed(1)}°C`],
    ['Ahorro Energético Anual', `${beneficios.ahorro_energia_kwh_anual.toLocaleString('es-ES')} kWh`],
    ['Ahorro Económico Anual', `€${beneficios.ahorro_energia_eur_anual.toLocaleString('es-ES')}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Beneficio', 'Valor']],
    body: beneficiosData,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94], // green-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // =====================
  // 3. PRESUPUESTO DETALLADO
  // =====================
  checkPageBreak(80);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('3. PRESUPUESTO DETALLADO', margin, yPos);
  yPos += 8;

  const presupuesto = adaptedAnalysis.presupuesto || {
    coste_total_inicial_eur: 0,
    desglose: {
      sustrato_eur: 0,
      drenaje_eur: 0,
      membrana_impermeable_eur: 0,
      plantas_eur: 0,
      instalacion_eur: 0
    },
    mantenimiento_anual_eur: 0,
    coste_por_m2_eur: 0,
    vida_util_anos: 0
  };

  const presupuestoData = [
    ['INVERSIÓN INICIAL', `€${presupuesto.coste_total_inicial_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['  • Sustrato', `€${presupuesto.desglose.sustrato_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['  • Drenaje', `€${presupuesto.desglose.drenaje_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['  • Membrana Impermeable', `€${presupuesto.desglose.membrana_impermeable_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['  • Plantas', `€${presupuesto.desglose.plantas_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['  • Instalación', `€${presupuesto.desglose.instalacion_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['Mantenimiento Anual', `€${presupuesto.mantenimiento_anual_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['Coste por m²', `€${presupuesto.coste_por_m2_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}/m²`],
    ['Vida Útil', `${presupuesto.vida_util_anos} años`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Importe']],
    body: presupuestoData,
    theme: 'grid',
    headStyles: {
      fillColor: secondaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      1: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // =====================
  // 4. ROI (RETORNO DE INVERSIÓN)
  // =====================
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('4. ROI (RETORNO DE INVERSIÓN)', margin, yPos);
  yPos += 8;

  const roi_data = adaptedAnalysis.roi_ambiental || {
    roi_porcentaje: 0,
    amortizacion_anos: 0,
    ahorro_anual_eur: 0,
    ahorro_25_anos_eur: 0
  };

  const roiData = [
    ['Ahorro Anual', `€${roi_data.ahorro_anual_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ['ROI Porcentaje', `${roi_data.roi_porcentaje.toFixed(2)}%`],
    ['Período de Amortización', `${roi_data.amortizacion_anos.toFixed(1)} años`],
    ['Ahorro Total a 25 años', `€${roi_data.ahorro_25_anos_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Valor']],
    body: roiData,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94], // green-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      1: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // =====================
  // 5. SUBVENCIONES
  // =====================
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('5. SUBVENCIONES DISPONIBLES', margin, yPos);
  yPos += 8;

  const subvencion = adaptedAnalysis.subvencion || {
    elegible: false,
    porcentaje: 0,
    programa: 'N/A',
    monto_estimado_eur: 0
  };

  if (subvencion.elegible) {
    const costeNeto = presupuesto.coste_total_inicial_eur - subvencion.monto_estimado_eur;
    const subvencionData = [
      ['Programa', subvencion.programa],
      ['Porcentaje de Subvención', `${subvencion.porcentaje}%`],
      ['Monto Estimado', `€${subvencion.monto_estimado_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
      ['Coste Neto (con subvención)', `€${costeNeto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Valor']],
      body: subvencionData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234], // purple-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No hay subvenciones disponibles para este proyecto', margin + 5, yPos);
    yPos += 12;
  }

  // =====================
  // 6. ESPECIES RECOMENDADAS
  // =====================
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryGreen);
  doc.text('6. ESPECIES RECOMENDADAS', margin, yPos);
  yPos += 8;

  const especies = adaptedAnalysis.especies_recomendadas || [];
  
  if (especies.length > 0) {
    const especiesData = especies.map(especie => [
      especie.nombre_comun || 'N/A',
      especie.nombre_cientifico || 'N/A',
      especie.tipo || 'N/A',
      `${((especie.viabilidad || 0) * 100).toFixed(0)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nombre Común', 'Nombre Científico', 'Tipo', 'Viabilidad']],
      body: especiesData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryGreen,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        3: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('No hay especies recomendadas disponibles', margin + 5, yPos);
    yPos += 12;
  }

  // =====================
  // RECOMENDACIONES TÉCNICAS
  // =====================
  const recomendaciones = adaptedAnalysis.recomendaciones || [];
  if (recomendaciones.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryGreen);
    doc.text('RECOMENDACIONES TÉCNICAS', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);

    recomendaciones.forEach((rec, index) => {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 2 * margin - 10);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 2;
    });
  }

  // Add footer on last page
  addFooter();

  console.log('✅ PDF completo generado exitosamente');
  
  return doc.output('blob');
}

/**
 * Download complete PDF report
 */
export async function downloadCompletePDF(options: CompletePDFOptions, filename?: string): Promise<void> {
  const blob = await generateCompletePDF(options);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `informe-completo-${new Date().getTime()}.pdf`;
  link.click();
  
  URL.revokeObjectURL(url);
  
  console.log('✅ PDF completo descargado');
}

// Helper functions

function getScoreColorRGB(score: number): [number, number, number] {
  if (score >= 70) return [16, 185, 129]; // Green
  if (score >= 50) return [245, 158, 11]; // Orange
  return [239, 68, 68]; // Red
}

function getViabilidad(score: number): string {
  if (score >= 70) return 'Alta';
  if (score >= 50) return 'Media';
  if (score >= 30) return 'Baja';
  return 'Nula';
}
