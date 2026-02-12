# Migration 009: Change INTEGER to BIGINT for Overflow Prevention

## Purpose

Fix numeric field overflow errors when saving analysis for large zones (>300 hectares) by changing INTEGER columns to BIGINT in the `analisis` table.

## Problem

**Error when saving large zone analysis:**
```
numeric field overflow
```

**Cause:** Columns defined as `INTEGER` (limit 2.1B) receive values that exceed this limit.

## Affected Columns

The following 9 columns are changed from INTEGER to BIGINT:

### Monetary Columns:
1. `coste_total_inicial_eur` - Initial total cost in euros
2. `ahorro_anual_eur` - Annual savings in euros
3. `ahorro_25_anos_eur` - 25-year accumulated savings in euros (MOST PRONE TO OVERFLOW)
4. `mantenimiento_anual_eur` - Annual maintenance cost in euros
5. `subvencion_monto_estimado_eur` - Estimated subsidy amount in euros

### Environmental Impact Columns:
6. `co2_capturado_kg_anual` - Annual CO₂ captured in kg
7. `agua_retenida_litros_anual` - Annual water retained in liters
8. `ahorro_energia_kwh_anual` - Annual energy savings in kWh
9. `ahorro_energia_eur_anual` - Annual energy savings in euros

## Overflow Examples

### Zone of 163.5 hectares (1,634,926 m²):
```typescript
coste_total: 1,634,926 × 200 = 326,985,200 ✅ OK
ahorro_25_anos: 326,985,200 / 5 × 25 = 1,634,926,000 ✅ OK
```

### Zone of 500 hectares (5,000,000 m²):
```typescript
coste_total: 5,000,000 × 150 = 750,000,000 ✅ OK
ahorro_25_anos: 750,000,000 / 6 × 25 = 3,125,000,000 ❌ OVERFLOW (>2.1B)
```

**Conclusion:** Zones >300 hectares or with high ROI factors cause overflow.

## Data Type Limits

### INTEGER (before):
- Range: `-2,147,483,648` to `2,147,483,647`
- Limit: **~2.1 billion**

### BIGINT (after):
- Range: `-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`
- Limit: **~9.2 quintillion** (9,000,000,000,000,000,000)

**Capacity:** Can store costs up to **9 quintillion euros** ✅

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `009_change_integer_to_bigint.sql`
4. Paste and click **Run**
5. Wait for the success message: "✅ Migración exitosa: 9 columnas cambiadas a BIGINT"

### Option 2: Supabase CLI

```bash
# Navigate to project root
cd /path/to/UrbanismoVerde

# Apply migration
supabase db push
```

## Verification Tests

### Test 1: Verify Migration Applied

```sql
SELECT 
  column_name, 
  data_type,
  CASE 
    WHEN data_type = 'bigint' THEN '✅'
    ELSE '❌'
  END AS status
FROM information_schema.columns 
WHERE table_name = 'analisis' 
  AND column_name IN (
    'coste_total_inicial_eur',
    'ahorro_25_anos_eur',
    'agua_retenida_litros_anual',
    'co2_capturado_kg_anual',
    'ahorro_anual_eur',
    'mantenimiento_anual_eur',
    'subvencion_monto_estimado_eur',
    'ahorro_energia_kwh_anual',
    'ahorro_energia_eur_anual'
  )
ORDER BY column_name;
```

**Expected result:** All 9 columns should have `data_type = 'bigint'` and `status = '✅'`

### Test 2: Save Analysis for Large Zone

1. Analyze zone >300 hectares
2. Click "Guardar Análisis"
3. Enter name "Test BIGINT"
4. Click "Guardar"

**Expected result:**
- ✅ Toast: "✅ Análisis guardado correctamente"
- ✅ NO error "numeric field overflow"
- ✅ Save successful

### Test 3: Verify Large Values Saved

```sql
SELECT 
  zv.nombre,
  a.coste_total_inicial_eur,
  a.ahorro_25_anos_eur,
  a.agua_retenida_litros_anual,
  a.co2_capturado_kg_anual
FROM analisis a
LEFT JOIN zonas_verdes zv ON a.zona_verde_id = zv.id
ORDER BY a.created_at DESC
LIMIT 1;
```

**Expected result:** Values can be >2.1B

### Test 4: Insert Extreme Value Manually

```sql
-- Test inserting 5 billion to verify BIGINT limit
INSERT INTO analisis (
  zona_verde_id,
  green_score,
  viabilidad,
  coste_total_inicial_eur,
  ahorro_25_anos_eur
) VALUES (
  (SELECT id FROM zonas_verdes LIMIT 1),
  75,
  'media',
  5000000000,  -- 5 billion
  125000000000  -- 125 billion
);

-- Verify it was saved
SELECT coste_total_inicial_eur, ahorro_25_anos_eur 
FROM analisis 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected result:** Very large values saved without error

## Rollback

⚠️ **WARNING:** Only execute rollback if there are NO records with values >2.1B.

To rollback this migration:

1. Open Supabase Dashboard SQL Editor
2. Copy the contents of `009_change_integer_to_bigint_rollback.sql`
3. Paste and click **Run**

This will change columns back to INTEGER type, but will **FAIL** if any values exceed the INTEGER limit.

## Benefits

✅ Supports zones of any size (up to 1000+ hectares)
✅ Prevents overflow in ahorro_25_anos
✅ Supports calculations with high ROI
✅ Safe migration (no data loss)
✅ Compatible with existing analyses
✅ Does not break existing queries

## Impact

**BEFORE:**
- ❌ Zone >300 ha → numeric overflow
- ❌ Analysis NOT saved
- ❌ Error in console

**AFTER:**
- ✅ Zone >1000 ha → saved successfully
- ✅ Values >2.1B → stored correctly
- ✅ ahorro_25_anos: 3B+ → ✅ OK
- ✅ NO more overflow errors

## Related Files

- Migration: `supabase/migrations/009_change_integer_to_bigint.sql`
- Rollback: `supabase/migrations/009_change_integer_to_bigint_rollback.sql`
- Original columns defined in:
  - `supabase/migrations/005_migrate_legacy_analysis.sql` (lines 14-40)
  - `supabase/migrations/007_add_missing_roi_columns.sql` (lines 13-16)

## Migration Date

**2026-02-12**

## Status

✅ Ready to apply
