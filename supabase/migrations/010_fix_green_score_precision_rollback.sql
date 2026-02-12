-- Rollback: Volver green_score a NUMERIC(3,2)
-- ⚠️ ADVERTENCIA: Solo ejecutar si NO hay valores >9.99 en green_score

-- Eliminar constraint
ALTER TABLE analisis DROP CONSTRAINT IF EXISTS green_score_range;

-- Volver a NUMERIC(3,2)
ALTER TABLE analisis 
ALTER COLUMN green_score TYPE NUMERIC(3,2);
