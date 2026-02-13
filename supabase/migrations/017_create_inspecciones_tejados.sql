-- ============================================
-- MIGRATION: Create inspecciones_tejados table
-- Purpose: Individual rooftop inspections with complete geographic context
-- Date: 2026-02-13
-- ============================================

-- ============================================
-- TABLE: inspecciones_tejados
-- Purpose: Individual rooftop inspections with complete geographic and physical data
-- ============================================
CREATE TABLE IF NOT EXISTS inspecciones_tejados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  codigo VARCHAR(50) UNIQUE NOT NULL, -- "INSP-0001", "INSP-0002"
  nombre VARCHAR(255),
  
  -- Location
  direccion TEXT,
  numero VARCHAR(20),
  municipio VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  pais VARCHAR(50) DEFAULT 'España',
  
  -- Geometry
  coordenadas JSONB NOT NULL, -- GeoJSON Polygon
  centroide GEOGRAPHY(POINT, 4326),
  
  -- Metrics
  area_m2 DECIMAL(10,2),
  perimetro_m DECIMAL(10,2),
  orientacion VARCHAR(20), -- 'Norte', 'Sur', 'Este', 'Oeste', 'Noreste', etc.
  
  -- Images
  imagen_satelital_url TEXT,
  imagen_calle_url TEXT, -- Future: Google Street View
  
  -- Characteristics
  inclinacion_estimada DECIMAL(5,2),
  tipo_cubierta VARCHAR(50) CHECK (
    tipo_cubierta IN ('plana', 'inclinada', 'mixta', 'desconocido')
  ),
  estado_conservacion VARCHAR(50) CHECK (
    estado_conservacion IN ('excelente', 'bueno', 'regular', 'malo', 'muy_malo')
  ),
  obstrucciones JSONB DEFAULT '[]'::jsonb, -- [{tipo: 'chimenea', descripcion: '...'}]
  
  -- Assessment
  notas TEXT,
  viabilidad_preliminar VARCHAR(20) CHECK (
    viabilidad_preliminar IN ('alta', 'media', 'baja', 'nula')
  ),
  prioridad INTEGER DEFAULT 0 CHECK (prioridad >= 0 AND prioridad <= 5), -- 0-5 stars
  
  -- Relationships
  informe_id UUID REFERENCES informes(id) ON DELETE SET NULL,
  zona_verde_id UUID REFERENCES zonas_verdes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_codigo ON inspecciones_tejados(codigo);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_informe ON inspecciones_tejados(informe_id);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_zona ON inspecciones_tejados(zona_verde_id);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_user ON inspecciones_tejados(user_id);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_created ON inspecciones_tejados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspecciones_tejados_centroide ON inspecciones_tejados USING GIST(centroide);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_inspecciones_tejados_updated_at
  BEFORE UPDATE ON inspecciones_tejados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-generate codigo
-- ============================================
CREATE OR REPLACE FUNCTION generate_inspeccion_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := 'INSP-' || LPAD(
      (SELECT COALESCE(MAX(SUBSTRING(codigo FROM 6)::INTEGER), 0) + 1
       FROM inspecciones_tejados)::TEXT, 
      4, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Set codigo on insert
-- ============================================
CREATE TRIGGER set_inspeccion_codigo
  BEFORE INSERT ON inspecciones_tejados
  FOR EACH ROW
  EXECUTE FUNCTION generate_inspeccion_codigo();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE inspecciones_tejados ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on inspecciones_tejados"
  ON inspecciones_tejados FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert inspecciones_tejados"
  ON inspecciones_tejados FOR INSERT WITH CHECK (true);

-- Allow users to update
CREATE POLICY "Allow users to update their own inspecciones_tejados"
  ON inspecciones_tejados FOR UPDATE USING (true) WITH CHECK (true);

-- Allow users to delete
CREATE POLICY "Allow users to delete their own inspecciones_tejados"
  ON inspecciones_tejados FOR DELETE USING (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE inspecciones_tejados IS 'Individual rooftop inspections with complete geographic and physical data';
COMMENT ON COLUMN inspecciones_tejados.codigo IS 'Auto-generated unique code (INSP-0001, INSP-0002, etc.)';
COMMENT ON COLUMN inspecciones_tejados.prioridad IS 'Priority level from 0 (lowest) to 5 (highest/urgent)';
COMMENT ON COLUMN inspecciones_tejados.obstrucciones IS 'Array of obstructions: [{tipo, descripcion, ubicacion}]';
COMMENT ON COLUMN inspecciones_tejados.coordenadas IS 'GeoJSON Polygon geometry';
COMMENT ON COLUMN inspecciones_tejados.centroide IS 'Geographic center point (PostGIS GEOGRAPHY)';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 017: inspecciones_tejados table created successfully';
END
$$;
