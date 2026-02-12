# Migration 011: Add viabilidad Column to analisis Table

## Overview

This migration adds the missing `viabilidad` column to the `analisis` table. This column should have been added in migration 008 but was never executed in production.

## Problem

The TypeScript code in `ZoneDetailContent.tsx` queries the `analisis` table and expects a `viabilidad` column:

```typescript
interface AnalisisData {
  viabilidad: 'alta' | 'media' | 'baja' | 'nula';
  // ...
}
```

However, this column doesn't exist in the database, causing a **406 Not Acceptable** error.

## Solution

Add the `viabilidad` column with the correct type and constraints:
- Type: `VARCHAR(20)`
- Allowed values: 'alta', 'media', 'baja', 'nula'
- Indexed for query performance

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy contents of `011_add_viabilidad_column_to_analisis.sql`
4. Click **Run**

### Option 2: Supabase CLI

```bash
supabase migration up 011_add_viabilidad_column_to_analisis.sql
```

## Verification

After running the migration, verify with:

```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'analisis' 
  AND column_name = 'viabilidad';
```

**Expected result:**
```
column_name | data_type         | udt_name
------------|-------------------|----------
viabilidad  | character varying | varchar
```

## Testing

1. Reload the application
2. Navigate to **Mis Zonas** > Select a zone
3. Check browser console - the 406 error should be gone
4. Verify analysis data loads correctly

## Rollback

If needed, rollback with:

```sql
ALTER TABLE analisis DROP COLUMN IF EXISTS viabilidad;
DROP INDEX IF EXISTS idx_analisis_viabilidad;
```
