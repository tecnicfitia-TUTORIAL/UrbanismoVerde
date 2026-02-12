-- Migración: Mejora tabla especies con contextos y características técnicas
-- Fecha: 2026-02-12
-- Propósito: Añadir columnas contextuales para recomendación inteligente de especies

-- ============================================================================
-- AÑADIR COLUMNAS CONTEXTUALES
-- ============================================================================

-- Información de origen y economía
ALTER TABLE especies ADD COLUMN IF NOT EXISTS nativa_espana BOOLEAN DEFAULT false;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS nivel_economia VARCHAR(20) DEFAULT 'media';
ALTER TABLE especies ADD COLUMN IF NOT EXISTS mantenimiento_anual VARCHAR(20) DEFAULT 'medio';
ALTER TABLE especies ADD COLUMN IF NOT EXISTS riego_necesario VARCHAR(20) DEFAULT 'medio';
ALTER TABLE especies ADD COLUMN IF NOT EXISTS supervivencia_sin_riego_meses INTEGER;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS disponibilidad VARCHAR(20) DEFAULT 'común';

-- Propiedades especiales
ALTER TABLE especies ADD COLUMN IF NOT EXISTS comestible BOOLEAN DEFAULT false;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS medicinal BOOLEAN DEFAULT false;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS aromatica BOOLEAN DEFAULT false;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS melifera BOOLEAN DEFAULT false;

-- Datos estructurados JSONB
ALTER TABLE especies ADD COLUMN IF NOT EXISTS contextos_validos JSONB DEFAULT '{}'::jsonb;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS restricciones JSONB DEFAULT '{}'::jsonb;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS caracteristicas_tecnicas JSONB DEFAULT '{}'::jsonb;
ALTER TABLE especies ADD COLUMN IF NOT EXISTS beneficios_ambientales JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- ÍNDICES PARA CONSULTAS EFICIENTES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_especies_nativa ON especies(nativa_espana);
CREATE INDEX IF NOT EXISTS idx_especies_economia ON especies(nivel_economia);
CREATE INDEX IF NOT EXISTS idx_especies_mantenimiento ON especies(mantenimiento_anual);
CREATE INDEX IF NOT EXISTS idx_especies_riego ON especies(riego_necesario);
CREATE INDEX IF NOT EXISTS idx_especies_comestible ON especies(comestible);
CREATE INDEX IF NOT EXISTS idx_especies_melifera ON especies(melifera);

-- Índice único para evitar duplicados por nombre científico
CREATE UNIQUE INDEX IF NOT EXISTS idx_especies_nombre_cientifico_unique 
  ON especies(nombre_cientifico);

-- ============================================================================
-- INSERTAR ESPECIES TOP ECONÓMICAS PARA DIVERSOS CONTEXTOS
-- ============================================================================

