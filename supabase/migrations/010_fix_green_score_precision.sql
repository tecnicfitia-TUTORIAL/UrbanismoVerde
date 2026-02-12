-- Migración: Aumentar precisión de green_score para soportar 0-100
-- Fecha: 2026-02-12
-- Propósito: Permitir valores de Green Score hasta 100 (actualmente limitado a 9.99)

-- 1. Cambiar green_score a NUMERIC(5,2)
ALTER TABLE analisis 
ALTER COLUMN green_score TYPE NUMERIC(5,2);

-- 2. Comentario descriptivo
COMMENT ON COLUMN analisis.green_score IS 'Puntuación de viabilidad verde (0-100), donde >70=alta, 41-70=media, <40=baja';

-- 3. Verificación
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
    RAISE NOTICE '   Rango: -999.99 a 999.99 (suficiente para 0-100)';
  ELSE
    RAISE EXCEPTION '❌ Error: green_score tiene precisión % y escala % (esperado: 5, 2)', precision_val, scale_val;
  END IF;
END $$;

-- 4. Opcional: Agregar constraint para asegurar valores 0-100
ALTER TABLE analisis 
ADD CONSTRAINT green_score_range CHECK (green_score >= 0 AND green_score <= 100);

COMMENT ON CONSTRAINT green_score_range ON analisis IS 'Asegura que Green Score esté en rango válido 0-100';
