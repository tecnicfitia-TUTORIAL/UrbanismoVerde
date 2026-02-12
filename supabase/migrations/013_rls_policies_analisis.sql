-- Migración: RLS Policies para tabla analisis
-- Fecha: 2026-02-12
-- Propósito: Crear políticas públicas para SELECT/INSERT/UPDATE/DELETE en analisis

-- ⚠️ SECURITY WARNING: These policies allow unrestricted access for TESTING ONLY
-- For production environments:
-- 1. Use a separate database with restricted policies
-- 2. Implement authentication-based policies (see 002_enable_rls.sql for examples)
-- 3. Add user_id validation and role-based access control

-- Habilitar RLS
ALTER TABLE analisis ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir SELECT público (lectura abierta)
CREATE POLICY "Allow public SELECT on analisis"
ON analisis
FOR SELECT
USING (true);

-- Política 2: Permitir INSERT público (para testing sin auth)
CREATE POLICY "Allow public INSERT on analisis"
ON analisis
FOR INSERT
WITH CHECK (true);

-- Política 3: Permitir UPDATE público
CREATE POLICY "Allow public UPDATE on analisis"
ON analisis
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política 4: Permitir DELETE público
CREATE POLICY "Allow public DELETE on analisis"
ON analisis
FOR DELETE
USING (true);

-- Nota: Para producción, considerar políticas más restrictivas:
-- - Restringir INSERT/UPDATE/DELETE solo a usuarios autenticados
-- - Agregar validación de user_id
-- - Implementar roles (admin, user, viewer)
