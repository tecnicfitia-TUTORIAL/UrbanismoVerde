# Análisis Especializados - Documentación

## 📚 Concepto

Los **Análisis Especializados** son una extensión del sistema de análisis base que permite generar análisis más detallados y específicos según el tipo de zona verde. Implementan un patrón de **herencia jerárquica** donde cada especialización:

1. **Hereda** los datos básicos del análisis general
2. **Añade** información específica según el tipo
3. **Ajusta** presupuestos y viabilidades considerando factores adicionales

## 🏗️ Arquitectura

### Herencia Jerárquica

```
┌─────────────────────┐
│   Análisis Base     │
│  (analisis)         │
│  - green_score      │
│  - área             │
│  - especies         │
│  - presupuesto base │
└──────────┬──────────┘
           │
           │ hereda
           │
┌──────────▼──────────────────────┐
│ Análisis Especializado          │
│ (analisis_especializados)       │
│                                  │
│ + Snapshot heredado              │
│ + Características específicas   │
│ + Análisis adicional             │
│ + Presupuesto ajustado          │
│ + Viabilidades detalladas       │
└──────────────────────────────────┘
```

## 📊 Estructura de Datos

### Tabla: `analisis_especializados`

```sql
CREATE TABLE analisis_especializados (
  id UUID PRIMARY KEY,
  analisis_id UUID REFERENCES analisis(id),
  
  -- Tipo de especialización
  tipo_especializacion VARCHAR(50),
  
  -- Snapshot de datos heredados
  area_base_m2 NUMERIC(12,2),
  green_score_base NUMERIC(5,2),
  especies_base JSONB,
  presupuesto_base_eur BIGINT,
  
  -- Datos específicos (JSONB)
  caracteristicas_especificas JSONB,
  analisis_adicional JSONB,
  presupuesto_adicional JSONB,
  
  -- Presupuesto ajustado
  presupuesto_total_eur BIGINT,
  incremento_vs_base_eur BIGINT,
  incremento_vs_base_porcentaje NUMERIC(5,2),
  
  -- Viabilidades específicas
  viabilidad_tecnica VARCHAR(20),
  viabilidad_economica VARCHAR(20),
  viabilidad_normativa VARCHAR(20),
  viabilidad_final VARCHAR(20),
  
  -- Metadata
  notas TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Restricciones

- **Unicidad**: Un análisis no puede tener más de una especialización del mismo tipo
- **Integridad**: Si se elimina el análisis base, se eliminan todas sus especializaciones (CASCADE)
- **Valores válidos**: 
  - `tipo_especializacion`: tejado, zona_abandonada, solar_vacio, parque_degradado, jardin_vertical, otro
  - `viabilidad_*`: alta, media, baja, nula

## 🎯 Tipos de Especialización

### 1. Tejado / Cubierta Verde (`tejado`)

**Características específicas:**
- `carga_estructural_kg_m2`: Carga admisible del tejado
- `tipo_cubierta`: plana, inclinada, intensiva, extensiva
- `accesibilidad`: si, no, limitada
- `estado_impermeabilizacion`: bueno, aceptable, necesita_reparacion

**Análisis adicional:**
- `estudio_estructural`: necesario, completado, no_requerido
- `analisis_pendiente`: grados de inclinación
- `sistemas_drenaje`: requerimientos específicos

**Presupuesto adicional:**
- `refuerzo_estructural_eur`: coste de refuerzo si necesario
- `impermeabilizacion_eur`: reparación/mejora de impermeabilización
- `sistema_retencion_eur`: sistema de retención de agua

**Viabilidades:**
- Técnica: evaluación de capacidad estructural
- Económica: ROI considerando costes adicionales
- Normativa: cumplimiento CTE DB-HS, PECV Madrid

### 2. Zona Abandonada (`zona_abandonada`)

**Características específicas:**
- `años_abandono`: años sin uso
- `estado_conservacion`: bueno, regular, malo, muy_malo
- `escombros_presentes`: si, no
- `infraestructura_existente`: descripción

**Análisis adicional:**
- `limpieza_requerida`: nivel (baja, media, alta)
- `analisis_suelo`: contaminación, calidad
- `seguridad_perimetral`: estado del vallado

**Presupuesto adicional:**
- `limpieza_escombros_eur`: coste de limpieza
- `vallado_seguridad_eur`: instalación/reparación de vallas
- `acondicionamiento_terreno_eur`: nivelación, preparación

### 3. Solar Vacío (`solar_vacio`)

**Características específicas:**
- `regimen_propiedad`: publico, privado, mixto
- `plan_futuro`: sin_definir, edificacion_pendiente, espacio_verde_temporal
- `duracion_estimada_años`: años de uso temporal

**Análisis adicional:**
- `calidad_suelo`: análisis de suelo
- `accesibilidad_vehiculos`: si, no, limitada
- `servicios_disponibles`: agua, electricidad

**Presupuesto adicional:**
- `preparacion_suelo_eur`: mejora de suelo
- `instalaciones_temporales_eur`: infraestructura desmontable
- `servicios_basicos_eur`: conexiones de agua/luz

### 4. Parque Degradado (`parque_degradado`)

**Características específicas:**
- `año_construccion`: año de creación original
- `elementos_conservar`: árboles, senderos, mobiliario
- `problemas_principales`: listado de problemas

**Análisis adicional:**
- `inventario_arboles`: árboles existentes y estado
- `mobiliario_actual`: estado del mobiliario
- `sistemas_riego_existente`: funcionalidad

**Presupuesto adicional:**
- `restauracion_elementos_eur`: reparación de elementos existentes
- `nuevo_mobiliario_eur`: reemplazo de mobiliario
- `mejora_riego_eur`: actualización sistema de riego

### 5. Jardín Vertical (`jardin_vertical`)

**Características específicas:**
- `orientacion_fachada`: norte, sur, este, oeste
- `altura_instalacion_m`: altura de la instalación
- `tipo_fachada`: ladrillo, hormigon, madera, vidrio
- `acceso_mantenimiento`: facil, medio, dificil

**Análisis adicional:**
- `estudio_sombras`: horas de sol directo
- `analisis_viento`: exposición al viento
- `acceso_agua`: facilidad para riego

**Presupuesto adicional:**
- `estructura_soporte_eur`: sistema de anclaje
- `sistema_riego_automatico_eur`: riego por goteo vertical
- `mantenimiento_altura_eur`: costes de acceso para mantenimiento

### 6. Otro Tipo (`otro`)

Tipo flexible para casos personalizados. Los campos JSONB permiten cualquier estructura de datos específica.

## 🔄 Flujo de Uso

### 1. Análisis Base

```typescript
// 1. Usuario realiza análisis base
const analysisResult = await analyzeZone(polygon);
// Resultado: green_score, área, especies, presupuesto base
```

### 2. Guardar Análisis

```typescript
// 2. Guardar análisis en BD
const { analisisId } = await saveAnalysis(analysisResult, polygon, zoneName);
```

### 3. Generar Especialización

```typescript
// 3. Usuario selecciona tipo de especialización
const request: GenerateSpecializationRequest = {
  analisis_id: analisisId,
  tipo_especializacion: 'tejado',
  area_base_m2: analysisResult.area_m2,
  green_score_base: analysisResult.green_score,
  especies_base: analysisResult.especies_recomendadas,
  presupuesto_base_eur: analysisResult.presupuesto.coste_total_inicial_eur
};

