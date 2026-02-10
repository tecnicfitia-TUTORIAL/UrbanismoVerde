-- EcoUrbe AI - Database Schema
-- PostgreSQL 15+ con PostGIS
-- Clean Architecture - Infrastructure Layer

-- ==========================================
-- EXTENSIONES
-- ==========================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- TIPOS ENUMERADOS
-- ==========================================

-- Roles de usuario en el sistema
CREATE TYPE rol_usuario AS ENUM (
    'superadmin',
    'administrador_municipal',
    'analista',
    'ciudadano',
    'invitado'
);

-- Tipos de zonas detectables para reforestación
CREATE TYPE tipo_zona AS ENUM (
    'azotea',
    'solar_vacio',
    'parque_degradado',
    'espacio_abandonado',
    'zona_industrial',
    'otro'
);

-- Estados del ciclo de vida de una zona
CREATE TYPE estado_zona AS ENUM (
    'detectada',
    'en_analisis',
    'viable',
    'no_viable',
    'en_proyecto',
    'completada'
);

-- Estados de proyectos de reforestación
CREATE TYPE estado_proyecto AS ENUM (
    'propuesto',
    'aprobado',
    'en_ejecucion',
    'completado',
    'suspendido',
    'cancelado'
);

-- Tipos de suelo detectables
CREATE TYPE tipo_suelo AS ENUM (
    'arcilloso',
    'arenoso',
    'limoso',
    'rocoso',
    'humifero',
    'mixto',
    'artificial'
);

-- Niveles de viabilidad para proyectos
CREATE TYPE nivel_viabilidad AS ENUM (
    'alta',
    'media',
    'baja',
    'no_viable'
);

-- ==========================================
-- TABLA: usuarios
-- Gestión de usuarios del sistema
-- ==========================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'ciudadano',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ==========================================
-- TABLA: municipios
-- Almacena límites administrativos de ciudades
-- ==========================================

CREATE TABLE municipios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    codigo_ine VARCHAR(10) UNIQUE NOT NULL,
    perimetro GEOMETRY(Polygon, 4326) NOT NULL,
    centroide GEOMETRY(Point, 4326),
    poblacion INTEGER,
    area_km2 NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices espaciales
CREATE INDEX idx_municipios_perimetro ON municipios USING GIST(perimetro);
CREATE INDEX idx_municipios_centroide ON municipios USING GIST(centroide);
CREATE INDEX idx_municipios_codigo_ine ON municipios(codigo_ine);

-- ==========================================
-- TABLA: zonas_verdes
-- Zonas detectadas para reforestación
-- ==========================================

CREATE TABLE zonas_verdes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    tipo tipo_zona NOT NULL,
    estado estado_zona DEFAULT 'detectada',
    geometria GEOMETRY(Polygon, 4326) NOT NULL,
    centroide GEOMETRY(Point, 4326),
    area_m2 NUMERIC(12, 2),
    nivel_viabilidad nivel_viabilidad,
    detectada_por_ia BOOLEAN DEFAULT false,
    municipio_id UUID REFERENCES municipios(id),
    usuario_creador_id UUID REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices espaciales y de búsqueda
CREATE INDEX idx_zonas_verdes_geometria ON zonas_verdes USING GIST(geometria);
CREATE INDEX idx_zonas_verdes_centroide ON zonas_verdes USING GIST(centroide);
CREATE INDEX idx_zonas_verdes_codigo ON zonas_verdes(codigo);
CREATE INDEX idx_zonas_verdes_tipo ON zonas_verdes(tipo);
CREATE INDEX idx_zonas_verdes_estado ON zonas_verdes(estado);
CREATE INDEX idx_zonas_verdes_municipio ON zonas_verdes(municipio_id);

-- ==========================================
-- TABLA: analisis_ia
-- Resultados de análisis por IA
-- ==========================================

