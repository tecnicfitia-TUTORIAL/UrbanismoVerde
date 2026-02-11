-- Migración para compatibilidad retroactiva de análisis antiguos
-- Fase 2: Agregar campos faltantes con valores calculados

-- ==========================================
-- 1. Agregar columnas nuevas (si no existen)
-- ==========================================

-- Factor verde y normativa
ALTER TABLE analisis 
ADD COLUMN IF NOT EXISTS factor_verde DECIMAL(3,2) DEFAULT 0.65;

-- Beneficios ecosistémicos
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS co2_capturado_kg_anual INTEGER,
ADD COLUMN IF NOT EXISTS agua_retenida_litros_anual INTEGER,
ADD COLUMN IF NOT EXISTS reduccion_temperatura_c DECIMAL(3,1) DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS ahorro_energia_kwh_anual INTEGER,
ADD COLUMN IF NOT EXISTS ahorro_energia_eur_anual INTEGER;

-- Presupuesto detallado
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS coste_total_inicial_eur INTEGER,
ADD COLUMN IF NOT EXISTS presupuesto_desglose JSONB,
ADD COLUMN IF NOT EXISTS mantenimiento_anual_eur INTEGER,
ADD COLUMN IF NOT EXISTS coste_por_m2_eur INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS vida_util_anos INTEGER DEFAULT 25;

-- ROI ambiental
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS roi_porcentaje DECIMAL(5,2) DEFAULT 6.67,
ADD COLUMN IF NOT EXISTS amortizacion_anos DECIMAL(4,1) DEFAULT 15.0,
ADD COLUMN IF NOT EXISTS ahorro_anual_eur INTEGER,
ADD COLUMN IF NOT EXISTS ahorro_25_anos_eur INTEGER;

-- Subvenciones
ALTER TABLE analisis
ADD COLUMN IF NOT EXISTS subvencion_elegible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subvencion_porcentaje INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS subvencion_programa VARCHAR(255) DEFAULT 'PECV Madrid 2025',
ADD COLUMN IF NOT EXISTS subvencion_monto_estimado_eur INTEGER;

-- ==========================================
-- 2. Calcular valores para registros existentes
-- ==========================================

UPDATE analisis
SET 
  -- Beneficios ecosistémicos calculados
  co2_capturado_kg_anual = (
    SELECT ROUND(zv.area_m2 * 5)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  agua_retenida_litros_anual = (
    SELECT ROUND(zv.area_m2 * 240)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  ahorro_energia_kwh_anual = (
    SELECT ROUND(zv.area_m2 * 40)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  ahorro_energia_eur_anual = (
    SELECT ROUND(zv.area_m2 * 10)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  
  -- Presupuesto calculado
  coste_total_inicial_eur = (
    SELECT ROUND(zv.area_m2 * 150)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  presupuesto_desglose = (
    SELECT jsonb_build_object(
      'sustrato_eur', ROUND(zv.area_m2 * 45)::INTEGER,
      'drenaje_eur', ROUND(zv.area_m2 * 25)::INTEGER,
      'membrana_impermeable_eur', ROUND(zv.area_m2 * 15)::INTEGER,
      'plantas_eur', ROUND(zv.area_m2 * 45)::INTEGER,
      'instalacion_eur', ROUND(zv.area_m2 * 20)::INTEGER
    )
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  mantenimiento_anual_eur = (
    SELECT ROUND(zv.area_m2 * 8)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  
  -- ROI calculado
  ahorro_anual_eur = (
    SELECT ROUND(zv.area_m2 * 10)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  ahorro_25_anos_eur = (
    SELECT ROUND(zv.area_m2 * 250)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  ),
  
  -- Subvención calculada
  subvencion_monto_estimado_eur = (
    SELECT ROUND(zv.area_m2 * 75)::INTEGER
    FROM zonas_verdes zv
    WHERE zv.id = analisis.zona_verde_id
  )
WHERE co2_capturado_kg_anual IS NULL;

-- ==========================================
-- 3. Crear vista para compatibilidad con frontend
-- ==========================================

CREATE OR REPLACE VIEW analisis_completo AS
SELECT 
  a.*,
  zv.nombre AS zona_nombre,
  zv.area_m2,
  zv.coordenadas,
  zv.estado,
  
  -- Valores calculados con fallback
  COALESCE(a.factor_verde, 0.65) AS factor_verde_calculado,
  COALESCE(a.co2_capturado_kg_anual, ROUND(zv.area_m2 * 5)::INTEGER) AS co2_anual,
  COALESCE(a.agua_retenida_litros_anual, ROUND(zv.area_m2 * 240)::INTEGER) AS agua_anual,
  COALESCE(a.ahorro_energia_eur_anual, ROUND(zv.area_m2 * 10)::INTEGER) AS ahorro_energia_anual
FROM analisis a
INNER JOIN zonas_verdes zv ON zv.id = a.zona_verde_id
ORDER BY a.created_at DESC;

-- ==========================================
-- 4. Crear índices para optimización
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_analisis_co2 ON analisis(co2_capturado_kg_anual);
CREATE INDEX IF NOT EXISTS idx_analisis_roi ON analisis(roi_porcentaje);

-- ==========================================
-- 5. Comentarios de auditoría
-- ==========================================

COMMENT ON VIEW analisis_completo IS 
'Vista unificada con compatibilidad para análisis antiguos y nuevos. Incluye valores calculados para registros legacy.';

COMMENT ON COLUMN analisis.factor_verde IS 
'Factor de vegetación del análisis. Default 0.65 para registros antiguos.';

COMMENT ON COLUMN analisis.co2_capturado_kg_anual IS 
'CO2 capturado en kg por año. Calculado como area_m2 * 5 para registros legacy.';

COMMENT ON COLUMN analisis.roi_porcentaje IS 
'Retorno de inversión ambiental en porcentaje. Default 6.67% para registros antiguos.';
