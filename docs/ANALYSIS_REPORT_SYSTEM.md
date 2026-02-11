# 📊 Sistema de Informes de Análisis - Documentación

## Descripción General

Sistema completo de generación de informes para análisis de zonas verdes, incluyendo visualización satelital interactiva, panel de resumen detallado, y exportación a PDF.

## Características Implementadas

### 1. **AnalysisReportPage** - Landing Page de Resultados
- ✅ Diseño responsive con layout dividido (mapa + panel)
- ✅ Header con Green Score destacado
- ✅ Información de área y fecha
- ✅ Botón de cerrar con navegación

**Ubicación**: `frontend/src/components/analysis/AnalysisReportPage.tsx`

### 2. **SatelliteMap** - Mapa Satelital Interactivo
- ✅ Vista satelital con tiles de ESRI
- ✅ Overlay de etiquetas geográficas
- ✅ Polígono de zona analizada resaltado
- ✅ Ajuste automático de zoom al polígono
- ✅ Controles y leyenda
- ✅ Información de área en tiempo real

**Ubicación**: `frontend/src/components/analysis/SatelliteMap.tsx`

**Características técnicas**:
- Usa Leaflet con tiles de ESRI Satellite
- Conversión automática GeoJSON → Leaflet coords
- Cálculo dinámico de bounds

### 3. **ReportSummary** - Panel de Resumen
- ✅ Resumen ejecutivo con Green Score
- ✅ Estadísticas clave (área, viabilidad, ROI)
- ✅ Lista de especies recomendadas (top 5)
- ✅ Costos y beneficios estimados
- ✅ Recomendaciones técnicas
- ✅ Tags de características
- ✅ Botones de acción (Guardar, Descargar PDF)
- ✅ Estados de carga (saving, generating PDF)

**Ubicación**: `frontend/src/components/analysis/ReportSummary.tsx`

### 4. **useAnalysisReport** - Hook de Gestión
Estado manejado:
- `isSaving` - guardando en Supabase
- `isGeneratingPDF` - generando PDF
- `savedAnalysisId` - ID del análisis guardado
- `pdfUrl` - URL del PDF generado
- `error` - mensajes de error
- `subZones` - sub-zonas seleccionadas (para futura implementación)

Acciones:
- `saveToDatabase()` - Guardar en Supabase
- `generatePDF()` - Generar PDF en memoria
- `downloadPDF()` - Descargar PDF
- `updateSubZones()` - Actualizar sub-zonas
- `recalculateAnalysis()` - Recalcular con sub-zonas (pendiente)

**Ubicación**: `frontend/src/hooks/useAnalysisReport.ts`

### 5. **analysis-storage.ts** - Servicio de Supabase
Funciones implementadas:
- `saveAnalysis()` - Guardar análisis completo
- `createZonaVerde()` - Crear registro de zona
- `saveToAnalisisTable()` - Guardar datos de análisis
- `generateReport()` - Guardar registro de informe
- `getAnalysisById()` - Obtener análisis por ID
- `getReportsByAnalisisId()` - Obtener informes de un análisis

**Ubicación**: `frontend/src/services/analysis-storage.ts`

**Datos calculados automáticamente**:
- Costo estimado: `área_m2 × €150/m²`
- Tiempo de implementación: `(área_m2 / 100) × 30 días`
- Absorción CO₂: `área_m2 × 0.5 kg/año`
- Producción O₂: `área_m2 × 0.8 kg/año`

### 6. **pdf-generator.ts** - Generador de PDF
Usa jsPDF + jspdf-autotable para generar informes profesionales.

**Secciones del PDF**:
1. Portada con Green Score
2. Resumen Ejecutivo
3. Características de la Zona
4. Especies Recomendadas (tabla)
5. Costos y Beneficios
6. Beneficios Ambientales
7. Recomendaciones Técnicas
8. Normativa Aplicable

**Ubicación**: `frontend/src/services/pdf-generator.ts`

**Funciones**:
- `generatePDFReport()` - Generar PDF como Blob
- `downloadPDFReport()` - Descargar PDF directamente

### 7. **Base de Datos** - Migración
Nueva tabla `informes`:
```sql
CREATE TABLE informes (
  id UUID PRIMARY KEY,
  analisis_id UUID REFERENCES analisis(id),
  formato VARCHAR(10) CHECK (formato IN ('pdf', 'html', 'json')),
  contenido TEXT,
  url_pdf TEXT,
  generado_por UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Ubicación**: `supabase/migrations/003_create_informes_table.sql`

## Flujo de Usuario

### Flujo Completo
```
1. Usuario dibuja polígono en mapa
   ↓
2. Sistema analiza con IA (/api/analyze)
   ↓
3. Mostrar AnalysisReportPage
   ├─ Mapa satelital (izquierda)
   └─ Panel resumen (derecha)
   ↓
4. Usuario revisa resultados
   ↓
5. [Opcional] Click "Guardar Análisis"
   ├─ Guarda en tabla zonas_verdes
   ├─ Guarda en tabla analisis
   └─ Retorna IDs
   ↓
