-- Enable Row Level Security (RLS) for all tables
-- This ensures data security and user-level access control

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE especies ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_verdes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MUNICIPIOS POLICIES
-- ==========================================

-- Everyone can read municipios (public data)
CREATE POLICY "Municipios are viewable by everyone"
  ON municipios FOR SELECT
  USING (true);

-- Only authenticated users can insert municipios
CREATE POLICY "Authenticated users can insert municipios"
  ON municipios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- ESPECIES POLICIES
-- ==========================================

-- Everyone can read especies (public catalog)
CREATE POLICY "Especies are viewable by everyone"
  ON especies FOR SELECT
  USING (true);

-- Only authenticated users can insert especies
CREATE POLICY "Authenticated users can insert especies"
  ON especies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update especies
CREATE POLICY "Authenticated users can update especies"
  ON especies FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- ZONAS VERDES POLICIES
-- ==========================================

-- Everyone can view all zonas verdes
CREATE POLICY "Zonas verdes are viewable by everyone"
  ON zonas_verdes FOR SELECT
  USING (true);

-- Authenticated users can insert their own zonas
CREATE POLICY "Users can insert their own zonas verdes"
  ON zonas_verdes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Users can update their own zonas, or any zona if authenticated
CREATE POLICY "Users can update zonas verdes"
  ON zonas_verdes FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.role() = 'authenticated'
  );

-- Users can delete their own zonas
CREATE POLICY "Users can delete their own zonas verdes"
  ON zonas_verdes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- ANALISIS POLICIES
-- ==========================================

-- Everyone can view analisis
CREATE POLICY "Analisis are viewable by everyone"
  ON analisis FOR SELECT
  USING (true);

-- Authenticated users can insert analisis
CREATE POLICY "Authenticated users can insert analisis"
  ON analisis FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update analisis
CREATE POLICY "Authenticated users can update analisis"
  ON analisis FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete analisis
CREATE POLICY "Authenticated users can delete analisis"
  ON analisis FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- PROYECTOS POLICIES
-- ==========================================

-- Everyone can view proyectos
CREATE POLICY "Proyectos are viewable by everyone"
  ON proyectos FOR SELECT
  USING (true);

-- Authenticated users can insert proyectos
CREATE POLICY "Authenticated users can insert proyectos"
  ON proyectos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update proyectos
CREATE POLICY "Authenticated users can update proyectos"
  ON proyectos FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete proyectos
CREATE POLICY "Authenticated users can delete proyectos"
  ON proyectos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- IMAGENES POLICIES
-- ==========================================

-- Everyone can view imagenes
CREATE POLICY "Imagenes are viewable by everyone"
  ON imagenes FOR SELECT
  USING (true);

-- Authenticated users can insert imagenes
CREATE POLICY "Authenticated users can insert imagenes"
  ON imagenes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update imagenes
CREATE POLICY "Authenticated users can update imagenes"
  ON imagenes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete imagenes
CREATE POLICY "Authenticated users can delete imagenes"
  ON imagenes FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================

-- Enable realtime for zonas_verdes table
ALTER PUBLICATION supabase_realtime ADD TABLE zonas_verdes;
ALTER PUBLICATION supabase_realtime ADD TABLE analisis;
ALTER PUBLICATION supabase_realtime ADD TABLE proyectos;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON POLICY "Zonas verdes are viewable by everyone" ON zonas_verdes IS 'Public visibility for all green zones';
COMMENT ON POLICY "Users can insert their own zonas verdes" ON zonas_verdes IS 'Users can create zones associated with their account';
COMMENT ON POLICY "Users can update zonas verdes" ON zonas_verdes IS 'Authenticated users can update zones';
COMMENT ON POLICY "Users can delete their own zonas verdes" ON zonas_verdes IS 'Users can only delete zones they created';
