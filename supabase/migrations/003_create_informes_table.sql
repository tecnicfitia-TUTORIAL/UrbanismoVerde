-- Migration 003: Create informes (reports) table
-- Adds table for storing generated reports in PDF, HTML, or JSON format

-- ==========================================
-- INFORMES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS informes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analisis_id UUID NOT NULL REFERENCES analisis(id) ON DELETE CASCADE,
  formato VARCHAR(10) NOT NULL CHECK (formato IN ('pdf', 'html', 'json')),
  contenido TEXT, -- HTML or JSON content
  url_pdf TEXT,    -- S3 bucket URL if uploaded
  generado_por UUID, -- User ID who generated the report (references auth.users)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_informes_analisis ON informes(analisis_id);
CREATE INDEX idx_informes_created ON informes(created_at DESC);
CREATE INDEX idx_informes_formato ON informes(formato);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_informes_updated_at
  BEFORE UPDATE ON informes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE informes IS 'Generated reports for analysis (PDF, HTML, JSON)';
COMMENT ON COLUMN informes.analisis_id IS 'Reference to the analysis this report is for';
COMMENT ON COLUMN informes.formato IS 'Report format: pdf, html, or json';
COMMENT ON COLUMN informes.contenido IS 'Report content (HTML or JSON string)';
COMMENT ON COLUMN informes.url_pdf IS 'Optional URL to stored PDF file';
COMMENT ON COLUMN informes.generado_por IS 'User who generated the report';
