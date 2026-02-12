-- Migración: Cambiar columnas INTEGER a BIGINT para evitar overflow
-- Fecha: 2026-02-12
-- Propósito: Soportar valores >2.1B en análisis de zonas grandes

-- 1. Cambiar columnas monetarias a BIGINT
ALTER TABLE analisis 
ALTER COLUMN coste_total_inicial_eur TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN ahorro_anual_eur TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN ahorro_25_anos_eur TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN mantenimiento_anual_eur TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN subvencion_monto_estimado_eur TYPE BIGINT;

-- 2. Cambiar columnas de impacto ambiental a BIGINT
ALTER TABLE analisis 
ALTER COLUMN co2_capturado_kg_anual TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN agua_retenida_litros_anual TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN ahorro_energia_kwh_anual TYPE BIGINT;

ALTER TABLE analisis 
ALTER COLUMN ahorro_energia_eur_anual TYPE BIGINT;

-- 3. Comentarios descriptivos
COMMENT ON COLUMN analisis.coste_total_inicial_eur IS 'Coste total inicial en euros (BIGINT para soportar >2.1B)';
COMMENT ON COLUMN analisis.ahorro_25_anos_eur IS 'Ahorro acumulado a 25 años en euros (BIGINT para evitar overflow)';
COMMENT ON COLUMN analisis.agua_retenida_litros_anual IS 'Agua retenida anual en litros (BIGINT para zonas >300 ha)';
COMMENT ON COLUMN analisis.co2_capturado_kg_anual IS 'CO₂ capturado anual en kg (BIGINT para zonas muy grandes)';

-- 4. Verificación
DO $$
DECLARE
  bigint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bigint_count
  FROM information_schema.columns 
  WHERE table_name = 'analisis' 
    AND data_type = 'bigint'
    AND column_name IN (
      'coste_total_inicial_eur',
      'ahorro_25_anos_eur',
      'agua_retenida_litros_anual',
      'co2_capturado_kg_anual',
      'ahorro_anual_eur',
      'mantenimiento_anual_eur',
      'subvencion_monto_estimado_eur',
      'ahorro_energia_kwh_anual',
      'ahorro_energia_eur_anual'
    );
  
  IF bigint_count = 9 THEN
    RAISE NOTICE '✅ Migración exitosa: 9 columnas cambiadas a BIGINT';
  ELSE
    RAISE EXCEPTION '❌ Error: Solo % columnas son BIGINT (esperado: 9)', bigint_count;
  END IF;
END $$;
