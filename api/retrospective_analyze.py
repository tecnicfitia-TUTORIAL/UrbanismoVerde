"""
Retrospective Analysis Engine - Backend
Sistema de Análisis Retrospectivo para comparar estado actual vs proyectado

Compara ANTES (baseline: azotea sin vegetación) vs DESPUÉS (proyección: cubierta verde)
Cuantifica beneficios ambientales, económicos y ROI

Basado en:
- IDAE (ahorro energético)
- MITECO 2024 (beneficios ambientales)
- PECV Madrid 2025 (normativa)
- Estudios UE servicios ecosistémicos
"""

from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add parent directory to path to import standards
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from standards.idae_formulas import calculate_energy_savings, calculate_thermal_improvement
from standards.miteco_2024 import calculate_ecosystem_benefits, calculate_economic_value_ecosystem_services
from standards.costs_2024 import get_cost_per_type

# =====================================================
# CONSTANTS
# =====================================================

# Madrid precipitation (mm/year)
PRECIPITACION_MADRID_MM = 400

# Water retention by green roof
RETENCION_AGUA_PCT = 60  # 60% average

# Water cost (€/m³)
COSTE_AGUA_EUR_M3 = 2.0

# Discount rate for NPV calculation
TASA_DESCUENTO = 0.03  # 3%

# =====================================================
# BASELINE CALCULATIONS (Current State - BEFORE)
# =====================================================

def calculate_baseline(data: dict) -> dict:
    """
    Calculate baseline (current state) metrics.
    
    Args:
        data: {
            'tipo_superficie': 'asfalto' | 'hormigon' | 'grava' | 'mixto',
            'area_m2': float,
            'temperatura_verano_c': float (optional),
            'coste_ac_eur_anual': float (optional),
            'coste_calefaccion_eur_anual': float (optional),
            'coste_agua_eur_anual': float (optional),
            'coste_mantenimiento_eur_anual': float (optional)
        }
    
    Returns:
        dict with baseline metrics
    """
    area_m2 = float(data.get('area_m2', 0))
    
    # Environmental baseline
    baseline_temp = float(data.get('temperatura_verano_c', 34.0))  # Default: Madrid summer
    baseline_co2 = 0  # No vegetation
    baseline_runoff = 100.0  # 100% runoff (no retention)
    baseline_biodiversidad = 0
    
    # Urban heat island intensity (0-10 scale based on surface type)
    tipo_superficie = data.get('tipo_superficie', 'asfalto')
    isla_calor_map = {
        'asfalto': 8,
        'hormigon': 7,
        'grava': 6,
        'mixto': 7
    }
    isla_calor = isla_calor_map.get(tipo_superficie, 7)
    
    # Operational costs (current)
    # Use provided values or calculate estimates
    coste_ac = float(data.get('coste_ac_eur_anual', area_m2 * 15))  # €15/m²/year default
    coste_calefaccion = float(data.get('coste_calefaccion_eur_anual', area_m2 * 12))  # €12/m²/year
    coste_agua = float(data.get('coste_agua_eur_anual', area_m2 * 2))  # €2/m²/year for drainage
    coste_mant = float(data.get('coste_mantenimiento_eur_anual', area_m2 * 5))  # €5/m²/year
    coste_total = coste_ac + coste_calefaccion + coste_agua + coste_mant
    
    return {
        'fecha': data.get('fecha', None),
        'tipo_superficie': tipo_superficie,
        'area_m2': area_m2,
        'area_impermeabilizada_pct': 100.0,
        'vegetacion_existente_m2': 0,
        'temperatura_verano_c': baseline_temp,
        'isla_calor_intensidad': isla_calor,
        'runoff_agua_pct': baseline_runoff,
        'co2_captura_kg_anual': baseline_co2,
        'biodiversidad_indice': baseline_biodiversidad,
        'coste_ac_eur_anual': round(coste_ac, 2),
        'coste_calefaccion_eur_anual': round(coste_calefaccion, 2),
        'coste_gestion_agua_eur_anual': round(coste_agua, 2),
        'coste_mantenimiento_eur_anual': round(coste_mant, 2),
        'coste_total_eur_anual': round(coste_total, 2)
    }


# =====================================================
# PROJECTION CALCULATIONS (Future State - AFTER)
# =====================================================

