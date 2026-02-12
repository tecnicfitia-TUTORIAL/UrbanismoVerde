-- Rollback: Eliminar columnas ROI agregadas

ALTER TABLE analisis DROP COLUMN IF EXISTS roi_porcentaje;
ALTER TABLE analisis DROP COLUMN IF EXISTS amortizacion_anos;
ALTER TABLE analisis DROP COLUMN IF EXISTS ahorro_anual_eur;
ALTER TABLE analisis DROP COLUMN IF EXISTS ahorro_25_anos_eur;

DROP INDEX IF EXISTS idx_analisis_roi;
DROP INDEX IF EXISTS idx_analisis_ahorro;
