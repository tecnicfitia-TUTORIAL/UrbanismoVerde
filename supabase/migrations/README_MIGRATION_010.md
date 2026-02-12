# Migration 010: Fix green_score Precision for Values up to 100

## Purpose

Fix numeric field overflow errors when saving analysis with Green Score values by changing the `green_score` column precision from `NUMERIC(3,2)` to `NUMERIC(5,2)`.

## Problem

**Error when saving analysis:**
```
numeric field overflow
```

**Cause:** The column `green_score` is defined as `NUMERIC(3,2)` which only allows values up to **9.99**.

## Verification

```sql
SELECT column_name, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'analisis' AND column_name = 'green_score';
```

**Current Result:**
```
column_name | numeric_precision | numeric_scale
------------|-------------------|---------------
green_score | 3                 | 2
```

**Current Limit:** -9.99 to 9.99

**Actual Values:** 0 to 100 (Green Score is a 0-100 viability score)

**Problem:** 64.0 > 9.99 → OVERFLOW

## Analysis

Green Score is a viability metric that ranges from **0 to 100**:
- 0-40: Low viability
- 41-70: Medium viability
- 71-100: High viability

**Examples of real values:**
- Green Score: 64.0 ❌ Doesn't fit in NUMERIC(3,2)
- Green Score: 85.5 ❌ Doesn't fit
- Green Score: 100.0 ❌ Doesn't fit

## Solution

Change `green_score` from `NUMERIC(3,2)` to `NUMERIC(5,2)`:
- **NUMERIC(3,2)**: Max 9.99 ❌
- **NUMERIC(5,2)**: Max 999.99 ✅ (sufficient for 0-100)

## Implementation

### File: `supabase/migrations/010_fix_green_score_precision.sql`

```sql
-- Change green_score to NUMERIC(5,2)
ALTER TABLE analisis 
ALTER COLUMN green_score TYPE NUMERIC(5,2);

-- Add descriptive comment
COMMENT ON COLUMN analisis.green_score IS 'Puntuación de viabilidad verde (0-100), donde >70=alta, 41-70=media, <40=baja';

-- Verification
DO $$
DECLARE
  precision_val INTEGER;
  scale_val INTEGER;
BEGIN
  SELECT numeric_precision, numeric_scale INTO precision_val, scale_val
  FROM information_schema.columns 
  WHERE table_name = 'analisis' AND column_name = 'green_score';
  
  IF precision_val = 5 AND scale_val = 2 THEN
    RAISE NOTICE '✅ Migración exitosa: green_score ahora es NUMERIC(5,2)';
  ELSE
    RAISE EXCEPTION '❌ Error: green_score tiene precisión % y escala %', precision_val, scale_val;
  END IF;
END $$;

-- Add constraint to ensure valid range 0-100
ALTER TABLE analisis 
ADD CONSTRAINT green_score_range CHECK (green_score >= 0 AND green_score <= 100);
```

### Rollback (if needed)

**File:** `supabase/migrations/010_fix_green_score_precision_rollback.sql`

```sql
-- ⚠️ WARNING: Only execute if there are NO values >9.99 in green_score

-- Remove constraint
ALTER TABLE analisis DROP CONSTRAINT IF EXISTS green_score_range;

-- Revert to NUMERIC(3,2)
ALTER TABLE analisis 
ALTER COLUMN green_score TYPE NUMERIC(3,2);
```

## Testing

### Test 1: Verify migration applied

```sql
SELECT 
  column_name, 
  data_type,
  numeric_precision,
  numeric_scale,
  CASE 
    WHEN numeric_precision = 5 AND numeric_scale = 2 THEN '✅'
    ELSE '❌'
  END AS status
FROM information_schema.columns 
WHERE table_name = 'analisis' 
  AND column_name = 'green_score';
```

**Expected result:**
```
column_name | data_type | precision | scale | status
------------|-----------|-----------|-------|-------
green_score | numeric   | 5         | 2     | ✅
```

### Test 2: Verify range constraint

```sql
-- View constraints on analisis table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'analisis'::regclass
  AND conname = 'green_score_range';
```

**Expected result:**
```
constraint_name    | definition
-------------------|----------------------------------
green_score_range  | CHECK (green_score >= 0 AND green_score <= 100)
```

### Test 3: Save analysis with high Green Score

**Steps:**
1. Perform analysis on map
2. View modal with Green Score (e.g., 64.0)
3. Click "Guardar Análisis"
4. Enter name "Test Green Score 64"
5. Click "Guardar"

**Expected result:**
```
✅ Toast: "✅ Análisis guardado correctamente"
✅ NO error "numeric field overflow"
✅ Successfully saved
```