def calculate_projection(data: dict, baseline: dict) -> dict:
    """
    Calculate projection (future state with green roof) metrics.
    
    Args:
        data: {
            'tipo_cubierta': 'extensiva' | 'intensiva' | 'semi-intensiva',
            'area_verde_m2': float,
            'anos_horizonte': 1 | 5 | 10 | 25,
            'especies': list of species names (optional),
            'sustrato_espesor_cm': int (optional),
            'sistema_riego': 'goteo' | 'manual' | 'ninguno' (optional)
        }
        baseline: Output from calculate_baseline()
    
    Returns:
        dict with projection metrics
    """
    tipo_cubierta = data.get('tipo_cubierta', 'extensiva')
    area_verde_m2 = float(data.get('area_verde_m2', baseline['area_m2']))
    anos_horizonte = int(data.get('anos_horizonte', 25))
    especies = data.get('especies', [])
    
    # Validate area
    if area_verde_m2 > baseline['area_m2']:
        area_verde_m2 = baseline['area_m2']
    
    # ==========================================
    # ENVIRONMENTAL IMPROVEMENTS
    # ==========================================
    
    # Temperature reduction using IDAE methodology
    thermal_data = calculate_thermal_improvement(area_verde_m2, tipo_cubierta)
    reduccion_temp = thermal_data['reduccion_temperatura_c']
    
    # Water retention using MITECO methodology
    ecosystem_benefits = calculate_ecosystem_benefits(area_verde_m2, tipo_cubierta)
    retencion_agua_pct = ecosystem_benefits['porcentaje_retencion_agua']
    agua_retenida_m3 = ecosystem_benefits['agua_retenida_m3_anual']
    
    # CO₂ capture
    co2_adicional = ecosystem_benefits['co2_capturado_kg_anual']
    
    # Biodiversity improvement (%)
    biodiversidad_mejora_pct = 30 if tipo_cubierta == 'intensiva' else 20
    
    # Noise reduction
    reduccion_ruido_db = round(5 + (area_verde_m2 / 100), 1)
    
    # ==========================================
    # ECONOMIC SAVINGS
    # ==========================================
    
    # Energy savings using IDAE methodology
    energy_savings = calculate_energy_savings(area_verde_m2, tipo_cubierta)
    reduccion_ac = energy_savings['desglose']['refrigeracion_eur']
    reduccion_calef = energy_savings['desglose']['calefaccion_eur']
    
    # Water management value
    valor_agua = ecosystem_benefits['valor_retencion_agua_eur_anual']
    
    # Total annual savings
    ahorro_total_anual = reduccion_ac + reduccion_calef + valor_agua
    ahorro_25_anos = ahorro_total_anual * 25
    
    # ==========================================
    # INVESTMENT COSTS
    # ==========================================
    
    # Initial cost (€/m²) varies by roof type
    # Using midpoint of cost range from costs_2024.py
    coste_m2_map = {
        'extensiva': 115,      # Average of 80-150
        'semi-intensiva': 175,  # Between extensiva and intensiva
        'intensiva': 200        # Average of 150-250
    }
    coste_m2 = coste_m2_map.get(tipo_cubierta, 115)
    coste_inicial = area_verde_m2 * coste_m2
    
    # Annual maintenance (3-5% of initial cost)
    mantenimiento_pct = 0.05 if tipo_cubierta == 'intensiva' else 0.03
    mantenimiento_anual = coste_inicial * mantenimiento_pct
    
    # Subsidies (PECV Madrid: 40-50% for green roofs)
    subvencion_pct = 0.45  # 45% average
    subvenciones = coste_inicial * subvencion_pct
    coste_neto = coste_inicial - subvenciones
    
    return {
        'anos_horizonte': anos_horizonte,
        'tipo_cubierta': tipo_cubierta,
        'area_verde_m2': area_verde_m2,
        'sustrato_espesor_cm': data.get('sustrato_espesor_cm', 15 if tipo_cubierta == 'extensiva' else 30),
        'sistema_riego': data.get('sistema_riego', 'goteo' if tipo_cubierta == 'intensiva' else 'ninguno'),
        
        # Environmental improvements
        'reduccion_temperatura_c': round(reduccion_temp, 2),
        'retencion_agua_pct': round(retencion_agua_pct, 2),
        'co2_adicional_kg_anual': round(co2_adicional, 2),
        'biodiversidad_mejora_pct': round(biodiversidad_mejora_pct, 2),
        'reduccion_ruido_db': round(reduccion_ruido_db, 2),
        
        # Economic savings
        'reduccion_ac_eur_anual': round(reduccion_ac, 2),
        'reduccion_calef_eur_anual': round(reduccion_calef, 2),
        'valor_agua_retenida_eur_anual': round(valor_agua, 2),
        'ahorro_total_anual': round(ahorro_total_anual, 2),
        'ahorro_acumulado_25_anos': round(ahorro_25_anos, 2),
        
        # Investment
        'coste_inicial_eur': round(coste_inicial, 2),
        'mantenimiento_anual_eur': round(mantenimiento_anual, 2),
        'subvenciones_disponibles_eur': round(subvenciones, 2),
        'coste_neto_inicial_eur': round(coste_neto, 2),
        
        # Species
        'especies_seleccionadas': especies
    }