6. [Opcional] Click "Descargar PDF"
   ├─ Genera PDF con jsPDF
   ├─ Guarda registro en tabla informes
   └─ Descarga automáticamente
   ↓
7. Usuario cierra informe
   └─ Opción de guardar zona
```

## Integración en Layout

**Cambios en `Layout.tsx`**:
```typescript
// Estado nuevo
const [showAnalysisReport, setShowAnalysisReport] = useState(false);
const [currentPolygon, setCurrentPolygon] = useState<GeoJSONPolygon | null>(null);

// Después de análisis exitoso
if (result && result.success) {
  const geoJSONPolygon = coordinatesToGeoJSON(coords);
  setCurrentPolygon(geoJSONPolygon);
  setShowAnalysisReport(true); // Mostrar nuevo informe
}

// Renderizado
{showAnalysisReport && analysisResult && currentPolygon && (
  <AnalysisReportPage
    analysisResult={analysisResult}
    polygon={currentPolygon}
    onClose={handleCloseAnalysisReport}
    onSave={handleSaveFromReport}
  />
)}
```

## Dependencias Instaladas

```json
{
  "jspdf": "^4.1.0",
  "jspdf-autotable": "^5.0.7",
  "@react-google-maps/api": "^2.19.3",
  "html2canvas": "^1.4.1",
  "react-to-print": "^2.15.1"
}
```

## Tipos TypeScript Nuevos

**En `types/index.ts`**:
```typescript
// Datos de costos y beneficios
export interface CostBenefitData {
  inversion_inicial: number;
  ahorro_anual: number;
  roi_porcentaje: number;
  amortizacion_anos: number;
  subvenciones_disponibles: number;
}

// Sub-zona para selección en mapa
export interface SubZone {
  id: string;
  polygon: GeoJSONPolygon;
  area_m2: number;
  selected: boolean;
}

// Análisis guardado
export interface SavedAnalysis {
  zonaVerdeId: string;
  analisisId: string;
  timestamp: Date;
}

// Registro de informe
export interface ReportData {
  id: string;
  analisis_id: string;
  formato: 'pdf' | 'html' | 'json';
  contenido?: string;
  url_pdf?: string;
  generado_por?: string;
  created_at: Date;
}
```

**En `config/supabase.ts`**:
```typescript
export interface Informe {
  id: string;
  analisis_id: string;
  formato: 'pdf' | 'html' | 'json';
  contenido?: string;
  url_pdf?: string;
  generado_por?: string;
  created_at: string;
  updated_at: string;
}
```

## Características Responsive

- **Desktop**: Layout horizontal (mapa 60% | panel 40%)
- **Tablet**: Layout horizontal ajustado
- **Mobile**: Layout vertical (mapa arriba, panel abajo con scroll)

CSS aplicado:
```css
@media (max-width: 768px) {
  .flex-1.flex {
    flex-direction: column;
  }
  .panel {
    width: 100%;
    max-height: 50vh;
  }
}
```

## Próximas Mejoras

### Funcionalidades Futuras
- [ ] Selección de sub-zonas en mapa satelital
- [ ] Captura de mapa en PDF (con html2canvas)
- [ ] Subida de PDF a S3/Storage
- [ ] Historial de informes generados
- [ ] Compartir informe por email
- [ ] Exportar a otros formatos (Word, HTML)
- [ ] Comparación entre análisis
- [ ] Recalcular análisis con sub-zonas seleccionadas

### Optimizaciones Técnicas
- [ ] Cache de PDFs generados (IndexedDB)
- [ ] Lazy loading de componentes pesados
- [ ] Paginación de especies (más de 10)
- [ ] WebWorker para generación de PDF
- [ ] Compresión de imágenes en PDF

## Testing

### Cómo Probar
1. Iniciar aplicación: `npm run dev`
2. Crear archivo `.env` con credenciales Supabase
3. Ir a "Dibujar Zonas"
4. Dibujar un polígono (min 3 puntos)
5. Click "Completar"
6. Esperar análisis (10 seg)
7. Ver AnalysisReportPage
8. Probar botones Guardar/PDF

### Tests Manuales Requeridos
- ✅ Compilación exitosa
- ⏳ Visualización de informe
- ⏳ Generación de PDF
- ⏳ Guardado en Supabase
- ⏳ Responsividad móvil

## Troubleshooting

### Error: "Missing Supabase credentials"
**Solución**: Crear archivo `.env` en `frontend/` con:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Error: "Failed to generate PDF"
**Solución**: Verificar que jspdf esté instalado:
```bash
cd frontend && npm install jspdf jspdf-autotable
```

### Mapa no carga tiles
**Causas posibles**:
- Bloqueador de anuncios/trackers
- Firewall corporativo
- Sin conexión a internet

**Solución**: Desactivar bloqueadores o usar VPN

## Referencias

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Leaflet Documentation](https://leafletjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Leaflet](https://react-leaflet.js.org/)

## Autor

Implementado como parte del sistema EcoUrbe AI
Fecha: Febrero 2026