### Test 4: Verify saved value in database

```sql
SELECT 
  zv.nombre,
  a.green_score,
  a.viabilidad
FROM analisis a
LEFT JOIN zonas_verdes zv ON a.zona_verde_id = zv.id
WHERE zv.nombre = 'Test Green Score 64';
```

**Expected result:**
```
nombre                | green_score | viabilidad
----------------------|-------------|------------
Test Green Score 64   | 64.00       | media

✅ Value 64.00 saved correctly (previously caused overflow)
```

### Test 5: Test extreme values

```sql
-- Insert analysis with Green Score = 100
UPDATE analisis
SET green_score = 100.00
WHERE zona_verde_id = (
  SELECT id FROM zonas_verdes 
  WHERE nombre = 'Test Green Score 64'
);

-- Verify
SELECT green_score 
FROM analisis 
WHERE zona_verde_id = (
  SELECT id FROM zonas_verdes 
  WHERE nombre = 'Test Green Score 64'
);
```

**Expected result:**
```
green_score
-----------
100.00

✅ Maximum value (100) saved correctly
```

### Test 6: Test range constraint (should fail)

```sql
-- Try to insert value out of range (should error)
UPDATE analisis
SET green_score = 150.00
WHERE zona_verde_id = (
  SELECT id FROM zonas_verdes LIMIT 1
);

-- Should return error:
-- ERROR: new row violates check constraint "green_score_range"
-- DETAIL: Failing row contains (green_score = 150.00)
```

**Expected result:**
```
❌ ERROR: check constraint "green_score_range" violated
✅ Constraint works correctly (rejects 150 because >100)
```

## Data Type Ranges

### BEFORE (NUMERIC 3,2):
```
Precision: 3 total digits
Scale: 2 decimal places
Range: -9.99 to 9.99

Examples:
✅ 5.50 (OK)
✅ 9.99 (OK, limit)
❌ 10.0 (OVERFLOW)
❌ 64.0 (OVERFLOW)
❌ 100.0 (OVERFLOW)
```

### AFTER (NUMERIC 5,2):
```
Precision: 5 total digits
Scale: 2 decimal places
Range: -999.99 to 999.99

Examples:
✅ 5.50 (OK)
✅ 64.00 (OK)
✅ 85.50 (OK)
✅ 100.00 (OK)
✅ 999.99 (OK, limit)
```

## Benefits

✅ Supports full Green Score range (0-100)
✅ Maintains 2 decimal places of precision (e.g., 64.75)
✅ Constraint ensures valid values (≤ 100)
✅ Safe migration (doesn't lose existing data)
✅ Compatible with current analyses
✅ Doesn't break existing queries

## Typical Green Score Values

```
Low Viability (0-40):
- 15.50: Very arid zone, no vegetation
- 25.00: Compacted soil, low permeability
- 38.75: Insufficient sun exposure

Medium Viability (41-70):
- 45.00: Urban zone with potential
- 52.50: Adequate soil, good exposure
- 64.00: Good viability, requires minor improvements

High Viability (71-100):
- 75.00: Excellent viability
- 85.50: Optimal conditions
- 95.00: Ideal zone for green roof
```

## Expected Result

```
BEFORE:
❌ Green Score 64.0 → numeric field overflow
❌ Analysis NOT saved
❌ Limited to scores < 10

AFTER:
✅ Green Score 64.0 → saved OK
✅ Complete analysis saved
✅ Supports scores 0-100
✅ Constraint prevents invalid values (>100)
✅ 2 decimal precision preserved
```

## Important Note

This change is **critical** because Green Score is the **main indicator** of the analysis. Without being able to save realistic values (40-90), the system cannot store valid analyses.

**With this migration, saving should work for 100% of real use cases.**

## Relationship with Migration 008

Note: Migration 008 (`008_add_analysis_display_columns.sql`) was intended to add the `green_score` column with `DECIMAL(5,2)`. However, if the column already existed in the database with a different precision, the `ADD COLUMN IF NOT EXISTS` statement would not alter the existing column. This migration (010) explicitly uses `ALTER COLUMN TYPE` to ensure the precision is corrected regardless of the current state.

## How to Apply

### Using Supabase CLI:
```bash
supabase migration up
```

### Using Supabase Dashboard:
1. Go to Database > Migrations
2. Upload `010_fix_green_score_precision.sql`
3. Apply migration

### Verify application:
```sql
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'analisis' AND column_name = 'green_score';
```

Expected: `numeric_precision = 5`, `numeric_scale = 2`