# =====================================================
# COMPARISON (DELTAS: BEFORE vs AFTER)
# =====================================================

def calculate_comparison(baseline: dict, projection: dict) -> dict:
    """
    Calculate deltas between baseline and projection.
    
    Args:
        baseline: Output from calculate_baseline()
        projection: Output from calculate_projection()
    
    Returns:
        dict with delta values
    """
    # Temperature delta (negative = improvement/cooling)
    delta_temp = -(projection['reduccion_temperatura_c'])
    
    # CO₂ delta (positive = more capture)
    delta_co2 = projection['co2_adicional_kg_anual'] - baseline['co2_captura_kg_anual']
    
    # Water retention delta (m³/year, positive = more retention)
    # Baseline retains 0%, projection retains X%
    agua_retenida_m3 = (baseline['area_m2'] * PRECIPITACION_MADRID_MM / 1000) * (projection['retencion_agua_pct'] / 100)
    delta_agua = agua_retenida_m3
    
    # Cost delta (negative = savings)
    # Net cost after considering maintenance
    ahorro_bruto = projection['ahorro_total_anual']
    coste_mant = projection['mantenimiento_anual_eur']
    delta_costes = -(ahorro_bruto - coste_mant)  # Negative = net savings
    
    # Biodiversity delta (%)
    delta_biodiversidad = projection['biodiversidad_mejora_pct']
    
    return {
        'delta_temperatura_c': round(delta_temp, 2),
        'delta_co2_kg_anual': round(delta_co2, 2),
        'delta_agua_retenida_m3_anual': round(delta_agua, 2),
        'delta_costes_eur_anual': round(delta_costes, 2),
        'delta_biodiversidad_pct': round(delta_biodiversidad, 2)
    }


# =====================================================
# ROI CALCULATION
# =====================================================

def calculate_roi(projection: dict, comparison: dict) -> dict:
    """
    Calculate ROI, payback period, and Net Present Value (NPV).
    
    Args:
        projection: Output from calculate_projection()
        comparison: Output from calculate_comparison()
    
    Returns:
        dict with ROI metrics
    """
    coste_inicial = projection['coste_neto_inicial_eur']
    ahorro_anual = projection['ahorro_total_anual']
    mantenimiento_anual = projection['mantenimiento_anual_eur']
    anos = projection['anos_horizonte']
    
    # Net annual benefit (savings minus maintenance)
    beneficio_neto_anual = ahorro_anual - mantenimiento_anual
    
    # ROI percentage (annual)
    roi_pct = (beneficio_neto_anual / coste_inicial * 100) if coste_inicial > 0 else 0
    
    # Payback period (years)
    payback = coste_inicial / beneficio_neto_anual if beneficio_neto_anual > 0 else 999
    
    # Net Present Value (NPV) with 3% discount rate
    vnp = -coste_inicial
    for ano in range(1, anos + 1):
        vnp += beneficio_neto_anual / ((1 + TASA_DESCUENTO) ** ano)
    
    return {
        'roi_porcentaje': round(roi_pct, 2),
        'payback_anos': round(payback, 1),
        'vnp_25_anos_eur': round(vnp, 2)
    }


# =====================================================
# TIMELINE GENERATION (25 years)
# =====================================================

def generate_timeline(projection: dict, comparison: dict, anos: int = 25) -> list:
    """
    Generate year-by-year timeline of accumulated benefits.
    
    Args:
        projection: Output from calculate_projection()
        comparison: Output from calculate_comparison()
        anos: Number of years to project
    
    Returns:
        list of timeline points
    """
    ahorro_anual = projection['ahorro_total_anual']
    mantenimiento_anual = projection['mantenimiento_anual_eur']
    beneficio_neto_anual = ahorro_anual - mantenimiento_anual
    
    co2_anual = projection['co2_adicional_kg_anual']
    agua_m3_anual = comparison['delta_agua_retenida_m3_anual']
    
    timeline = []
    for ano in range(1, anos + 1):
        timeline.append({
            'ano': ano,
            'beneficio_acumulado_eur': round(beneficio_neto_anual * ano, 2),
            'co2_acumulado_kg': round(co2_anual * ano, 2),
            'agua_acumulada_m3': round(agua_m3_anual * ano, 2)
        })
    
    return timeline


# =====================================================
# ECOSYSTEM VALUE CALCULATION
# =====================================================

