-- Migración: Recrear tabla analisis con BIGINT
-- Fecha: 2026-02-12
-- Propósito: Recrear tabla analisis con columnas BIGINT para soportar valores grandes >2.1B

-- BACKUP: Si existe data importante, crear backup primero
-- CREATE TABLE analisis_backup AS SELECT * FROM analisis;

-- Drop old table
DROP TABLE IF EXISTS analisis CASCADE;

-- Create new table with BIGINT for all numeric fields
CREATE TABLE analisis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_verde_id UUID REFERENCES zonas_verdes(id) ON DELETE CASCADE,
  
  -- Scores y métricas básicas
  green_score NUMERIC(5,2) NOT NULL,
  viabilidad VARCHAR(20) CHECK (viabilidad IN ('alta', 'media', 'baja', 'nula')),
  factor_verde NUMERIC(3,2),
  
  -- Beneficios ambientales (BIGINT - valores grandes)
  co2_capturado_kg_anual BIGINT,
  agua_retenida_litros_anual BIGINT,
  reduccion_temperatura_c NUMERIC(3,1),
  ahorro_energia_kwh_anual BIGINT,
  ahorro_energia_eur_anual BIGINT,
  
  -- Costos (BIGINT - valores grandes)
  coste_total_inicial_eur BIGINT,
  presupuesto_desglose JSONB,
  mantenimiento_anual_eur BIGINT,
  coste_por_m2_eur BIGINT,
  vida_util_anos BIGINT DEFAULT 25,
  
  -- ROI
  roi_porcentaje NUMERIC(5,2),
  amortizacion_anos NUMERIC(4,1),
  ahorro_anual_eur BIGINT,
  ahorro_25_anos_eur BIGINT,
  
  -- Subvenciones (BIGINT - valores grandes)
  subvencion_elegible BOOLEAN DEFAULT true,
  subvencion_porcentaje BIGINT,
  subvencion_programa VARCHAR(255),
  subvencion_monto_estimado_eur BIGINT,
  
  -- Otros campos
  exposicion_solar NUMERIC(3,0),
  especies_recomendadas JSONB,
  recomendaciones TEXT[],
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX idx_analisis_zona_verde ON analisis(zona_verde_id);
CREATE INDEX idx_analisis_viabilidad ON analisis(viabilidad);
CREATE INDEX idx_analisis_created_at ON analisis(created_at DESC);
CREATE INDEX idx_analisis_green_score ON analisis(green_score DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analisis_updated_at
  BEFORE UPDATE ON analisis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE analisis IS 'Resultados de análisis de viabilidad de zonas verdes';
COMMENT ON COLUMN analisis.green_score IS 'Puntuación de viabilidad verde (0-100)';
COMMENT ON COLUMN analisis.viabilidad IS 'Nivel de viabilidad: alta, media, baja, nula';
COMMENT ON COLUMN analisis.vida_util_anos IS 'Vida útil estimada del proyecto en años';
COMMENT ON COLUMN analisis.ahorro_25_anos_eur IS 'Ahorro total proyectado a 25 años en euros';