// 4. Backend genera análisis especializado
const response = await fetch('/api/analysis/specialize/roof', {
  method: 'POST',
  body: JSON.stringify(request)
});

// 5. Guardar especialización
await saveSpecializedAnalysis(response.data);
```

### 4. Consultar Especializaciones

```typescript
// Obtener todas las especializaciones de un análisis
const especializations = await getSpecializationsByAnalisisId(analisisId);

// Obtener una especialización específica
const roofAnalysis = await getSpecializationById(especializacionId);
```

## 📋 Queries Útiles

### Ver todos los análisis completos

```sql
SELECT * FROM analisis_completos
ORDER BY especializacion_created_at DESC;
```

### Especializaciones de un análisis

```sql
SELECT * FROM get_especializaciones_by_analisis('analisis-uuid-here');
```

### Estadísticas por tipo

```sql
SELECT * FROM count_especializaciones_by_tipo();
```

### Especializaciones con alta viabilidad

```sql
SELECT 
  ae.*,
  a.green_score,
  zv.nombre as zona_nombre
FROM analisis_especializados ae
JOIN analisis a ON a.id = ae.analisis_id
JOIN zonas_verdes zv ON zv.id = a.zona_verde_id
WHERE ae.viabilidad_final = 'alta'
ORDER BY ae.presupuesto_total_eur ASC;
```

### Comparar presupuestos base vs especializado

```sql
SELECT 
  ae.tipo_especializacion,
  ae.presupuesto_base_eur,
  ae.presupuesto_total_eur,
  ae.incremento_vs_base_eur,
  ae.incremento_vs_base_porcentaje
