-- Initial Schema for EcoUrbe AI
-- Creates all necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- MUNICIPIOS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS municipios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  provincia VARCHAR(255) NOT NULL,
  comunidad_autonoma VARCHAR(255) NOT NULL,
  codigo_postal VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_municipios_nombre ON municipios(nombre);
CREATE INDEX idx_municipios_provincia ON municipios(provincia);

-- ==========================================
-- ESPECIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS especies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_comun VARCHAR(255) NOT NULL,
  nombre_cientifico VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('arbol', 'arbusto', 'planta', 'suculenta')),
  altura_max_m DECIMAL(5,2),
  requerimientos_agua VARCHAR(20) CHECK (requerimientos_agua IN ('bajo', 'medio', 'alto')),
  requerimientos_sol VARCHAR(20) CHECK (requerimientos_sol IN ('sombra', 'media_sombra', 'pleno_sol')),
  coste_unidad DECIMAL(10,2),
  descripcion TEXT,
  beneficios TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_especies_tipo ON especies(tipo);
CREATE INDEX idx_especies_nombre_comun ON especies(nombre_comun);

-- ==========================================
-- ZONAS VERDES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS zonas_verdes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  coordenadas JSONB NOT NULL,
  area_m2 DECIMAL(12,2) NOT NULL,
  viabilidad VARCHAR(20) CHECK (viabilidad IN ('alta', 'media', 'baja', 'nula')),
  estado VARCHAR(30) CHECK (estado IN ('propuesta', 'en_analisis', 'aprobada', 'en_ejecucion', 'completada', 'rechazada')) DEFAULT 'propuesta',
  municipio_id UUID REFERENCES municipios(id) ON DELETE SET NULL,
  user_id UUID,
  prioridad INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_zonas_verdes_estado ON zonas_verdes(estado);
CREATE INDEX idx_zonas_verdes_viabilidad ON zonas_verdes(viabilidad);
CREATE INDEX idx_zonas_verdes_municipio ON zonas_verdes(municipio_id);
CREATE INDEX idx_zonas_verdes_user ON zonas_verdes(user_id);
CREATE INDEX idx_zonas_verdes_created ON zonas_verdes(created_at DESC);

-- ==========================================
-- ANALISIS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS analisis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_verde_id UUID NOT NULL REFERENCES zonas_verdes(id) ON DELETE CASCADE,
  tipo_suelo VARCHAR(100),
  exposicion_solar DECIMAL(5,2) CHECK (exposicion_solar >= 0 AND exposicion_solar <= 100),
  humedad_suelo DECIMAL(5,2),
  ph_suelo DECIMAL(3,1),
  ndvi_promedio DECIMAL(4,3),
  especies_recomendadas JSONB,
  coste_estimado DECIMAL(12,2),
  impacto_ambiental_co2_anual DECIMAL(10,2),
  impacto_ambiental_oxigeno_anual DECIMAL(10,2),
  tiempo_implementacion_dias INTEGER,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analisis_zona ON analisis(zona_verde_id);
CREATE INDEX idx_analisis_created ON analisis(created_at DESC);

-- ==========================================
-- PROYECTOS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_verde_id UUID NOT NULL REFERENCES zonas_verdes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  presupuesto DECIMAL(12,2),
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  fecha_fin_real DATE,
  estado VARCHAR(30) CHECK (estado IN ('planificacion', 'aprobado', 'en_curso', 'pausado', 'completado', 'cancelado')) DEFAULT 'planificacion',
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  responsable VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_proyectos_zona ON proyectos(zona_verde_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_fecha_inicio ON proyectos(fecha_inicio DESC);

-- ==========================================
-- IMAGENES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS imagenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona_verde_id UUID REFERENCES zonas_verdes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('satelital', 'foto', 'plano', 'render')),
  descripcion TEXT,
  fecha_captura DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_imagenes_zona ON imagenes(zona_verde_id);
CREATE INDEX idx_imagenes_tipo ON imagenes(tipo);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zonas_verdes_updated_at
  BEFORE UPDATE ON zonas_verdes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analisis_updated_at
  BEFORE UPDATE ON analisis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE municipios IS 'Municipios de España para geolocalización de zonas';
COMMENT ON TABLE especies IS 'Catálogo de especies vegetales para reforestación urbana';
COMMENT ON TABLE zonas_verdes IS 'Zonas identificadas para proyectos de reforestación';
COMMENT ON TABLE analisis IS 'Análisis técnicos de viabilidad de zonas verdes';
COMMENT ON TABLE proyectos IS 'Proyectos de implementación de zonas verdes';
COMMENT ON TABLE imagenes IS 'Imágenes asociadas a zonas verdes (satelitales, fotos, etc)';
