-- ============================================
-- MIGRATION: Create conjuntos_zonas tables
-- Purpose: Support multi-selection of zones
-- Date: 2026-02-13
-- ============================================

-- ============================================
-- TABLE: conjuntos_zonas
-- Purpose: Store collections of multiple zones
-- ============================================
CREATE TABLE IF NOT EXISTS conjuntos_zonas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  area_total_m2 DECIMAL(12,2),
  cantidad_zonas INTEGER,
  tipos_zonas JSONB, -- {"tejado": 5, "solar_vacio": 2}
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE conjuntos_zonas IS 'Collections of multiple zones for batch analysis';
COMMENT ON COLUMN conjuntos_zonas.tipos_zonas IS 'Count of zones by type in JSON format';

-- ============================================
-- TABLE: zonas_en_conjunto
-- Purpose: Individual zones within a collection
-- ============================================
CREATE TABLE IF NOT EXISTS zonas_en_conjunto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conjunto_id UUID REFERENCES conjuntos_zonas(id) ON DELETE CASCADE,
  tipo_zona VARCHAR(50) NOT NULL CHECK (
    tipo_zona IN (
      'tejado',
      'azotea',
      'solar_vacio',
      'parque_degradado',
      'zona_abandonada',
      'espacio_abandonado',
      'zona_industrial',
      'fachada',
      'muro',
      'otro'
    )
  ),
  coordenadas JSONB NOT NULL, -- GeoJSON Polygon
  area_m2 DECIMAL(10,2),
  orden INTEGER, -- Preserve selection order
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE zonas_en_conjunto IS 'Individual zones within a collection';
COMMENT ON COLUMN zonas_en_conjunto.coordenadas IS 'GeoJSON Polygon geometry';
COMMENT ON COLUMN zonas_en_conjunto.orden IS 'Selection order of the zone';

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conjuntos_zonas_user ON conjuntos_zonas(user_id);
CREATE INDEX IF NOT EXISTS idx_conjuntos_zonas_created_at ON conjuntos_zonas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zonas_en_conjunto_conjunto ON zonas_en_conjunto(conjunto_id);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_conjuntos_zonas_updated_at
  BEFORE UPDATE ON conjuntos_zonas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES: conjuntos_zonas
-- ============================================
ALTER TABLE conjuntos_zonas ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on conjuntos_zonas"
  ON conjuntos_zonas FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert conjuntos_zonas"
  ON conjuntos_zonas FOR INSERT WITH CHECK (true);

-- Allow users to update their own conjuntos
CREATE POLICY "Allow users to update their own conjuntos_zonas"
  ON conjuntos_zonas FOR UPDATE USING (true) WITH CHECK (true);

-- Allow users to delete their own conjuntos
CREATE POLICY "Allow users to delete their own conjuntos_zonas"
  ON conjuntos_zonas FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES: zonas_en_conjunto
-- ============================================
ALTER TABLE zonas_en_conjunto ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on zonas_en_conjunto"
  ON zonas_en_conjunto FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert zonas_en_conjunto"
  ON zonas_en_conjunto FOR INSERT WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 016: conjuntos_zonas tables created successfully';
END
$$;