FROM analisis_especializados ae
WHERE ae.analisis_id = 'analisis-uuid-here';
```

## 🚀 Roadmap

### ✅ PR1: Infraestructura (Actual)

- [x] Migración de base de datos
- [x] TypeScript types
- [x] Servicios CRUD
- [x] UI SpecializationPanel
- [x] Integración en AnalysisReportPage
- [x] Documentación

### ⏳ PR2: Análisis de Tejados (Próximo)

- [ ] Endpoint `/api/analysis/specialize/roof`
- [ ] Cálculo de carga estructural
- [ ] Análisis de pendiente e impermeabilización
- [ ] Ajuste de presupuesto para cubiertas
- [ ] Validación normativa CTE DB-HS
- [ ] Tests e2e

### ⏳ PR3: Otros Tipos de Especialización

- [ ] Endpoint `/api/analysis/specialize/abandoned`
- [ ] Endpoint `/api/analysis/specialize/empty-lot`
- [ ] Endpoint `/api/analysis/specialize/degraded-park`
- [ ] Endpoint `/api/analysis/specialize/vertical-garden`
- [ ] Endpoint `/api/analysis/specialize/custom`
- [ ] Tests completos para todos los tipos

### ⏳ PR4: Funcionalidades Avanzadas

- [ ] Comparador de especializaciones
- [ ] Recomendador automático del mejor tipo
- [ ] Export PDF de especializaciones
- [ ] Dashboard de especializaciones
- [ ] Analytics y métricas

## 💡 Ejemplos de Uso

### Crear Especialización Manualmente

```typescript
import { saveSpecializedAnalysis } from '@/services/specialization-service';

const especializacion = await saveSpecializedAnalysis({
  analisis_id: 'uuid-del-analisis',
  tipo_especializacion: 'tejado',
  area_base_m2: 250,
  green_score_base: 75.5,
  especies_base: [...],
  presupuesto_base_eur: 37500,
  caracteristicas_especificas: {
    carga_estructural_kg_m2: 250,
    tipo_cubierta: 'plana',
    accesibilidad: 'si'
  },
  analisis_adicional: {
    estudio_estructural: 'completado',
    analisis_pendiente: 0
  },
  presupuesto_adicional: {
    refuerzo_estructural_eur: 5000,
    impermeabilizacion_eur: 3000
  },
  presupuesto_total_eur: 45500,
  incremento_vs_base_eur: 8000,
  incremento_vs_base_porcentaje: 21.33,
  viabilidad_tecnica: 'alta',
  viabilidad_economica: 'media',
  viabilidad_normativa: 'alta',
  viabilidad_final: 'alta'
});
```

### Listar Especializaciones

```typescript
import { getSpecializationsByAnalisisId } from '@/services/specialization-service';

const especializaciones = await getSpecializationsByAnalisisId(analisisId);

especializaciones.forEach(esp => {
  console.log(`${esp.tipo_especializacion}: ${esp.viabilidad_final}`);
  console.log(`Presupuesto: ${esp.presupuesto_total_eur}€`);
  console.log(`Incremento: +${esp.incremento_vs_base_porcentaje}%`);
});
```

### Contar por Tipo

```typescript
import { countSpecializationsByType } from '@/services/specialization-service';

const counts = await countSpecializationsByType();
// { tejado: 15, zona_abandonada: 8, solar_vacio: 12, ... }
```

## 🔒 Seguridad

Las políticas RLS actuales son **públicas para testing**. En producción, ajustar a:

```sql
-- Ejemplo de política basada en usuario
CREATE POLICY "Usuarios pueden ver sus especializaciones"
  ON analisis_especializados
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analisis a
      JOIN zonas_verdes zv ON zv.id = a.zona_verde_id
      WHERE a.id = analisis_especializados.analisis_id
      AND zv.user_id = auth.uid()
    )
  );
```

## 📞 Soporte

Para preguntas o problemas:
- Issues en GitHub: [github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/issues](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/issues)
- Documentación adicional: `/docs/`

---

**Versión:** 1.0  
**Última actualización:** 2026-02-12  
**Autor:** Sistema de Análisis Especializados
