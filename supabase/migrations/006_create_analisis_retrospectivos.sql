-- Migración 006: Análisis Retrospectivos
-- Sistema de comparación ANTES vs DESPUÉS para cubiertas verdes
-- Permite cuantificar ROI ambiental y económico

-- ==========================================
-- TABLA PRINCIPAL: analisis_retrospectivos
-- ==========================================

CREATE TABLE analisis_retrospectivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_verde_id UUID REFERENCES zonas_verdes(id) ON DELETE CASCADE,
  
  -- Identificación
  nombre VARCHAR(255),
  descripcion TEXT,
  
  -- ==========================================
  -- BASELINE (estado actual - ANTES)
  -- ==========================================
  baseline_fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  baseline_tipo_superficie VARCHAR(50) NOT NULL CHECK (baseline_tipo_superficie IN ('asfalto', 'hormigon', 'grava', 'mixto')),
  baseline_area_m2 DECIMAL(10,2) NOT NULL,
  baseline_area_impermeabilizada_pct DECIMAL(5,2) DEFAULT 100.0,
  baseline_vegetacion_existente_m2 DECIMAL(10,2) DEFAULT 0,
  
  -- Condiciones ambientales actuales
  baseline_temperatura_verano_c DECIMAL(4,2),
  baseline_isla_calor_intensidad INTEGER CHECK (baseline_isla_calor_intensidad BETWEEN 0 AND 10),
  baseline_runoff_agua_pct DECIMAL(5,2) DEFAULT 100.0, -- % agua que no se retiene
  baseline_co2_captura_kg_anual DECIMAL(10,2) DEFAULT 0,
  baseline_biodiversidad_indice INTEGER DEFAULT 0,
  
  -- Costes operativos actuales (€/año)
  baseline_coste_ac_eur_anual DECIMAL(10,2),
  baseline_coste_calefaccion_eur_anual DECIMAL(10,2),
  baseline_coste_gestion_agua_eur_anual DECIMAL(10,2),
  baseline_coste_mantenimiento_eur_anual DECIMAL(10,2),
  baseline_coste_total_eur_anual DECIMAL(10,2),
  
  -- ==========================================
  -- PROYECCIÓN (estado futuro - DESPUÉS)
  -- ==========================================
  projection_anos_horizonte INTEGER NOT NULL DEFAULT 25 CHECK (projection_anos_horizonte IN (1, 5, 10, 25)),
  projection_tipo_cubierta VARCHAR(50) NOT NULL CHECK (projection_tipo_cubierta IN ('extensiva', 'intensiva', 'semi-intensiva')),
  projection_area_verde_m2 DECIMAL(10,2) NOT NULL,
  projection_sustrato_espesor_cm INTEGER,
  projection_sistema_riego VARCHAR(50) CHECK (projection_sistema_riego IN ('goteo', 'manual', 'ninguno')),
  
  -- Mejoras ambientales proyectadas
  projection_reduccion_temperatura_c DECIMAL(4,2),
  projection_retencion_agua_pct DECIMAL(5,2),
  projection_co2_adicional_kg_anual DECIMAL(10,2),
  projection_biodiversidad_mejora_pct DECIMAL(5,2),
  projection_reduccion_ruido_db DECIMAL(4,2),
  
  -- Ahorro económico proyectado (€/año)
  projection_reduccion_ac_eur_anual DECIMAL(10,2),
  projection_reduccion_calef_eur_anual DECIMAL(10,2),
  projection_valor_agua_retenida_eur_anual DECIMAL(10,2),
  projection_ahorro_total_anual DECIMAL(10,2),
  projection_ahorro_acumulado_25_anos DECIMAL(12,2),
  
  -- Inversión requerida
  projection_coste_inicial_eur DECIMAL(10,2),
  projection_mantenimiento_anual_eur DECIMAL(10,2),
  projection_subvenciones_disponibles_eur DECIMAL(10,2),
  projection_coste_neto_inicial_eur DECIMAL(10,2), -- Después de subvenciones
  
  -- ==========================================
  -- ROI y Métricas Financieras
  -- ==========================================
  roi_porcentaje DECIMAL(5,2),
  payback_anos DECIMAL(4,1),
  vnp_25_anos_eur DECIMAL(12,2), -- Valor Neto Presente
  
  -- ==========================================
  -- COMPARATIVA (deltas ANTES vs DESPUÉS)
  -- ==========================================
  delta_temperatura_c DECIMAL(4,2),
  delta_co2_kg_anual DECIMAL(10,2),
  delta_agua_retenida_m3_anual DECIMAL(10,2),
  delta_costes_eur_anual DECIMAL(10,2),
  delta_biodiversidad_pct DECIMAL(5,2),
  
  -- ==========================================
  -- Valor Ecosistémico
  -- ==========================================
  valor_ecosistemico_total_eur DECIMAL(12,2),
  mejora_calidad_vida_indice INTEGER CHECK (mejora_calidad_vida_indice BETWEEN 0 AND 10),
  
  -- ==========================================
  -- Timeline y Especies
  -- ==========================================
  -- Timeline de beneficios (JSON array de objetos)
  -- Formato: [{ano: 1, beneficio_acumulado_eur: 5000, co2_acumulado_kg: 2500, agua_acumulada_m3: 240}, ...]
  timeline_beneficios JSONB,
  
  -- Especies seleccionadas para la proyección (JSON array)
  -- Formato: [{nombre_comun: "Lavanda", nombre_cientifico: "Lavandula angustifolia", densidad_m2: 9}, ...]
  especies_seleccionadas JSONB,
  
  -- ==========================================
  -- Metadatos
  -- ==========================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ==========================================
  -- Constraints
  -- ==========================================
  CONSTRAINT positive_area CHECK (baseline_area_m2 > 0),
  CONSTRAINT valid_projection_area CHECK (projection_area_verde_m2 <= baseline_area_m2),
  CONSTRAINT valid_impermeabilidad CHECK (baseline_area_impermeabilizada_pct BETWEEN 0 AND 100)
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX idx_retrospectivos_zona ON analisis_retrospectivos(zona_verde_id);
CREATE INDEX idx_retrospectivos_fecha ON analisis_retrospectivos(baseline_fecha);
CREATE INDEX idx_retrospectivos_created ON analisis_retrospectivos(created_at DESC);
CREATE INDEX idx_retrospectivos_roi ON analisis_retrospectivos(roi_porcentaje);
CREATE INDEX idx_retrospectivos_payback ON analisis_retrospectivos(payback_anos);