-- Especies para tejados extensivos (muy económicas, sin riego)
INSERT INTO especies (
  nombre_comun, nombre_cientifico, tipo, 
  nativa_espana, nivel_economia, mantenimiento_anual, riego_necesario,
  supervivencia_sin_riego_meses, altura_max_m, requerimientos_sol,
  comestible, aromatica, melifera,
  contextos_validos, restricciones, caracteristicas_tecnicas, beneficios_ambientales
) VALUES
(
  'Sedum blanco', 'Sedum album', 'suculenta',
  true, 'muy_alta', 'nulo', 'nulo', 12, 0.1, 'pleno_sol',
  false, false, true,
  '{"tejado_extensivo": true, "tejado_intensivo": true, "jardin_vertical": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 3, "peso_max_kg_m2": 5, "requiere_tutor": false}'::jsonb,
  '{"sistema_raices": "superficial", "tolerancia_sequia": "muy_alta", "crecimiento_anual_cm": 5}'::jsonb,
  '{"co2_kg_m2_anual": 0.5, "retencion_agua_porcentaje": 40, "enfriamiento_c": 1.5, "biodiversidad_score": 7}'::jsonb
),
(
  'Tomillo', 'Thymus vulgaris', 'arbusto',
  true, 'muy_alta', 'muy_bajo', 'mínimo', 6, 0.2, 'pleno_sol',
  true, true, true,
  '{"tejado_extensivo": true, "tejado_intensivo": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 10, "peso_max_kg_m2": 12}'::jsonb,
  '{"sistema_raices": "superficial", "tolerancia_sequia": "alta", "crecimiento_anual_cm": 10}'::jsonb,
  '{"co2_kg_m2_anual": 0.8, "retencion_agua_porcentaje": 30, "biodiversidad_score": 9}'::jsonb
),
(
  'Siempreviva', 'Sempervivum tectorum', 'suculenta',
  true, 'muy_alta', 'nulo', 'nulo', 18, 0.15, 'pleno_sol',
  false, false, false,
  '{"tejado_extensivo": true, "tejado_intensivo": true, "jardin_vertical": true}'::jsonb,
  '{"profundidad_minima_cm": 5, "peso_max_kg_m2": 8}'::jsonb,
  '{"sistema_raices": "muy_superficial", "tolerancia_sequia": "extrema"}'::jsonb,
  '{"co2_kg_m2_anual": 0.4, "retencion_agua_porcentaje": 35, "biodiversidad_score": 6}'::jsonb
),
(
  'Romero', 'Rosmarinus officinalis', 'arbusto',
  true, 'muy_alta', 'muy_bajo', 'nulo', 12, 1.5, 'pleno_sol',
  true, true, true,
  '{"tejado_intensivo": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 30, "peso_max_kg_m2": 35}'::jsonb,
  '{"sistema_raices": "medio", "tolerancia_sequia": "muy_alta"}'::jsonb,
  '{"co2_kg_m2_anual": 2.5, "retencion_agua_porcentaje": 25, "biodiversidad_score": 9}'::jsonb
),
(
  'Encina', 'Quercus ilex', 'arbol',
  true, 'alta', 'nulo', 'solo_establecimiento', 999, 15.0, 'pleno_sol',
  false, false, true,
  '{"suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 200, "peso_max_kg_m2": 500}'::jsonb,
  '{"sistema_raices": "profundo", "vida_util_anos": 500}'::jsonb,
  '{"co2_kg_m2_anual": 800, "biodiversidad_score": 10}'::jsonb
),
(
  'Lavanda', 'Lavandula angustifolia', 'arbusto',
  true, 'muy_alta', 'muy_bajo', 'bajo', 4, 0.6, 'pleno_sol',
  false, true, true,
  '{"tejado_intensivo": true, "jardin_vertical": false, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 20, "peso_max_kg_m2": 25}'::jsonb,
  '{"sistema_raices": "medio", "tolerancia_sequia": "alta", "crecimiento_anual_cm": 15}'::jsonb,
  '{"co2_kg_m2_anual": 1.2, "retencion_agua_porcentaje": 28, "biodiversidad_score": 8}'::jsonb
),
(
  'Santolina', 'Santolina chamaecyparissus', 'arbusto',
  true, 'muy_alta', 'muy_bajo', 'bajo', 6, 0.4, 'pleno_sol',
  false, true, true,
  '{"tejado_extensivo": true, "tejado_intensivo": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 15, "peso_max_kg_m2": 18}'::jsonb,
  '{"sistema_raices": "superficial", "tolerancia_sequia": "muy_alta", "crecimiento_anual_cm": 12}'::jsonb,
  '{"co2_kg_m2_anual": 1.0, "retencion_agua_porcentaje": 32, "biodiversidad_score": 7}'::jsonb
),
(
  'Hiedra', 'Hedera helix', 'planta',
  true, 'alta', 'bajo', 'medio', 3, 0.3, 'media_sombra',
  false, false, false,
  '{"jardin_vertical": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 20, "peso_max_kg_m2": 22, "requiere_tutor": true}'::jsonb,
  '{"sistema_raices": "medio", "tolerancia_sequia": "media", "crecimiento_anual_cm": 50}'::jsonb,
  '{"co2_kg_m2_anual": 1.8, "retencion_agua_porcentaje": 35, "biodiversidad_score": 6}'::jsonb
),
(
  'Vincapervinca', 'Vinca minor', 'planta',
  true, 'alta', 'bajo', 'medio', 2, 0.15, 'media_sombra',
  false, false, false,
  '{"tejado_intensivo": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 15, "peso_max_kg_m2": 20}'::jsonb,
  '{"sistema_raices": "superficial", "tolerancia_sequia": "media", "crecimiento_anual_cm": 20}'::jsonb,
  '{"co2_kg_m2_anual": 0.9, "retencion_agua_porcentaje": 30, "biodiversidad_score": 5}'::jsonb
),
(
  'Festuca glauca', 'Festuca glauca', 'planta',
  true, 'muy_alta', 'muy_bajo', 'bajo', 8, 0.25, 'pleno_sol',
  false, false, false,
  '{"tejado_extensivo": true, "tejado_intensivo": true, "suelo": true}'::jsonb,
  '{"profundidad_minima_cm": 10, "peso_max_kg_m2": 15}'::jsonb,
  '{"sistema_raices": "superficial", "tolerancia_sequia": "alta", "crecimiento_anual_cm": 8}'::jsonb,
  '{"co2_kg_m2_anual": 0.7, "retencion_agua_porcentaje": 25, "biodiversidad_score": 5}'::jsonb
)
ON CONFLICT (nombre_cientifico) DO UPDATE SET
  nativa_espana = EXCLUDED.nativa_espana,
  nivel_economia = EXCLUDED.nivel_economia,
  mantenimiento_anual = EXCLUDED.mantenimiento_anual,
  riego_necesario = EXCLUDED.riego_necesario,
  supervivencia_sin_riego_meses = EXCLUDED.supervivencia_sin_riego_meses,
  comestible = EXCLUDED.comestible,
  medicinal = EXCLUDED.medicinal,
  aromatica = EXCLUDED.aromatica,
  melifera = EXCLUDED.melifera,
  contextos_validos = EXCLUDED.contextos_validos,
  restricciones = EXCLUDED.restricciones,
  caracteristicas_tecnicas = EXCLUDED.caracteristicas_tecnicas,
  beneficios_ambientales = EXCLUDED.beneficios_ambientales,
  disponibilidad = EXCLUDED.disponibilidad;

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON COLUMN especies.nativa_espana IS 
  'Indica si la especie es nativa de España (Península Ibérica)';

