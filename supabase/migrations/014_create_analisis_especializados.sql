-- Migración: Sistema de Análisis Especializados Jerárquicos
-- Fecha: 2026-02-12
-- Propósito: Crear infraestructura para análisis especializados que heredan del análisis base

-- ============================================================================
-- 1. TABLA PRINCIPAL: analisis_especializados
-- ============================================================================

CREATE TABLE analisis_especializados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analisis_id UUID NOT NULL REFERENCES analisis(id) ON DELETE CASCADE,
  
  -- Tipo de especialización
  tipo_especializacion VARCHAR(50) NOT NULL CHECK (
    tipo_especializacion IN (
      'tejado',
      'zona_abandonada', 
      'solar_vacio',
      'parque_degradado',
      'jardin_vertical',
      'otro'
    )
  ),
  
  -- Datos heredados del análisis base (snapshot para comparación)
  area_base_m2 NUMERIC(12,2) NOT NULL,
  green_score_base NUMERIC(5,2) NOT NULL,
  especies_base JSONB,
  presupuesto_base_eur BIGINT,
  
  -- Datos específicos de la especialización (JSONB para flexibilidad)
  caracteristicas_especificas JSONB DEFAULT '{}'::jsonb,
  analisis_adicional JSONB DEFAULT '{}'::jsonb,
  presupuesto_adicional JSONB DEFAULT '{}'::jsonb,
  
  -- Presupuesto ajustado
  presupuesto_total_eur BIGINT,
  incremento_vs_base_eur BIGINT,
  incremento_vs_base_porcentaje NUMERIC(5,2),
  
  -- Viabilidades específicas
  viabilidad_tecnica VARCHAR(20) CHECK (viabilidad_tecnica IN ('alta', 'media', 'baja', 'nula')),
  viabilidad_economica VARCHAR(20) CHECK (viabilidad_economica IN ('alta', 'media', 'baja', 'nula')),
  viabilidad_normativa VARCHAR(20) CHECK (viabilidad_normativa IN ('alta', 'media', 'baja', 'nula')),
  viabilidad_final VARCHAR(20) CHECK (viabilidad_final IN ('alta', 'media', 'baja', 'nula')),
  
  -- Notas y observaciones
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_analisis_especializados_analisis_id ON analisis_especializados(analisis_id);
CREATE INDEX idx_analisis_especializados_tipo ON analisis_especializados(tipo_especializacion);
CREATE INDEX idx_analisis_especializados_viabilidad_final ON analisis_especializados(viabilidad_final);
CREATE INDEX idx_analisis_especializados_created_at ON analisis_especializados(created_at DESC);

-- Índice único para evitar duplicados de tipo por análisis
CREATE UNIQUE INDEX idx_analisis_especializados_unique_tipo 
  ON analisis_especializados(analisis_id, tipo_especializacion);

-- ============================================================================
-- 3. TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_analisis_especializados_updated_at
  BEFORE UPDATE ON analisis_especializados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE analisis_especializados ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para testing (ajustar en producción según autenticación)
CREATE POLICY "Permitir lectura pública de especializaciones"
  ON analisis_especializados
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción pública de especializaciones"
  ON analisis_especializados
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de especializaciones"
  ON analisis_especializados
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de especializaciones"
  ON analisis_especializados
  FOR DELETE
  USING (true);

-- ============================================================================
-- 5. VISTA: analisis_completos (JOIN analisis + especializados)
-- ============================================================================

CREATE OR REPLACE VIEW analisis_completos AS
SELECT 
  a.id as analisis_id,
  a.zona_verde_id,
  a.green_score,
  a.viabilidad as viabilidad_base,
  a.coste_total_inicial_eur as presupuesto_base_eur,
  a.especies_recomendadas,
  a.created_at as analisis_created_at,
  
  ae.id as especializacion_id,
  ae.tipo_especializacion,
  ae.area_base_m2,
  ae.green_score_base,
  ae.caracteristicas_especificas,
  ae.analisis_adicional,
  ae.presupuesto_total_eur,
  ae.incremento_vs_base_eur,
  ae.incremento_vs_base_porcentaje,
  ae.viabilidad_tecnica,
  ae.viabilidad_economica,
  ae.viabilidad_normativa,
  ae.viabilidad_final,
  ae.notas as notas_especializacion,
  ae.created_at as especializacion_created_at,
  
  zv.nombre as zona_nombre,
  zv.tipo as zona_tipo,
  zv.area_m2 as zona_area_m2
