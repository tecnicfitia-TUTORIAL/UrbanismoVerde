-- Migration: Add green_score, viabilidad, and recomendaciones to analisis table
-- Date: 2026-02-12
-- Purpose: Store analysis display fields in individual columns instead of JSON in notas

-- Add missing columns to analisis table
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS green_score DECIMAL(5,2) CHECK (green_score >= 0 AND green_score <= 100);

ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS viabilidad VARCHAR(20) CHECK (viabilidad IN ('alta', 'media', 'baja', 'nula'));

ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS recomendaciones JSONB;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analisis_green_score ON analisis(green_score) WHERE green_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analisis_viabilidad ON analisis(viabilidad) WHERE viabilidad IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN analisis.green_score IS 'Puntuación verde general del análisis (0-100)';
COMMENT ON COLUMN analisis.viabilidad IS 'Nivel de viabilidad del proyecto: alta, media, baja, nula';
COMMENT ON COLUMN analisis.recomendaciones IS 'Array de recomendaciones para el proyecto en formato JSON';
