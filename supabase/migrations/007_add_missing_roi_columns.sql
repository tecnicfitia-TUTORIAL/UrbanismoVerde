-- Migración: Agregar columnas ROI faltantes
-- Fecha: 2026-02-12
-- Propósito: Completar estructura tabla analisis con campos de ROI

-- 1. Agregar columnas de ROI faltantes
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS roi_porcentaje DECIMAL(5,2) DEFAULT 6.67;

ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS amortizacion_anos DECIMAL(4,1) DEFAULT 15.0;

ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS ahorro_anual_eur INTEGER;

ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS ahorro_25_anos_eur INTEGER;

-- 2. Comentarios descriptivos
COMMENT ON COLUMN analisis.roi_porcentaje IS 'Retorno de inversión anual en porcentaje (ej: 6.67%)';
COMMENT ON COLUMN analisis.amortizacion_anos IS 'Años necesarios para amortizar la inversión inicial';
COMMENT ON COLUMN analisis.ahorro_anual_eur IS 'Ahorro económico anual total en euros (energía + gestión agua)';
COMMENT ON COLUMN analisis.ahorro_25_anos_eur IS 'Ahorro acumulado proyectado a 25 años (vida útil)';

-- 3. Limpiar columna duplicada zona_id (si existe)
-- Migrar datos de zona_id a zona_verde_id antes de eliminar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analisis' AND column_name = 'zona_id'
  ) THEN
    -- Migrar datos de zona_id a zona_verde_id
    UPDATE analisis
    SET zona_verde_id = zona_id
    WHERE zona_id IS NOT NULL AND zona_verde_id IS NULL;
    
    -- Eliminar columna vieja
    ALTER TABLE analisis DROP COLUMN zona_id;
    
    RAISE NOTICE 'Columna zona_id migrada y eliminada';
  ELSE
    RAISE NOTICE 'Columna zona_id no existe, skip';
  END IF;
END $$;

-- 4. Crear índice para mejorar queries de ROI
CREATE INDEX IF NOT EXISTS idx_analisis_roi ON analisis(roi_porcentaje) 
WHERE roi_porcentaje IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analisis_ahorro ON analisis(ahorro_anual_eur) 
WHERE ahorro_anual_eur IS NOT NULL;

-- 5. Calcular valores ROI para análisis existentes (si los hay)
UPDATE analisis
SET 
  ahorro_anual_eur = COALESCE(ahorro_energia_eur_anual, 0),
  ahorro_25_anos_eur = COALESCE(ahorro_energia_eur_anual, 0) * 25,
  roi_porcentaje = CASE 
    WHEN coste_total_inicial_eur > 0 AND ahorro_energia_eur_anual > 0 
    THEN ROUND((ahorro_energia_eur_anual::NUMERIC / coste_total_inicial_eur::NUMERIC) * 100, 2)
    ELSE 6.67
  END,
  amortizacion_anos = CASE 
    WHEN coste_total_inicial_eur > 0 AND ahorro_energia_eur_anual > 0 
    THEN ROUND((coste_total_inicial_eur::NUMERIC / ahorro_energia_eur_anual::NUMERIC), 1)
    ELSE 15.0
  END
WHERE roi_porcentaje IS NULL 
  AND coste_total_inicial_eur IS NOT NULL;

-- 6. Verificación final
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'analisis' 
    AND column_name IN ('roi_porcentaje', 'amortizacion_anos', 'ahorro_anual_eur', 'ahorro_25_anos_eur');
  
  IF col_count = 4 THEN
    RAISE NOTICE '✅ Migración exitosa: 4 columnas ROI agregadas';
  ELSE
    RAISE EXCEPTION '❌ Error: Solo % columnas ROI detectadas', col_count;
  END IF;
END $$;
