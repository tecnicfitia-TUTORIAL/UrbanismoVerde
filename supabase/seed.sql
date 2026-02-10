-- Seed Data for EcoUrbe AI
-- Populates initial data for testing and development

-- ==========================================
-- SEED MUNICIPIOS
-- ==========================================

INSERT INTO municipios (nombre, provincia, comunidad_autonoma, codigo_postal) VALUES
  ('Madrid', 'Madrid', 'Comunidad de Madrid', '28001'),
  ('Barcelona', 'Barcelona', 'Cataluña', '08001'),
  ('Valencia', 'Valencia', 'Comunidad Valenciana', '46001'),
  ('Sevilla', 'Sevilla', 'Andalucía', '41001'),
  ('Zaragoza', 'Zaragoza', 'Aragón', '50001'),
  ('Málaga', 'Málaga', 'Andalucía', '29001'),
  ('Murcia', 'Murcia', 'Región de Murcia', '30001'),
  ('Las Palmas', 'Las Palmas', 'Canarias', '35001'),
  ('Bilbao', 'Vizcaya', 'País Vasco', '48001'),
  ('Alicante', 'Alicante', 'Comunidad Valenciana', '03001')
ON CONFLICT DO NOTHING;

-- ==========================================
-- SEED ESPECIES
-- ==========================================

INSERT INTO especies (nombre_comun, nombre_cientifico, tipo, altura_max_m, requerimientos_agua, requerimientos_sol, coste_unidad, descripcion, beneficios) VALUES
  ('Encina', 'Quercus ilex', 'arbol', 15.00, 'bajo', 'pleno_sol', 45.00, 
   'Árbol mediterráneo de hoja perenne, muy resistente a la sequía',
   'Absorbe grandes cantidades de CO2, proporciona sombra, hábitat para fauna'),
  
  ('Olivo', 'Olea europaea', 'arbol', 10.00, 'bajo', 'pleno_sol', 35.00,
   'Árbol emblemático mediterráneo, muy longevo y resistente',
   'Produce oxígeno, requiere poco mantenimiento, frutos comestibles'),
  
  ('Pino piñonero', 'Pinus pinea', 'arbol', 20.00, 'bajo', 'pleno_sol', 50.00,
   'Pino característico del paisaje mediterráneo',
   'Gran producción de oxígeno, piñones comestibles, sombra'),
  
  ('Laurel', 'Laurus nobilis', 'arbusto', 8.00, 'medio', 'media_sombra', 25.00,
   'Arbusto aromático mediterráneo de hoja perenne',
   'Planta aromática, resistente, hojas culinarias'),
  
  ('Romero', 'Rosmarinus officinalis', 'arbusto', 1.50, 'bajo', 'pleno_sol', 8.00,
   'Arbusto aromático muy resistente a la sequía',
   'Planta melífera, aromática, medicinal, bajo mantenimiento'),
  
  ('Lavanda', 'Lavandula angustifolia', 'planta', 0.80, 'bajo', 'pleno_sol', 6.00,
   'Planta aromática con flores púrpuras',
   'Atrae polinizadores, aromática, decorativa'),
  
  ('Aloe vera', 'Aloe barbadensis', 'suculenta', 0.60, 'bajo', 'pleno_sol', 12.00,
   'Suculenta medicinal muy resistente',
   'Medicinal, decorativa, muy bajo mantenimiento'),
  
  ('Jacaranda', 'Jacaranda mimosifolia', 'arbol', 15.00, 'medio', 'pleno_sol', 55.00,
   'Árbol ornamental con flores violetas espectaculares',
   'Alta captación de CO2, flores ornamentales, sombra'),
  
  ('Ciprés', 'Cupressus sempervirens', 'arbol', 20.00, 'bajo', 'pleno_sol', 40.00,
   'Conífera mediterránea de porte columnar',
   'Cortavientos, absorbe CO2, bajo mantenimiento'),
  
  ('Adelfa', 'Nerium oleander', 'arbusto', 4.00, 'bajo', 'pleno_sol', 15.00,
   'Arbusto mediterráneo con flores vistosas',
   'Muy resistente, flores ornamentales, bajo mantenimiento'),
  
  ('Madroño', 'Arbutus unedo', 'arbol', 8.00, 'medio', 'media_sombra', 38.00,
   'Árbol autóctono con frutos comestibles',
   'Frutos comestibles, flores melíferas, ornamental'),
  
  ('Lantana', 'Lantana camara', 'arbusto', 2.00, 'bajo', 'pleno_sol', 10.00,
   'Arbusto con flores multicolores',
   'Atrae mariposas, floración continua, bajo mantenimiento'),
  
  ('Palmito', 'Chamaerops humilis', 'arbol', 4.00, 'bajo', 'pleno_sol', 48.00,
   'Única palmera autóctona de Europa continental',
   'Muy resistente, ornamental, bajo mantenimiento'),
  
  ('Tomillo', 'Thymus vulgaris', 'planta', 0.30, 'bajo', 'pleno_sol', 5.00,
   'Planta aromática rastrera',
   'Aromática, culinaria, atrae polinizadores'),
  
  ('Buganvilla', 'Bougainvillea spectabilis', 'arbusto', 10.00, 'medio', 'pleno_sol', 30.00,
   'Arbusto trepador con brácteas coloridas',
   'Muy ornamental, resistente al calor, bajo mantenimiento')
ON CONFLICT DO NOTHING;

-- ==========================================
-- SEED EXAMPLE ZONAS VERDES
-- ==========================================

-- Get Madrid municipio ID for examples
DO $$
DECLARE
  madrid_id UUID;
BEGIN
  SELECT id INTO madrid_id FROM municipios WHERE nombre = 'Madrid' LIMIT 1;

  -- Insert example zones only if Madrid exists
  IF madrid_id IS NOT NULL THEN
    INSERT INTO zonas_verdes (nombre, descripcion, coordenadas, area_m2, viabilidad, estado, municipio_id) VALUES
      ('Azotea Calle Alcalá 123', 
       'Azotea de edificio residencial con excelente exposición solar',
       '{"type": "Polygon", "coordinates": [[[-3.688, 40.420], [-3.687, 40.420], [-3.687, 40.419], [-3.688, 40.419], [-3.688, 40.420]]]}'::jsonb,
       250.00, 'alta', 'propuesta', madrid_id),
      
      ('Solar vacío Barrio Salamanca',
       'Terreno abandonado en zona céntrica, ideal para jardín comunitario',
       '{"type": "Polygon", "coordinates": [[[-3.680, 40.425], [-3.679, 40.425], [-3.679, 40.424], [-3.680, 40.424], [-3.680, 40.425]]]}'::jsonb,
       450.00, 'alta', 'en_analisis', madrid_id),
      
      ('Parking en desuso Retiro',
       'Antiguo parking junto al parque del Retiro',
       '{"type": "Polygon", "coordinates": [[[-3.682, 40.415], [-3.681, 40.415], [-3.681, 40.414], [-3.682, 40.414], [-3.682, 40.415]]]}'::jsonb,
       800.00, 'media', 'propuesta', madrid_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE municipios IS 'Populated with major Spanish cities';
COMMENT ON TABLE especies IS 'Populated with native and adapted species for urban reforestation';
