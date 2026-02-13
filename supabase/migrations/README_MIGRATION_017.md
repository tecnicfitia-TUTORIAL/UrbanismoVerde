# Migration 017: Create Inspecciones de Tejados Table

## Overview

Creates `inspecciones_tejados` table to store individual rooftop inspections with complete geographic context. This migration supports the new "Inspección de Tejados" (Rooftop Inspection) feature which simplifies the workflow by providing a dedicated tool for inspecting individual rooftops.

## Problem Solved

The current workflow has become confusing with multiple overlapping features:
1. ❌ Zone analysis flow is broken
2. ❌ Specialized analysis detail shows map without satellite imagery (blank background)
3. ❌ Too many views with maps creating confusion (modal, page, analysis, specialized)
4. ❌ Missing geographic context (address, street number, exact location)

**Solution:** Create a dedicated "Inspección de Tejados" section that:
- Removes maps from existing analysis/zone detail views
- Creates a dedicated inspection tool for individual rooftops
- Adds geographic context (addresses via reverse geocoding)
- Enables inspections to be attached as annexes to reports

---

## Schema Details

### Table Structure

```sql
inspecciones_tejados (
  id                      UUID PRIMARY KEY,
  codigo                  VARCHAR(50) UNIQUE,    -- Auto-generated: "INSP-0001"
  nombre                  VARCHAR(255),
  
  -- Location (auto-detected via reverse geocoding)
  direccion               TEXT,
  numero                  VARCHAR(20),
  municipio               VARCHAR(100),
  provincia               VARCHAR(100),
  codigo_postal           VARCHAR(10),
  pais                    VARCHAR(50) DEFAULT 'España',
  
  -- Geometry
  coordenadas             JSONB NOT NULL,        -- GeoJSON Polygon
  centroide               GEOGRAPHY(POINT, 4326),
  
  -- Metrics (auto-calculated)
  area_m2                 DECIMAL(10,2),
  perimetro_m             DECIMAL(10,2),
  orientacion             VARCHAR(20),           -- 'Norte', 'Sur', etc.
  
  -- Images
  imagen_satelital_url    TEXT,
  imagen_calle_url        TEXT,                  -- Future: Street View
  
  -- Characteristics (user input)
  inclinacion_estimada    DECIMAL(5,2),
  tipo_cubierta           VARCHAR(50),           -- 'plana', 'inclinada', 'mixta'
  estado_conservacion     VARCHAR(50),           -- 'excelente', 'bueno', etc.
  obstrucciones           JSONB DEFAULT '[]',
  
  -- Assessment (user input)
  notas                   TEXT,
  viabilidad_preliminar   VARCHAR(20),           -- 'alta', 'media', 'baja', 'nula'
  prioridad               INTEGER DEFAULT 0,     -- 0-5 stars
  
  -- Relationships
  informe_id              UUID REFERENCES informes(id),
  zona_verde_id           UUID REFERENCES zonas_verdes(id),
  user_id                 UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at              TIMESTAMP WITH TIME ZONE,
  updated_at              TIMESTAMP WITH TIME ZONE
)
```

### Key Features

1. **Auto-Generated Codes**: Sequential codes like "INSP-0001", "INSP-0002"
2. **Geographic Context**: Full address information via reverse geocoding
3. **Auto-Calculated Metrics**: Area, perimeter, and orientation computed automatically
4. **Flexible Assessment**: User-defined characteristics and viability ratings
5. **Priority System**: 0-5 star rating for inspection prioritization
6. **Report Integration**: Can be attached to reports as annexes

### Indexes

1. `idx_inspecciones_tejados_codigo` - Fast lookups by code
2. `idx_inspecciones_tejados_informe` - Link to reports
3. `idx_inspecciones_tejados_zona` - Link to green zones
4. `idx_inspecciones_tejados_user` - User ownership
5. `idx_inspecciones_tejados_created` - Sorting by date
6. `idx_inspecciones_tejados_centroide` - Spatial queries (GIST index)

### RLS Policies

- ✅ Public read access
- ✅ Authenticated users can insert
- ✅ Users can update their inspections
- ✅ Users can delete their inspections

### Functions

1. `generate_inspeccion_codigo()` - Auto-generates sequential inspection codes
2. Trigger: `set_inspeccion_codigo` - Runs before insert to set code

---

## How to Apply

### Option A: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `017_create_inspecciones_tejados.sql`
3. Paste and click "Run"
4. Verify success:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE tablename = 'inspecciones_tejados';
   ```
   Expected: 1 row

### Option B: Supabase CLI

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
WHERE tablename = 'inspecciones_tejados';

-- Expected result: 1 row
-- tablename: inspecciones_tejados
-- schemaname: public
```

### Test 2: Verify Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'inspecciones_tejados'
ORDER BY indexname;