COMMENT ON COLUMN especies.nivel_economia IS 
  'Nivel de economía: muy_alta, alta, media, baja (coste de implantación y mantenimiento)';

COMMENT ON COLUMN especies.mantenimiento_anual IS 
  'Nivel de mantenimiento anual requerido: nulo, muy_bajo, bajo, medio, alto';

COMMENT ON COLUMN especies.riego_necesario IS 
  'Necesidad de riego: nulo, mínimo, bajo, medio, alto';

COMMENT ON COLUMN especies.supervivencia_sin_riego_meses IS 
  'Meses que puede sobrevivir sin riego una vez establecida';

COMMENT ON COLUMN especies.comestible IS 
  'Indica si la especie es comestible o tiene partes comestibles';

COMMENT ON COLUMN especies.medicinal IS 
  'Indica si la especie tiene propiedades medicinales';

COMMENT ON COLUMN especies.aromatica IS 
  'Indica si la especie es aromática';

COMMENT ON COLUMN especies.melifera IS 
  'Indica si la especie es atractiva para polinizadores (abejas)';

COMMENT ON COLUMN especies.contextos_validos IS 
  'Contextos donde la especie es viable (JSONB): tejado_extensivo, tejado_intensivo, jardin_vertical, suelo';

COMMENT ON COLUMN especies.restricciones IS 
  'Restricciones técnicas (JSONB): profundidad_minima_cm, peso_max_kg_m2, requiere_tutor';

COMMENT ON COLUMN especies.caracteristicas_tecnicas IS 
  'Características técnicas (JSONB): sistema_raices, tolerancia_sequia, crecimiento_anual_cm, vida_util_anos';

COMMENT ON COLUMN especies.beneficios_ambientales IS 
  'Beneficios ambientales (JSONB): co2_kg_m2_anual, retencion_agua_porcentaje, enfriamiento_c, biodiversidad_score';

COMMENT ON COLUMN especies.disponibilidad IS 
  'Disponibilidad en el mercado: común, ocasional, rara';