FROM 
  analisis a
LEFT JOIN 
  analisis_especializados ae ON ae.analisis_id = a.id
LEFT JOIN
  zonas_verdes zv ON zv.id = a.zona_verde_id;

-- ============================================================================
-- 6. FUNCIÓN: get_especializaciones_by_analisis()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_especializaciones_by_analisis(p_analisis_id UUID)
RETURNS TABLE (
  especializacion_id UUID,
  tipo_especializacion VARCHAR,
  area_base_m2 NUMERIC,
  green_score_base NUMERIC,
  presupuesto_total_eur BIGINT,
  incremento_vs_base_eur BIGINT,
  incremento_vs_base_porcentaje NUMERIC,
  viabilidad_final VARCHAR,
  caracteristicas_especificas JSONB,
  analisis_adicional JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id as especializacion_id,
    tipo_especializacion,
    area_base_m2,
    green_score_base,
    presupuesto_total_eur,
    incremento_vs_base_eur,
    incremento_vs_base_porcentaje,
    viabilidad_final,
    caracteristicas_especificas,
    analisis_adicional,
    created_at
  FROM analisis_especializados
  WHERE analisis_id = p_analisis_id
  ORDER BY created_at DESC;
$$;

-- ============================================================================
-- 7. FUNCIÓN: count_especializaciones_by_tipo()
-- ============================================================================

CREATE OR REPLACE FUNCTION count_especializaciones_by_tipo()
RETURNS TABLE (
  tipo VARCHAR,
  total_count BIGINT,
  alta_viabilidad BIGINT,
  media_viabilidad BIGINT,
  baja_viabilidad BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    tipo_especializacion as tipo,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE viabilidad_final = 'alta') as alta_viabilidad,
    COUNT(*) FILTER (WHERE viabilidad_final = 'media') as media_viabilidad,
    COUNT(*) FILTER (WHERE viabilidad_final = 'baja') as baja_viabilidad
  FROM analisis_especializados
  GROUP BY tipo_especializacion
  ORDER BY total_count DESC;
$$;

-- ============================================================================
-- 8. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE analisis_especializados IS 
  'Análisis especializados que heredan y extienden análisis base según tipo de zona';

COMMENT ON COLUMN analisis_especializados.tipo_especializacion IS 
  'Tipo de especialización: tejado, zona_abandonada, solar_vacio, parque_degradado, jardin_vertical, otro';

COMMENT ON COLUMN analisis_especializados.area_base_m2 IS 
  'Snapshot del área del análisis base (m²)';

COMMENT ON COLUMN analisis_especializados.green_score_base IS 
  'Snapshot del green score del análisis base';

COMMENT ON COLUMN analisis_especializados.caracteristicas_especificas IS 
  'Características específicas del tipo (JSONB): ej. carga_estructural_kg_m2 para tejados';

COMMENT ON COLUMN analisis_especializados.analisis_adicional IS 
  'Análisis adicionales específicos (JSONB): ej. estudio_sombras, analisis_viento';

COMMENT ON COLUMN analisis_especializados.presupuesto_adicional IS 
  'Desglose de costes adicionales vs base (JSONB)';

COMMENT ON COLUMN analisis_especializados.presupuesto_total_eur IS 
  'Presupuesto total ajustado (base + adicionales)';

COMMENT ON COLUMN analisis_especializados.incremento_vs_base_eur IS 
  'Incremento absoluto respecto al presupuesto base';

COMMENT ON COLUMN analisis_especializados.incremento_vs_base_porcentaje IS 
  'Incremento porcentual respecto al presupuesto base';

COMMENT ON COLUMN analisis_especializados.viabilidad_final IS 
  'Viabilidad final considerando aspectos técnicos, económicos y normativos';

COMMENT ON VIEW analisis_completos IS 
  'Vista consolidada de análisis base + especializaciones + zona verde';

COMMENT ON FUNCTION get_especializaciones_by_analisis IS 
  'Obtiene todas las especializaciones de un análisis ordenadas por fecha';

COMMENT ON FUNCTION count_especializaciones_by_tipo IS 
  'Estadísticas de especializaciones agrupadas por tipo y viabilidad';