-- Expected result: 6+ rows including:
-- idx_inspecciones_tejados_codigo
-- idx_inspecciones_tejados_informe
-- idx_inspecciones_tejados_zona
-- idx_inspecciones_tejados_user
-- idx_inspecciones_tejados_created
-- idx_inspecciones_tejados_centroide
```

### Test 3: Verify Auto-Generated Codes

```sql
-- Insert test record without codigo
INSERT INTO inspecciones_tejados (
  nombre,
  direccion,
  municipio,
  codigo_postal,
  coordenadas,
  area_m2,
  perimetro_m,
  orientacion,
  tipo_cubierta,
  estado_conservacion,
  viabilidad_preliminar,
  prioridad
) VALUES (
  'Test Inspection',
  'Calle Test 123',
  'Madrid',
  '28001',
  '{"type":"Polygon","coordinates":[[[-3.7038,40.4168],[-3.7028,40.4168],[-3.7028,40.4178],[-3.7038,40.4178],[-3.7038,40.4168]]]}',
  100.50,
  40.20,
  'Sur',
  'plana',
  'bueno',
  'alta',
  3
);

-- Verify codigo was auto-generated
SELECT codigo, nombre FROM inspecciones_tejados 
ORDER BY created_at DESC LIMIT 1;

-- Expected: codigo = "INSP-0001"
```

### Test 4: Verify RLS Policies

```sql
SELECT 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'inspecciones_tejados';

-- Expected result: 4 rows
-- Allow public read access (SELECT)
-- Allow authenticated users to insert (INSERT)
-- Allow users to update (UPDATE)
-- Allow users to delete (DELETE)
```

### Test 5: Frontend Integration Test

```bash
1. Run frontend app: npm run dev
2. Navigate to "Inspección de Tejados" in sidebar
3. Click on the map to select a rooftop
4. Verify:
   ✅ Address is auto-populated via reverse geocoding
   ✅ Area, perimeter, and orientation are calculated
   ✅ Form appears with pre-filled data
5. Fill in manual fields (tipo_cubierta, estado, etc.)
6. Click "Guardar Inspección"
7. Verify:
   ✅ Inspection appears in the sidebar list
   ✅ Inspection shows on the map with highlight
   ✅ Can be deleted from the list
```

---

## Expected Outcomes

### Before Migration ❌
```javascript
❌ Table 'inspecciones_tejados' does not exist
❌ Cannot save rooftop inspections
❌ No dedicated inspection tool
```

### After Migration ✅
```javascript
✅ Table created successfully
✅ Inspections can be saved and loaded
✅ Auto-generated codes work (INSP-0001, INSP-0002, etc.)
✅ Geographic context available via reverse geocoding
✅ Spatial queries enabled via GIST index
```

---

## Related Files

- **Migration:** `supabase/migrations/017_create_inspecciones_tejados.sql`
- **Frontend types:** `frontend/src/types/index.ts` (InspeccionTejado)
- **Frontend service:** `frontend/src/services/inspeccion-service.ts`
- **Frontend components:**
  - `frontend/src/components/inspecciones/InspeccionTejadosView.tsx`
  - `frontend/src/components/inspecciones/RooftopInspectionMap.tsx`
  - `frontend/src/components/inspecciones/InspectionDataPanel.tsx`
  - `frontend/src/components/inspecciones/InspectionsList.tsx`

---

## Data Model Example

### Sample Inspection Record

```json
{
  "id": "9fe6e2ef-fe61-45e5-a801-60ebbdb293f6",
  "codigo": "INSP-0001",
  "nombre": "Inspección Calle Mayor 25",
  "direccion": "Calle Mayor",
  "numero": "25",
  "municipio": "Madrid",
  "provincia": "Madrid",
  "codigo_postal": "28001",
  "pais": "España",
  "coordenadas": {
    "type": "Polygon",
    "coordinates": [[
      [-3.7038, 40.4168],
      [-3.7028, 40.4168],
      [-3.7028, 40.4178],
      [-3.7038, 40.4178],
      [-3.7038, 40.4168]
    ]]
  },
  "centroide": "POINT(-3.7033 40.4173)",
  "area_m2": 120.50,
  "perimetro_m": 44.00,
  "orientacion": "Sur",
  "tipo_cubierta": "plana",
  "estado_conservacion": "bueno",
  "obstrucciones": [
    {
      "tipo": "chimenea",
      "descripcion": "Chimenea central de 2m de altura"
    }
  ],
  "notas": "Buena exposición solar, sin sombras significativas",
  "viabilidad_preliminar": "alta",
  "prioridad": 4,
  "created_at": "2026-02-13T11:30:00Z"
}
```

---

## Migration Date

**2026-02-13** (Created as part of rooftop inspection feature)

## Status

✅ Ready to apply
✅ Frontend components implemented
✅ Service layer complete
✅ Navigation integrated

## Notes

- Addresses are obtained via reverse geocoding using OpenStreetMap Nominatim API
- Geometry calculations (area, perimeter, orientation) are performed client-side
- GIST index on centroide enables efficient spatial queries
- Inspection codes are sequential and unique
- Can be linked to reports and green zones for comprehensive documentation
