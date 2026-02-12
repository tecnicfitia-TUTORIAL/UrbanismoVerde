-- Rollback: Volver columnas a INTEGER (solo si NO hay valores >2.1B)

ALTER TABLE analisis ALTER COLUMN coste_total_inicial_eur TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN ahorro_anual_eur TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN ahorro_25_anos_eur TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN mantenimiento_anual_eur TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN subvencion_monto_estimado_eur TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN co2_capturado_kg_anual TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN agua_retenida_litros_anual TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN ahorro_energia_kwh_anual TYPE INTEGER;
ALTER TABLE analisis ALTER COLUMN ahorro_energia_eur_anual TYPE INTEGER;