CREATE TABLE analisis_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona_verde_id UUID REFERENCES zonas_verdes(id) ON DELETE CASCADE,
    modelo_ia VARCHAR(100) NOT NULL,
    version_modelo VARCHAR(50),
    tipo_suelo_detectado tipo_suelo,
    horas_sol_promedio NUMERIC(4, 2),
    ndvi_promedio NUMERIC(4, 3),
    humedad_suelo_pct NUMERIC(5, 2),
    pendiente_promedio NUMERIC(5, 2),
    datos_raw JSONB,
    confianza_analisis NUMERIC(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_analisis_ia_zona ON analisis_ia(zona_verde_id);
CREATE INDEX idx_analisis_ia_modelo ON analisis_ia(modelo_ia);
CREATE INDEX idx_analisis_ia_datos_raw ON analisis_ia USING GIN(datos_raw);

-- ==========================================
-- TABLA: especies_vegetales
-- Catálogo de especies para reforestación
-- ==========================================

CREATE TABLE especies_vegetales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_comun VARCHAR(255) NOT NULL,
    nombre_cientifico VARCHAR(255) UNIQUE NOT NULL,
    familia VARCHAR(100),
    descripcion TEXT,
    altura_maxima_m NUMERIC(5, 2),
    captacion_co2_kg_anio NUMERIC(8, 2) NOT NULL,
    coste_unitario_eur NUMERIC(8, 2) NOT NULL,
    tipo_suelo_preferido tipo_suelo[],
    horas_sol_minimas NUMERIC(4, 2),
    resistencia_sequia BOOLEAN DEFAULT false,
    nativa_region BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_especies_nombre_cientifico ON especies_vegetales(nombre_cientifico);
CREATE INDEX idx_especies_nombre_comun ON especies_vegetales USING GIN(nombre_comun gin_trgm_ops);

-- ==========================================
-- TABLA: proyectos_verde
-- Proyectos de reforestación
-- ==========================================

CREATE TABLE proyectos_verde (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado estado_proyecto DEFAULT 'propuesto',
    zona_verde_id UUID REFERENCES zonas_verdes(id),
    municipio_id UUID REFERENCES municipios(id),
    presupuesto_total_eur NUMERIC(12, 2) NOT NULL,
    presupuesto_ejecutado_eur NUMERIC(12, 2) DEFAULT 0,
    numero_arboles_objetivo INTEGER NOT NULL,
    numero_arboles_plantados INTEGER DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    responsable_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_proyectos_codigo ON proyectos_verde(codigo);
CREATE INDEX idx_proyectos_estado ON proyectos_verde(estado);
CREATE INDEX idx_proyectos_zona ON proyectos_verde(zona_verde_id);
CREATE INDEX idx_proyectos_municipio ON proyectos_verde(municipio_id);
CREATE INDEX idx_proyectos_responsable ON proyectos_verde(responsable_id);

-- ==========================================
-- TABLA: proyecto_especies
-- Relación M:N entre proyectos y especies
-- ==========================================

CREATE TABLE proyecto_especies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES proyectos_verde(id) ON DELETE CASCADE,
    especie_id UUID REFERENCES especies_vegetales(id),
    cantidad_planificada INTEGER NOT NULL,
    cantidad_plantada INTEGER DEFAULT 0,
    ubicaciones GEOMETRY(MultiPoint, 4326),
    coste_total_eur NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proyecto_id, especie_id)
);

-- Índices
CREATE INDEX idx_proyecto_especies_proyecto ON proyecto_especies(proyecto_id);
CREATE INDEX idx_proyecto_especies_especie ON proyecto_especies(especie_id);
CREATE INDEX idx_proyecto_especies_ubicaciones ON proyecto_especies USING GIST(ubicaciones);

-- ==========================================
-- TABLA: seguimiento_proyectos
-- Registro de actividades en proyectos
-- ==========================================

CREATE TABLE seguimiento_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES proyectos_verde(id) ON DELETE CASCADE,
    fecha_actividad DATE NOT NULL,
    tipo_actividad VARCHAR(100) NOT NULL,
    descripcion TEXT,
    coste_actividad_eur NUMERIC(10, 2) DEFAULT 0,
    responsable_id UUID REFERENCES usuarios(id),
    evidencias JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_seguimiento_proyecto ON seguimiento_proyectos(proyecto_id);
CREATE INDEX idx_seguimiento_fecha ON seguimiento_proyectos(fecha_actividad);
CREATE INDEX idx_seguimiento_tipo ON seguimiento_proyectos(tipo_actividad);

-- ==========================================
-- TABLA: metricas_impacto
-- Métricas de impacto ambiental y social
-- ==========================================

CREATE TABLE metricas_impacto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES proyectos_verde(id) ON DELETE CASCADE,
    fecha_medicion DATE NOT NULL,
    co2_capturado_kg NUMERIC(12, 2),
    oxigeno_producido_kg NUMERIC(12, 2),
    agua_retenida_litros NUMERIC(12, 2),
    temperatura_reduccion_c NUMERIC(4, 2),
    biodiversidad_especies INTEGER,
    visitantes_estimados INTEGER,
    satisfaccion_ciudadana NUMERIC(3, 2),
    empleo_generado INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_metricas_proyecto ON metricas_impacto(proyecto_id);
CREATE INDEX idx_metricas_fecha ON metricas_impacto(fecha_medicion);

-- ==========================================
-- TABLA: auditoria
-- Registro de auditoría de cambios
-- ==========================================

CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabla VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    accion VARCHAR(50) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX idx_auditoria_registro ON auditoria(registro_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_created ON auditoria(created_at);

-- ==========================================
-- FUNCIONES Y TRIGGERS
-- ==========================================

-- Función: Calcular automáticamente centroide y área de zonas verdes
CREATE OR REPLACE FUNCTION calcular_centroide_zona()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular centroide
    NEW.centroide := ST_Centroid(NEW.geometria);
    
    -- Calcular área en metros cuadrados
    -- ST_Area devuelve área en unidades de la proyección (grados para 4326)
    -- Por eso usamos ST_Transform a una proyección métrica (3857 - Web Mercator)
    NEW.area_m2 := ST_Area(ST_Transform(NEW.geometria, 3857));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Aplicar función de cálculo automático
CREATE TRIGGER trigger_zonas_calcular_centroide
    BEFORE INSERT OR UPDATE OF geometria
    ON zonas_verdes
    FOR EACH ROW
    EXECUTE FUNCTION calcular_centroide_zona();

-- Función: Actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at a tablas relevantes
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_municipios_updated_at
    BEFORE UPDATE ON municipios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_zonas_verdes_updated_at
    BEFORE UPDATE ON zonas_verdes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_especies_updated_at
    BEFORE UPDATE ON especies_vegetales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_proyectos_updated_at
    BEFORE UPDATE ON proyectos_verde
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- ==========================================
-- DATOS SEMILLA (SEED DATA)
-- ==========================================

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Administrador EcoUrbe',
    'admin@ecourbe.ai',
    '$2a$10$rQ8KqKqKqKqKqKqKqKqKqOJ3h3h3h3h3h3h3h3h3h3h3h3h3h3h', -- Hash ficticio
    'superadmin'
);

-- Especies vegetales mediterráneas para reforestación urbana

-- 1. Olivo (Olea europaea)
INSERT INTO especies_vegetales (
    nombre_comun,
    nombre_cientifico,
    familia,
    descripcion,
    altura_maxima_m,
    captacion_co2_kg_anio,
    coste_unitario_eur,
    tipo_suelo_preferido,
    horas_sol_minimas,
    resistencia_sequia,
    nativa_region
) VALUES (
    'Olivo',
    'Olea europaea',
    'Oleaceae',
    'Árbol perenne mediterráneo de gran resistencia y valor cultural. Excelente para captura de CO2 y adaptación urbana.',
    12.00,
    250.50,
    45.00,
    ARRAY['arcilloso', 'limoso', 'mixto']::tipo_suelo[],
    6.00,
    true,
    true
);

-- 2. Lavándula (Lavandula angustifolia)
INSERT INTO especies_vegetales (
    nombre_comun,
    nombre_cientifico,
    familia,
    descripcion,
    altura_maxima_m,
    captacion_co2_kg_anio,
    coste_unitario_eur,
    tipo_suelo_preferido,
    horas_sol_minimas,
    resistencia_sequia,
    nativa_region
) VALUES (
    'Lavándula',
    'Lavandula angustifolia',
    'Lamiaceae',
    'Arbusto aromático de bajo mantenimiento. Atrae polinizadores y requiere poco riego.',
    1.20,
    15.75,
    8.50,
    ARRAY['arenoso', 'rocoso', 'mixto']::tipo_suelo[],
    7.00,
    true,
    true
);

-- 3. Romero (Rosmarinus officinalis)
INSERT INTO especies_vegetales (
    nombre_comun,
    nombre_cientifico,
    familia,
    descripcion,
    altura_maxima_m,
    captacion_co2_kg_anio,
    coste_unitario_eur,
    tipo_suelo_preferido,
    horas_sol_minimas,
    resistencia_sequia,
    nativa_region
) VALUES (
    'Romero',
    'Rosmarinus officinalis',
    'Lamiaceae',
    'Arbusto aromático perenne de gran resistencia. Ideal para taludes y zonas de bajo mantenimiento.',
    1.80,
    22.30,
    6.75,
    ARRAY['arenoso', 'rocoso', 'arcilloso']::tipo_suelo[],
    6.50,
    true,
    true
);

-- ==========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles y permisos diferenciados';
COMMENT ON TABLE municipios IS 'Límites administrativos de municipios con datos geoespaciales';
COMMENT ON TABLE zonas_verdes IS 'Zonas detectadas o propuestas para proyectos de reforestación';
COMMENT ON TABLE analisis_ia IS 'Resultados de análisis automático mediante IA y visión por computador';
COMMENT ON TABLE especies_vegetales IS 'Catálogo de especies vegetales disponibles para plantación';
COMMENT ON TABLE proyectos_verde IS 'Proyectos de regeneración urbana y reforestación';
COMMENT ON TABLE proyecto_especies IS 'Especies planificadas en cada proyecto con cantidades y ubicaciones';
COMMENT ON TABLE seguimiento_proyectos IS 'Historial de actividades y seguimiento de proyectos';
COMMENT ON TABLE metricas_impacto IS 'Métricas de impacto ambiental, social y económico';
COMMENT ON TABLE auditoria IS 'Registro de auditoría para trazabilidad de cambios';

COMMENT ON FUNCTION calcular_centroide_zona() IS 'Calcula automáticamente el centroide y área en m² de geometrías de zonas verdes';
COMMENT ON FUNCTION actualizar_updated_at() IS 'Actualiza automáticamente el timestamp de modificación';
