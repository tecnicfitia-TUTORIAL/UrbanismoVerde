-- ============================================
-- MIGRATION: Add AI analysis fields to inspecciones_tejados
-- Version: 018
-- Date: 2026-02-13
-- ============================================

-- Add AI analysis columns
ALTER TABLE inspecciones_tejados
ADD COLUMN IF NOT EXISTS analisis_ia_resultado JSONB,
ADD COLUMN IF NOT EXISTS analisis_ia_confianza INTEGER CHECK (analisis_ia_confianza >= 0 AND analisis_ia_confianza <= 100),
ADD COLUMN IF NOT EXISTS imagen_analizada_url TEXT,
ADD COLUMN IF NOT EXISTS requiere_revision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revisado_por_usuario BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_analisis_ia TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_confianza 
  ON inspecciones_tejados(analisis_ia_confianza);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_requiere_revision 
  ON inspecciones_tejados(requiere_revision) WHERE requiere_revision = true;

-- Add comments
COMMENT ON COLUMN inspecciones_tejados.analisis_ia_resultado IS 
  'Complete AI analysis result in JSON format including detected characteristics';
COMMENT ON COLUMN inspecciones_tejados.analisis_ia_confianza IS 
  'AI confidence level (0-100%). Values < 70% should be marked for review';
COMMENT ON COLUMN inspecciones_tejados.imagen_analizada_url IS 
  'URL of the satellite image that was analyzed by AI';
COMMENT ON COLUMN inspecciones_tejados.requiere_revision IS 
  'Auto-set to true if AI confidence < 70% or user manually marks for review';
COMMENT ON COLUMN inspecciones_tejados.revisado_por_usuario IS 
  'Set to true after user has reviewed and confirmed/edited AI results';
COMMENT ON COLUMN inspecciones_tejados.fecha_analisis_ia IS 
  'Timestamp when AI analysis was performed';

-- Trigger to auto-set requiere_revision based on confidence
CREATE OR REPLACE FUNCTION set_requiere_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.analisis_ia_confianza IS NOT NULL AND NEW.analisis_ia_confianza < 70 THEN
    NEW.requiere_revision := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_requiere_revision
  BEFORE INSERT OR UPDATE OF analisis_ia_confianza ON inspecciones_tejados
  FOR EACH ROW
  EXECUTE FUNCTION set_requiere_revision();

-- View for inspections requiring review
CREATE OR REPLACE VIEW inspecciones_pendientes_revision AS
SELECT 
  id,
  codigo,
  nombre,
  direccion,
  municipio,
  area_m2,
  analisis_ia_confianza,
  tipo_cubierta,
  estado_conservacion,
  fecha_analisis_ia,
  created_at
FROM inspecciones_tejados
WHERE requiere_revision = true 
  AND revisado_por_usuario = false
ORDER BY analisis_ia_confianza ASC, created_at DESC;

COMMENT ON VIEW inspecciones_pendientes_revision IS 
  'Inspections that require manual review (low AI confidence or user-marked)';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 018: AI analysis fields added to inspecciones_tejados successfully';
END
$$;
