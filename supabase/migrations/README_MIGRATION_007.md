# Migration 007: Add Missing ROI Columns

## Overview

This migration adds 4 missing ROI (Return on Investment) columns to the `analisis` table:
- `roi_porcentaje` - Annual return on investment percentage
- `amortizacion_anos` - Years needed to amortize initial investment
- `ahorro_anual_eur` - Annual total economic savings in euros
- `ahorro_25_anos_eur` - Accumulated savings projected over 25 years

## Prerequisites

- Migration 005 (`005_migrate_legacy_analysis.sql`) should have been attempted (even if it failed)
- Access to Supabase dashboard or CLI
- PostgreSQL 12 or higher

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `007_add_missing_roi_columns.sql`
4. Paste and click **Run**
5. Wait for the success message: "✅ Migración exitosa: 4 columnas ROI agregadas"

### Option 2: Supabase CLI

```bash
# Navigate to project root
cd /path/to/UrbanismoVerde

# Apply migration
supabase db push
```

## Verification Tests

After applying the migration, run these SQL queries to verify:

### Test 1: Verify Columns Were Created

```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'analisis' 
  AND column_name IN ('roi_porcentaje', 'amortizacion_anos', 'ahorro_anual_eur', 'ahorro_25_anos_eur')
ORDER BY column_name;
```

**Expected Result:** 4 rows showing the new columns

### Test 2: Verify Indexes Were Created

```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'analisis'
  AND indexname IN ('idx_analisis_roi', 'idx_analisis_ahorro');
```

**Expected Result:** 2 indexes

### Test 3: Verify zona_id Was Removed (if it existed)

```sql
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'analisis' 
  AND column_name = 'zona_id';
```

**Expected Result:** 0 (column removed)

### Test 4: Test Complete Query

```sql
SELECT 
  a.id,
  zv.nombre AS zona,
  a.coste_total_inicial_eur,
  a.roi_porcentaje,
  a.amortizacion_anos,
  a.ahorro_anual_eur,
  a.ahorro_25_anos_eur
FROM analisis a
LEFT JOIN zonas_verdes zv ON a.zona_verde_id = zv.id
ORDER BY a.created_at DESC
LIMIT 10;
```

**Expected Result:** Query executes without errors, showing all ROI columns

### Test 5: Database Health Check

```sql
WITH stats AS (
  SELECT 
    COUNT(*) AS total_zonas,
    (SELECT COUNT(*) FROM analisis) AS total_analisis,
    (SELECT COUNT(*) FROM analisis WHERE roi_porcentaje IS NOT NULL) AS analisis_con_roi
  FROM zonas_verdes
)
SELECT 
  '📊 Zonas guardadas' AS metrica,
  total_zonas::TEXT AS valor
FROM stats

UNION ALL

SELECT 
  '🔬 Análisis guardados' AS metrica,
  total_analisis::TEXT AS valor
FROM stats

UNION ALL

SELECT 
  '💰 Análisis con ROI calculado' AS metrica,
  analisis_con_roi::TEXT AS valor
FROM stats;
```

**Expected Result:** Shows statistics for zones and analyses with ROI data

## Rollback

If you need to rollback this migration:

1. Go to Supabase SQL Editor
2. Copy contents of `007_add_missing_roi_columns_rollback.sql`
3. Execute

**⚠️ Warning:** This will delete the ROI columns and their data permanently!

## Frontend Changes

This migration is accompanied by frontend changes in `frontend/src/services/analysis-storage.ts` that now properly insert ROI values into these columns when saving analysis data.

## Migration Features

- ✅ **Idempotent**: Can be run multiple times safely (uses `IF NOT EXISTS`)
- ✅ **Data Migration**: Automatically calculates ROI for existing records
- ✅ **Cleanup**: Removes duplicate `zona_id` column if present
- ✅ **Performance**: Creates indexes for faster queries
- ✅ **Verification**: Built-in check ensures all 4 columns were created
- ✅ **Documentation**: Adds comments to database schema

## Expected Impact

After applying this migration:

1. ✅ SQL errors when saving analysis data will be resolved
2. ✅ Dashboard can display ROI information correctly
3. ✅ All analysis data is stored in structured columns
4. ✅ Database queries are faster due to new indexes
5. ✅ Data integrity is improved

## Troubleshooting

### Error: Column already exists

This is fine - the migration uses `IF NOT EXISTS` so it will skip existing columns.

### Error: Permission denied

Ensure you're running the migration with appropriate database permissions (typically the project owner or service_role).

### ROI values are NULL

This is expected for new records until the frontend creates analyses with ROI data. Existing records should have calculated default values.

## Related Files

- Migration: `supabase/migrations/007_add_missing_roi_columns.sql`
- Rollback: `supabase/migrations/007_add_missing_roi_columns_rollback.sql`
- Frontend Code: `frontend/src/services/analysis-storage.ts`
- Previous Migration: `supabase/migrations/005_migrate_legacy_analysis.sql`

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Verify PostgreSQL version is 12+
3. Ensure previous migrations (001-006) were applied
4. Review the SQL error message for specifics

For more information, see the main problem statement in the PR description.