-- ==========================================
-- TRIGGER para updated_at
-- ==========================================

CREATE TRIGGER update_retrospectivos_updated_at
  BEFORE UPDATE ON analisis_retrospectivos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE analisis_retrospectivos ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública
CREATE POLICY "Allow public read access" 
  ON analisis_retrospectivos 
  FOR SELECT 
  USING (true);

-- Permitir inserción autenticada
CREATE POLICY "Allow authenticated insert" 
  ON analisis_retrospectivos 
  FOR INSERT 
  WITH CHECK (true);

-- Permitir actualización autenticada
CREATE POLICY "Allow authenticated update" 
  ON analisis_retrospectivos 
  FOR UPDATE 
  USING (true);

-- Permitir eliminación autenticada
CREATE POLICY "Allow authenticated delete" 
  ON analisis_retrospectivos 
  FOR DELETE 
  USING (true);

-- ==========================================
-- COMENTARIOS
-- ==========================================

COMMENT ON TABLE analisis_retrospectivos IS 
'Análisis retrospectivos para comparar estado actual (baseline) vs proyectado (con cubierta verde) de azoteas urbanas. Permite cuantificar ROI ambiental y económico.';

COMMENT ON COLUMN analisis_retrospectivos.baseline_tipo_superficie IS 
'Tipo de superficie actual: asfalto, hormigon, grava, mixto';

COMMENT ON COLUMN analisis_retrospectivos.baseline_area_m2 IS 
'Área total de la azotea en metros cuadrados';

COMMENT ON COLUMN analisis_retrospectivos.baseline_coste_total_eur_anual IS 
'Coste operativo total actual (AC + calefacción + agua + mantenimiento)';

COMMENT ON COLUMN analisis_retrospectivos.projection_tipo_cubierta IS 
'Tipo de cubierta verde proyectada: extensiva (bajo mantenimiento, sedum), intensiva (jardín completo), semi-intensiva (intermedio)';

COMMENT ON COLUMN analisis_retrospectivos.projection_anos_horizonte IS 
'Horizonte temporal del análisis: 1, 5, 10 o 25 años';

COMMENT ON COLUMN analisis_retrospectivos.roi_porcentaje IS 
'Retorno de inversión expresado como porcentaje anual';

COMMENT ON COLUMN analisis_retrospectivos.payback_anos IS 
'Años necesarios para recuperar la inversión inicial mediante ahorros';

COMMENT ON COLUMN analisis_retrospectivos.vnp_25_anos_eur IS 
'Valor Neto Presente a 25 años con tasa descuento 3%';

COMMENT ON COLUMN analisis_retrospectivos.timeline_beneficios IS 
'JSON array con beneficios por año: [{ano: 1, beneficio_acumulado_eur: X, co2_acumulado_kg: Y, agua_acumulada_m3: Z}]';

COMMENT ON COLUMN analisis_retrospectivos.especies_seleccionadas IS 
'JSON array de especies recomendadas: [{nombre_comun: "Lavanda", nombre_cientifico: "...", densidad_m2: 9}]';

COMMENT ON COLUMN analisis_retrospectivos.valor_ecosistemico_total_eur IS 
'Valoración monetaria total de servicios ecosistémicos a 25 años según metodología UE';

COMMENT ON COLUMN analisis_retrospectivos.delta_temperatura_c IS 
'Reducción de temperatura proyectada (negativo = mejora)';

COMMENT ON COLUMN analisis_retrospectivos.delta_co2_kg_anual IS 
'CO₂ adicional capturado anualmente (positivo = mejora)';

COMMENT ON COLUMN analisis_retrospectivos.delta_agua_retenida_m3_anual IS 
'Agua adicional retenida anualmente en m³ (positivo = mejora)';

COMMENT ON COLUMN analisis_retrospectivos.delta_costes_eur_anual IS 
'Variación de costes operativos anuales (negativo = ahorro)';
