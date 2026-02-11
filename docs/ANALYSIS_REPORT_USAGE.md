# 🎯 Guía de Uso - Sistema de Informes de Análisis

## Introducción

Esta guía explica cómo usar el nuevo sistema de informes completo con visualización satelital y exportación a PDF.

## Prerequisitos

1. **Configurar Variables de Entorno**

Crear archivo `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```

Editar con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

2. **Instalar Dependencias**

```bash
cd frontend
npm install
```

3. **Ejecutar Migración de Base de Datos**

En Supabase SQL Editor, ejecutar:
```sql
-- Archivo: supabase/migrations/003_create_informes_table.sql
```

## Uso Paso a Paso

### 1️⃣ Dibujar una Zona

1. Abrir aplicación: `npm run dev`
2. Click en **"Dibujar Zonas"** o botón verde en sidebar
3. Click en el mapa para añadir puntos (mínimo 3)
4. Click en **"Completar"** cuando termines

![Drawing Mode](https://github.com/user-attachments/assets/19ed825f-695f-42fb-b430-8db8ed25b9ce)

### 2️⃣ Análisis Automático

El sistema automáticamente:
- Envía polígono a `/api/analyze`
- Procesa con IA (10 segundos)
- Muestra pantalla de carga

### 3️⃣ Ver Informe Completo

Se abre **AnalysisReportPage** con:

**Lado Izquierdo - Mapa Satelital**:
- Vista ESRI Satellite
- Zona analizada resaltada en azul
- Controles de zoom
- Leyenda

**Lado Derecho - Panel de Resumen**:
- 📊 Resumen Ejecutivo (Green Score, área, viabilidad)
- 🌿 Especies Recomendadas (top 5)
- 💰 Costos y Beneficios (inversión, ahorro, ROI)
- ⚠️ Recomendaciones Técnicas
- 🏷️ Características de la zona

### 4️⃣ Guardar Análisis

Click en **"Guardar Análisis"**:
1. Se abre diálogo para nombre de zona
2. Ingresa nombre (ej: "Azotea Edificio Central")
3. Click "Guardar"
4. Se guarda en:
   - Tabla `zonas_verdes`
   - Tabla `analisis`
5. Retorna IDs para referencia

### 5️⃣ Descargar PDF

Click en **"Descargar PDF"**:
1. Sistema genera PDF con jsPDF
2. Incluye todas las secciones del informe
3. Descarga automáticamente
4. Guarda registro en tabla `informes`

Nombre del archivo: `informe-zona-verde-{timestamp}.pdf`

## Contenido del PDF

El PDF generado incluye:

### Portada
- Título: "INFORME DE VIABILIDAD"
- Nombre de la zona
- Fecha de generación
- Green Score destacado

### Secciones

1. **Resumen Ejecutivo**
   - Green Score con color
   - Área, perímetro, viabilidad
   - Especies recomendadas (cantidad)

2. **Características de la Zona**
   - Tags detectados
   - Condiciones del terreno

3. **Especies Recomendadas**
   - Tabla con nombre común, científico, tipo, viabilidad
   - Ordenadas por viabilidad

4. **Costos y Beneficios**
   - Inversión inicial
   - Costo por m²
   - Ahorro anual estimado
   - ROI y amortización
   - Subvenciones disponibles

5. **Beneficios Ambientales**
   - Absorción de CO₂
   - Producción de O₂
   - Reducción de temperatura
   - Mejora calidad del aire

6. **Recomendaciones Técnicas**
   - Lista numerada de pasos
   - Consideraciones especiales

7. **Normativa Aplicable**
   - PECV Madrid 2025
   - MITECO 2024
   - Código Técnico de la Edificación

## Componentes Clave

### AnalysisReportPage
```typescript
<AnalysisReportPage
  analysisResult={analysisResult}
  polygon={geoJSONPolygon}
  zoneName="Mi Zona Verde"
  onClose={() => setShowReport(false)}
  onSave={() => handleSave()}
/>
```

### SatelliteMap
```typescript
<SatelliteMap
  polygon={geoJSONPolygon}
  height="500px"
  showControls={true}
/>
```

### ReportSummary
```typescript
<ReportSummary
  analysis={analysisResult}
  onSave={() => save()}
  onDownloadPDF={() => downloadPDF()}
  isSaving={false}
  isGeneratingPDF={false}
/>
```

### useAnalysisReport Hook
```typescript
const {
  isSaving,
  isGeneratingPDF,
  savedAnalysisId,
  error,
  saveToDatabase,
  downloadPDF,
} = useAnalysisReport({
  analysisResult,
  polygon,
  zoneName,
});
```

## API de Servicios

### analysis-storage.ts

**Guardar análisis completo**:
```typescript
const saved = await saveAnalysis(
  analysisResult,
  polygon,
  "Nombre Zona",
  userId // opcional
);
// Returns: { zonaVerdeId, analisisId, timestamp }
```

**Generar registro de informe**:
```typescript
const reportId = await generateReport(
  analisisId,
  'pdf',
  htmlContent, // opcional
  pdfUrl // opcional
);
```

### pdf-generator.ts

**Generar PDF**:
```typescript
const blob = await generatePDFReport({
  analysisResult,
  polygon,
  zoneName: "Mi Zona",
  mapImageUrl: "data:image/png;base64,..." // opcional
});
```

**Descargar PDF**:
```typescript
await downloadPDFReport(
  { analysisResult, polygon, zoneName },
  "mi-informe.pdf" // opcional
);
```

## Datos Calculados Automáticamente

El sistema calcula automáticamente:

| Métrica | Fórmula | Ejemplo |
|---------|---------|---------|
| Inversión inicial | `área_m2 × €150/m²` | 13,499 m² × €150 = €2,024,850 |
| Ahorro anual | `área_m2 × €7.95/m²` | 13,499 m² × €7.95 = €107,317 |
| ROI | `(ahorro/inversión) × 100` | (107,317/2,024,850) × 100 = 5.3% |
| Amortización | `inversión / ahorro` | 2,024,850 / 107,317 = 18.9 años |
| CO₂ absorbido | `área_m2 × 0.5 kg/año` | 13,499 × 0.5 = 6,750 kg/año |
| O₂ producido | `área_m2 × 0.8 kg/año` | 13,499 × 0.8 = 10,799 kg/año |
| Implementación | `(área_m2/100) × 30 días` | (13,499/100) × 30 = 4,050 días |

## Estructura de Base de Datos

### Tabla `zonas_verdes`
```sql
id: UUID
nombre: VARCHAR(255)
coordenadas: JSONB (GeoJSON Polygon)
area_m2: DECIMAL
viabilidad: VARCHAR(20) -- 'alta', 'media', 'baja', 'nula'
estado: VARCHAR(30) -- 'propuesta', 'en_analisis', etc
created_at: TIMESTAMP
```

### Tabla `analisis`
```sql
id: UUID
zona_verde_id: UUID (FK)
tipo_suelo: VARCHAR(100)
exposicion_solar: DECIMAL
especies_recomendadas: JSONB
coste_estimado: DECIMAL
impacto_ambiental_co2_anual: DECIMAL
impacto_ambiental_oxigeno_anual: DECIMAL
tiempo_implementacion_dias: INTEGER
created_at: TIMESTAMP
```

### Tabla `informes` (NUEVA)
```sql
id: UUID
analisis_id: UUID (FK)
formato: VARCHAR(10) -- 'pdf', 'html', 'json'
contenido: TEXT
url_pdf: TEXT
generado_por: UUID
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## Responsive Design

El diseño se adapta automáticamente:

### Desktop (>1024px)
```
┌──────────────────┬─────────────┐
│                  │             │
│  Mapa Satelital  │   Panel     │
│    (60%)         │  Resumen    │
│                  │   (40%)     │
│                  │             │
└──────────────────┴─────────────┘
```

### Tablet (768px-1024px)
```
┌──────────────┬───────────┐
│              │           │
│    Mapa      │   Panel   │
│    (50%)     │   (50%)   │
│              │           │
└──────────────┴───────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│                  │
│  Mapa Satelital  │
│                  │
├──────────────────┤
│                  │
│  Panel Resumen   │
│  (scroll)        │
│                  │
└──────────────────┘
```

## Troubleshooting Común

### 1. "Missing Supabase credentials"
❌ **Error**: Aplicación no carga
✅ **Solución**: Crear archivo `.env` con credenciales

### 2. Mapa satelital no carga
❌ **Error**: Mapa gris sin imágenes
✅ **Solución**: 
- Desactivar bloqueador de anuncios
- Verificar conexión a internet
- Probar en modo incógnito

### 3. PDF no se genera
❌ **Error**: Click en "Descargar PDF" no hace nada
✅ **Solución**:
```bash
npm install jspdf jspdf-autotable --save
```

### 4. Error al guardar en Supabase
❌ **Error**: "Failed to save analysis"
✅ **Solución**:
- Verificar que migración 003 esté ejecutada
- Verificar permisos RLS en Supabase
- Ver logs en console del navegador

## Ejemplos de Uso Avanzado

### Personalizar colores del Green Score
```typescript
// En ReportSummary.tsx
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50';
  if (score >= 60) return 'text-green-600 bg-green-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}
```

### Agregar logo al PDF
```typescript
// En pdf-generator.ts
doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
```

### Capturar mapa para PDF
```typescript
import html2canvas from 'html2canvas';

const mapElement = document.querySelector('.leaflet-container');
const canvas = await html2canvas(mapElement);
const imgData = canvas.toDataURL('image/png');
```

## Recursos Adicionales

- 📖 [Documentación Completa](./ANALYSIS_REPORT_SYSTEM.md)
- 🔧 [API Reference](../frontend/src/services/)
- 🎨 [Componentes UI](../frontend/src/components/analysis/)
- 🗄️ [Migraciones DB](../supabase/migrations/)

## Soporte

Para reportar bugs o solicitar features:
1. Crear issue en GitHub
2. Incluir logs de console
3. Incluir pasos para reproducir
4. Adjuntar screenshot si es visual

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Autor**: EcoUrbe AI Team
