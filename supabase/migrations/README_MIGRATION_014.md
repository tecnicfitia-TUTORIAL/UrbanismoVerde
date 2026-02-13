# Migration 014: Create Specialized Analysis Table

## Overview

Creates `analisis_especializados` table to store specialized analysis results for different green zone types. This migration supports 9 different specialization types including the core 4 types (tejado, fachada, muro, parque) plus additional specialized categories.

## Supported Specialization Types

### Core Types (Required by API)
- **tejado** (Rooftop green infrastructure)
- **fachada** (Green facade/vertical garden on building facades)
- **muro** (Green wall infrastructure)
- **parque** (Park/ground-level green space)

### Extended Types (Additional Categories)
- **zona_abandonada** (Abandoned area regeneration)
- **solar_vacio** (Empty lot transformation)
- **parque_degradado** (Degraded park improvement)
- **jardin_vertical** (Vertical garden systems)
- **otro** (Custom/other types)

## Problem Solved

**Error before migration:**
```javascript
❌ Error: Could not find the table 'public.analisis_especializados' 
   in the schema cache

GET .../analisis_especializados?... → 404 (Not Found)

💾 Guardando análisis especializado... tejado
→ ❌ Failed to save specialization: Table not found
```

**Cause:** Frontend tries to save specialized analysis but table doesn't exist.

---

## Schema Details

### Table Structure

```sql
analisis_especializados (
  id                              UUID PRIMARY KEY,
  analisis_id                     UUID REFERENCES analisis(id),
  tipo_especializacion            VARCHAR(50),  -- tejado|fachada|muro|parque|...
  area_base_m2                    NUMERIC(12,2),
  green_score_base                NUMERIC(5,2),
  especies_base                   JSONB,
  presupuesto_base_eur            BIGINT,
  caracteristicas_especificas     JSONB,
  analisis_adicional              JSONB,
  presupuesto_adicional           JSONB,
  presupuesto_total_eur           BIGINT,
  incremento_vs_base_eur          BIGINT,
  incremento_vs_base_porcentaje   NUMERIC(5,2),
  viabilidad_tecnica              VARCHAR(20),
  viabilidad_economica            VARCHAR(20),
  viabilidad_normativa            VARCHAR(20),
  viabilidad_final                VARCHAR(20),
  notas                           TEXT,
  created_at                      TIMESTAMP WITH TIME ZONE,
  updated_at                      TIMESTAMP WITH TIME ZONE
)
```

### Key Features

1. **Hierarchical Structure**: Each specialized analysis links to a base analysis via `analisis_id`
2. **Flexible JSONB Fields**: Characteristics and additional analysis data stored as JSONB for flexibility
3. **Budget Tracking**: Tracks base budget, additional costs, and total budget with percentage increases
4. **Viability Assessment**: Multi-dimensional viability scoring (technical, economic, regulatory, final)
5. **Unique Constraint**: Prevents duplicate specializations of the same type for one analysis

### Indexes

1. `idx_analisis_especializados_analisis_id` - Fast lookups by base analysis
2. `idx_analisis_especializados_tipo` - Filter by specialization type
3. `idx_analisis_especializados_viabilidad_final` - Filter by viability
4. `idx_analisis_especializados_created_at` - Sorting by date
5. `idx_analisis_especializados_unique_tipo` - Unique constraint on (analisis_id, tipo_especializacion)

### RLS Policies

- ✅ Public read access (temporary)
- ✅ Public write access (temporary)
- 🚧 TODO: Restrict to authenticated users once auth is implemented

### Functions

1. `get_especializaciones_by_analisis(p_analisis_id UUID)` - Retrieves all specializations for an analysis
2. `count_especializaciones_by_tipo()` - Returns statistics grouped by type and viability

### Views

1. `analisis_completos` - Joins base analysis with specializations and zone information

---

## How to Apply

### Option A: Supabase Dashboard (Recommended for Testing)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `014_create_analisis_especializados.sql`
3. Paste and click "Run"
4. Verify success:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE tablename = 'analisis_especializados';
   ```
   Expected: 1 row

### Option B: Supabase CLI (Production)

```bash
# Link project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# Verify
supabase db remote changes
```

---

## Testing

### Test 1: Verify Table Exists

```sql
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename = 'analisis_especializados';

-- Expected result: 1 row
-- tablename: analisis_especializados
-- schemaname: public
```

### Test 2: Verify Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'analisis_especializados'
ORDER BY indexname;

-- Expected result: 5+ rows including:
-- idx_analisis_especializados_analisis_id
-- idx_analisis_especializados_tipo
-- idx_analisis_especializados_viabilidad_final
-- idx_analisis_especializados_created_at
-- idx_analisis_especializados_unique_tipo
```

### Test 3: Verify RLS Policies

```sql
SELECT 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'analisis_especializados';

-- Expected result: 4 rows
-- Permitir lectura pública (SELECT)
-- Permitir inserción pública (INSERT)
-- Permitir actualización pública (UPDATE)
-- Permitir eliminación pública (DELETE)
```

### Test 4: Test All Specialization Types

