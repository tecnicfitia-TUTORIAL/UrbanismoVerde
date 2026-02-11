-- Fix PostGIS spatial_ref_sys table RLS warning
-- The spatial_ref_sys table is a PostGIS system table that stores spatial reference system information
-- It's publicly accessible but needs RLS enabled with a public read policy

-- Enable RLS on spatial_ref_sys table
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- This allows anyone to read spatial reference system data
CREATE POLICY "spatial_ref_sys is viewable by everyone"
  ON spatial_ref_sys FOR SELECT
  USING (true);

-- ==========================================
-- COMMENT
-- ==========================================

COMMENT ON POLICY "spatial_ref_sys is viewable by everyone" ON spatial_ref_sys IS 'Public read access for PostGIS spatial reference systems';
