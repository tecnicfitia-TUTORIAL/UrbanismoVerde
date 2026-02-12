-- Migration: Add viabilidad column to analisis table
-- Date: 2026-02-12
-- Purpose: Fix missing viabilidad column that should have been added in migration 008

-- Add viabilidad column if it doesn't exist
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS viabilidad VARCHAR(20) CHECK (viabilidad IN ('alta', 'media', 'baja', 'nula'));

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_analisis_viabilidad ON analisis(viabilidad) WHERE viabilidad IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN analisis.viabilidad IS 'Nivel de viabilidad del proyecto: alta, media, baja, nula (calculado desde green_score)';

-- Verify column was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analisis' AND column_name = 'viabilidad'
  ) THEN
    RAISE NOTICE '✅ Column viabilidad successfully added to analisis table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add viabilidad column';
  END IF;
END $$;
