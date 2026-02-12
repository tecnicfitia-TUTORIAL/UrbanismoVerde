# Database Migrations: Fix Analysis Save Errors

## Overview

These migrations fix numeric field overflow issues and RLS policy violations when saving analysis data to Supabase.

## Problem

1. **Numeric Field Overflow**: INTEGER columns (limit: ~2.1 billion) couldn't handle large values from environmental calculations
2. **RLS Policy Violations**: Row Level Security was enabled without proper public policies defined

## Solution

### Migration 012: Recreate `analisis` table with BIGINT

This migration drops and recreates the `analisis` table with BIGINT columns for all numeric fields that can exceed INTEGER limits.

**⚠️ WARNING**: This migration will drop the existing `analisis` table. If you have important data, create a backup first.

### Migration 013: Add public RLS policies

This migration adds public policies for SELECT/INSERT/UPDATE/DELETE operations on the `analisis` table, allowing testing without authentication.

**Note**: For production environments, consider implementing more restrictive policies based on user authentication.

## How to Apply Migrations

### Option 1: Using Supabase SQL Editor (Recommended)

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `012_recreate_analisis_with_bigint.sql`
4. Click **Run** to execute
5. Copy and paste the contents of `013_rls_policies_analisis.sql`
6. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
# Apply migrations in order
supabase db push
```

## Verification

After applying migrations, verify the changes:

```sql
-- Check column data types
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'bigint' THEN '✅'
    WHEN data_type = 'integer' THEN '❌'
    ELSE data_type
  END AS status
FROM information_schema.columns
WHERE table_name = 'analisis'
  AND (column_name LIKE '%eur%' OR column_name LIKE '%anual%')
ORDER BY column_name;

-- Check RLS policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'analisis';

-- Verify data can be inserted
SELECT COUNT(*) FROM analisis;
```

## Frontend Changes

The frontend now includes validation utilities in `src/utils/validation.ts` that:

1. Validate and sanitize numeric values before saving
2. Ensure values are within practical limits
3. Round integer values appropriately for BIGINT columns
4. Validate enums and required fields

These validations are automatically applied in:
- `frontend/src/services/analysis-storage.ts` - Before saving analysis data
- `frontend/src/services/zona-storage.ts` - Before saving zone data

## Expected Impact

After applying these changes:
- ✅ Analysis data saves correctly without numeric overflow errors
- ✅ Large area calculations (>300,000 m²) work properly
- ✅ 25-year savings calculations exceeding 2 billion work correctly
- ✅ No RLS policy violations when saving data
- ✅ Frontend validates data before sending to database

## Rollback (if needed)

If you need to rollback migration 009, use:

```sql
-- See supabase/migrations/009_change_integer_to_bigint_rollback.sql
```

Note: There is no rollback for migrations 012 and 013 as they recreate the table from scratch.