```sql
-- Get an existing analysis ID
SELECT id FROM analisis ORDER BY created_at DESC LIMIT 1;

-- Test inserting each core type
INSERT INTO analisis_especializados (
  analisis_id,
  tipo_especializacion,
  area_base_m2,
  green_score_base,
  viabilidad_final
) VALUES 
  ((SELECT id FROM analisis LIMIT 1), 'tejado', 100.0, 75.0, 'alta'),
  ((SELECT id FROM analisis LIMIT 1), 'fachada', 50.0, 70.0, 'media'),
  ((SELECT id FROM analisis LIMIT 1), 'muro', 30.0, 65.0, 'media'),
  ((SELECT id FROM analisis LIMIT 1), 'parque', 200.0, 80.0, 'alta');

-- Verify inserts
SELECT tipo_especializacion, area_base_m2, viabilidad_final
FROM analisis_especializados 
ORDER BY created_at DESC 
LIMIT 4;
```

### Test 5: Test Unique Constraint

```sql
-- Try to insert duplicate specialization (should fail)
INSERT INTO analisis_especializados (
  analisis_id,
  tipo_especializacion,
  area_base_m2,
  green_score_base
) VALUES (
  (SELECT id FROM analisis LIMIT 1),
  'tejado',  -- Already exists
  100.0,
  75.0
);

-- Expected error:
-- ERROR: duplicate key value violates unique constraint 
--        "idx_analisis_especializados_unique_tipo"
```

### Test 6: Frontend Integration Test

```bash
1. Run frontend app: npm run dev
2. Analyze a zone on the map
3. Click "Generar Especializaciones"
4. Check console for:
   ✅ "💾 Guardando análisis especializado... tejado"
   ✅ "✅ Especialización guardada: [UUID]"
   
5. Check UI:
   ✅ All specialization cards show data
   ✅ Budget calculations displayed correctly
   ✅ Viability indicators show proper colors
   
6. Verify in database:
   SELECT COUNT(*) FROM analisis_especializados;
   -- Expected: 1+ rows (depending on specializations created)
```

---

## Expected Outcomes

### Before Migration ❌
```javascript
💾 Guardando análisis especializado... tejado
→ 404 (Not Found)
→ ❌ Error: Table 'analisis_especializados' not found

UI Result:
❌ Cannot save specializations
❌ Database errors in console
❌ User cannot persist specialized analysis
```

### After Migration ✅
```javascript
💾 Guardando análisis especializado... tejado
✅ Especialización guardada: 9fe6e2ef-fe61-45e5-a801-60ebbdb293f6

UI Result:
✓ Specializations save successfully
✓ Data persists in database
✓ Users can retrieve and compare specializations
✓ All 9 specialization types supported
```

---

## Related Files

- **Migration:** `supabase/migrations/014_create_analisis_especializados.sql`
- **Frontend types:** `frontend/src/types/index.ts` (TipoEspecializacion, TIPOS_ESPECIALIZACION)
- **Frontend service:** `frontend/src/services/specialization-service.ts`
- **Frontend component:** `frontend/src/components/analysis/AnalysisReportPage.tsx`
- **Frontend panel:** `frontend/src/components/analysis/SpecializationPanel.tsx`

---

## Data Model Example

### Tejado (Rooftop) Specialization
```json
{
  "caracteristicas_especificas": {
    "carga_estructural_kg_m2": 150,
    "inclinacion_grados": 5,
    "impermeabilizacion": "membrana_EPDM",
    "acceso": "escalera_interior"
  },
  "analisis_adicional": {
    "estudio_estructural": "Refuerzo necesario en vigas principales",
    "drenaje": "Sistema de evacuación existente suficiente",
    "mantenimiento_anual_horas": 24
  },
  "presupuesto_adicional": {
    "refuerzo_estructural_eur": 5000,
    "impermeabilizacion_eur": 3000,
    "drenaje_adicional_eur": 1500
  }
}
```

### Fachada (Facade) Specialization
```json
{
  "caracteristicas_especificas": {
    "orientacion": "sur",
    "altura_metros": 12,
    "sistema_anclaje": "perfiles_metalicos",
    "tipo_muro": "hormigon"
  },
  "analisis_adicional": {
    "estudio_viento": "Velocidad máxima 80 km/h",
    "exposicion_solar": "8 horas/día promedio",
    "riego_automatizado": true
  },
  "presupuesto_adicional": {
    "estructura_soporte_eur": 8000,
    "sistema_riego_eur": 4000,
    "anclajes_eur": 2000
  }
}
```

---

## Migration Date

**2026-02-12** (Original creation)  
**2026-02-13** (Updated to include fachada, muro, parque types)

## Status

✅ Ready to apply
✅ Includes all required specialization types
✅ Frontend types updated
✅ Service layer updated
✅ Build verified

## Notes

- The table supports 9 specialization types total (4 core + 5 extended)
- JSONB fields provide flexibility for type-specific characteristics
- Unique constraint prevents duplicate specializations per analysis
- RLS policies are currently public - should be restricted once authentication is implemented
- Helper functions and views included for common queries