def calculate_ecosystem_value(projection: dict, baseline: dict) -> dict:
    """
    Calculate total ecosystem services value using EU methodology.
    
    Args:
        projection: Output from calculate_projection()
        baseline: Output from calculate_baseline()
    
    Returns:
        dict with ecosystem value and quality of life index
    """
    area_m2 = projection['area_verde_m2']
    
    # Get ecosystem benefits from MITECO
    eco_benefits = calculate_ecosystem_benefits(area_m2, projection['tipo_cubierta'])
    
    # Calculate economic value
    eco_value = calculate_economic_value_ecosystem_services(eco_benefits, area_m2)
    
    # Total value over 25 years
    valor_total_25_anos = eco_value['valor_25_anos_eur']
    
    # Quality of life improvement index (0-10 scale)
    # Based on area size, temperature reduction, biodiversity
    temp_factor = min(projection['reduccion_temperatura_c'] / 2, 1)  # Max 1
    area_factor = min(area_m2 / 500, 1)  # Max 1 at 500m²
    bio_factor = projection['biodiversidad_mejora_pct'] / 100
    
    calidad_vida_indice = int((temp_factor + area_factor + bio_factor) / 3 * 10)
    calidad_vida_indice = max(1, min(10, calidad_vida_indice))  # Clamp 1-10
    
    return {
        'valor_ecosistemico_total_eur': round(valor_total_25_anos, 2),
        'mejora_calidad_vida_indice': calidad_vida_indice,
        'desglose_ecosistemico': {
            'valor_co2_eur_anual': eco_value['valor_co2_eur_anual'],
            'valor_agua_eur_anual': eco_value['valor_agua_eur_anual'],
            'valor_aire_eur_anual': eco_value['valor_aire_eur_anual'],
            'valor_total_anual_eur': eco_value['valor_total_anual_eur']
        }
    }


# =====================================================
# MAIN HANDLER
# =====================================================

class handler(BaseHTTPRequestHandler):
    """
    Main HTTP handler for retrospective analysis API endpoint.
    
    POST /api/retrospective_analyze
    
    Request body:
    {
        "zona_verde_id": "uuid" (optional),
        "nombre": "string" (optional),
        "baseline": {
            "tipo_superficie": "asfalto",
            "area_m2": 500,
            "temperatura_verano_c": 34,
            "coste_ac_eur_anual": 8000,
            "coste_calefaccion_eur_anual": 4000
        },
        "projection": {
            "tipo_cubierta": "extensiva",
            "area_verde_m2": 500,
            "anos_horizonte": 25,
            "especies": ["Lavanda", "Romero", "Tomillo"]
        }
    }
    """
    
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Validate required fields
            if 'baseline' not in data or 'projection' not in data:
                self.send_error(400, "Missing required fields: baseline, projection")
                return
            
            # Extract data
            baseline_data = data['baseline']
            projection_data = data['projection']
            zona_verde_id = data.get('zona_verde_id')
            nombre = data.get('nombre', 'Análisis Retrospectivo')
            
            # Validate baseline required fields
            if 'area_m2' not in baseline_data or 'tipo_superficie' not in baseline_data:
                self.send_error(400, "Baseline missing required fields: area_m2, tipo_superficie")
                return
            
            # Validate projection required fields
            if 'tipo_cubierta' not in projection_data:
                self.send_error(400, "Projection missing required field: tipo_cubierta")
                return
            
            # ==========================================
            # PERFORM CALCULATIONS
            # ==========================================
            
            # 1. Calculate baseline
            baseline = calculate_baseline(baseline_data)
            
            # 2. Calculate projection
            projection = calculate_projection(projection_data, baseline)
            
            # 3. Calculate comparison (deltas)
            comparison = calculate_comparison(baseline, projection)
            
            # 4. Calculate ROI
            roi = calculate_roi(projection, comparison)
            
            # 5. Generate timeline
            timeline = generate_timeline(projection, comparison, projection['anos_horizonte'])
            
            # 6. Calculate ecosystem value
            eco_value = calculate_ecosystem_value(projection, baseline)
            
            # ==========================================
            # BUILD RESPONSE
            # ==========================================
            
            response = {
                'success': True,
                'retrospective_id': None,  # Would be populated after DB insert
                'zona_verde_id': zona_verde_id,
                'nombre': nombre,
                'baseline': baseline,
                'projection': projection,
                'comparison': comparison,
                'roi': roi,
                'timeline': timeline,
                'valor_ecosistemico_total_eur': eco_value['valor_ecosistemico_total_eur'],
                'mejora_calidad_vida_indice': eco_value['mejora_calidad_vida_indice'],
                'desglose_ecosistemico': eco_value['desglose_ecosistemico'],
                'metadata': {
                    'version': '1.0',
                    'metodologia': {
                        'energia': 'IDAE 2024',
                        'ecosistema': 'MITECO 2024',
                        'normativa': 'PECV Madrid 2025',
                        'roi': 'VNP con tasa descuento 3%'
                    }
                }
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except json.JSONDecodeError as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {
                'success': False,
                'error': 'Invalid JSON',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {
                'success': False,
                'error': 'Internal server error',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
