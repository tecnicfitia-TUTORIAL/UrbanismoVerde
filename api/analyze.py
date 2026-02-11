"""
Intelligent Analysis Engine with 3-Layer Architecture

Transform green roof analysis from hardcoded values to intelligent system based on:
- PECV Madrid 2025 Factor Verde (official formula)
- Simulated Computer Vision (OpenCV-ready)
- MITECO 2024 ecosystem benefits
- Native Spanish species
- Real ROI calculations

Architecture:
- Layer 1: Geospatial (normativa PECV Madrid)
- Layer 2: Computer Vision (simulated, OpenCV-ready)
- Layer 3: Value Generation (reports, ROI, species)
"""

from http.server import BaseHTTPRequestHandler
import json
import time

# Import standards
from standards.pecv_madrid import (
    calculate_factor_verde, 
    validate_requirements, 
    get_orientation_from_solar_hours
)
from standards.species_spain import (
    get_species_by_exposure,
    calculate_plant_quantities,
    get_native_species_percentage
)
from standards.costs_2024 import calculate_budget
from standards.idae_formulas import calculate_energy_savings
from standards.miteco_2024 import (
    calculate_ecosystem_benefits,
    calculate_biodiversity_impact,
    calculate_economic_value_ecosystem_services
)

# Import utilities
from utils.geospatial import (
    calculate_area_haversine,
    calculate_perimeter,
    get_center_coordinates,
    calculate_slope_from_area_and_perimeter
)
from utils.computer_vision import (
    segment_surfaces,
    analyze_solar_exposure,
    calculate_ndvi
)
from utils.subsidy_zones import (
    check_subsidy_eligibility,
    calculate_subsidy_amount
)


class AnalysisEngine:
    """
    Main analysis engine implementing 3-layer architecture.
    """
    
    def __init__(self, polygon: dict):
        """
        Initialize analysis engine.
        
        Args:
            polygon: GeoJSON polygon with coordinates
        """
        self.polygon = polygon
        self.coordinates = polygon.get('coordinates', [[]])[0]
        
        # Get center location
        self.center_lat, self.center_lon = get_center_coordinates(self.coordinates)
        
    def analyze(self) -> dict:
        """
        Execute complete 3-layer analysis.
        
        Returns:
            Complete analysis report
        """
        start_time = time.time()
        
        # LAYER 1: Geospatial (Normativa)
        geo_data = self.geospatial_layer()
        
        # LAYER 2: Computer Vision
        vision_data = self.computer_vision_layer(geo_data)
        
        # LAYER 3: Value Generation
        report = self.value_generation_layer(geo_data, vision_data)
        
        # Add processing time
        processing_time = time.time() - start_time
        report['processing_time'] = round(processing_time, 2)
        
        return report
    
    def geospatial_layer(self) -> dict:
        """
        LAYER 1: Geospatial Analysis (Normativa PECV Madrid 2025)
        
        - Calculate accurate area and perimeter using Haversine
        - Calculate Factor Verde (official formula)
        - Validate PECV Madrid requirements
        - Check subsidy eligibility
        
        Returns:
            dict with geospatial and regulatory data
        """
        # Calculate area and perimeter
        area_m2 = calculate_area_haversine(self.coordinates)
        perimetro_m = calculate_perimeter(self.coordinates)
        
        # Estimate slope (simplified - in production would use DEM data)
        inclinacion_grados = calculate_slope_from_area_and_perimeter(area_m2, perimetro_m)
        
        # Check subsidy eligibility
        subsidy_info = check_subsidy_eligibility(self.center_lat, self.center_lon)
        
        return {
            'area_m2': area_m2,
            'perimetro_m': perimetro_m,
            'inclinacion_grados': inclinacion_grados,
            'center_lat': self.center_lat,
            'center_lon': self.center_lon,
            'subsidy_info': subsidy_info
        }
    
    def computer_vision_layer(self, geo_data: dict) -> dict:
        """
        LAYER 2: Computer Vision Analysis (Simulated)
        
        - Segment surfaces (asphalt, gravel, vegetation, obstacles)
        - Analyze solar exposure
        - Calculate current NDVI
        
        In production: integrate real OpenCV with satellite imagery
        
        Args:
            geo_data: Data from geospatial layer
            
        Returns:
            dict with computer vision analysis
        """
        area_m2 = geo_data['area_m2']
        
        # Surface segmentation
        segmentation = segment_surfaces(area_m2)
        
        # Solar exposure analysis
        solar_data = analyze_solar_exposure(
            geo_data['center_lat'], 
            geo_data['center_lon'],
            area_m2
        )
        
        # NDVI calculation
        ndvi_actual = calculate_ndvi(
            area_m2, 
            segmentation['vegetacion_previa_m2']
        )
        
        return {
            'segmentation': segmentation,
            'solar_data': solar_data,
            'ndvi_actual': ndvi_actual
        }
    
    def value_generation_layer(self, geo_data: dict, vision_data: dict) -> dict:
        """
        LAYER 3: Value Generation (Reports, ROI, Species)
        
        - Calculate Factor Verde
        - Recommend native species
        - Calculate detailed budget
        - Quantify ecosystem benefits
        - Calculate ROI
        - Generate Green Score
        
        Args:
            geo_data: Data from geospatial layer
            vision_data: Data from computer vision layer
            
        Returns:
            Complete analysis report
        """
        area_m2 = geo_data['area_m2']
        area_util_m2 = vision_data['segmentation']['area_util_m2']
        
        # Get solar classification
        clasificacion_solar = vision_data['solar_data']['clasificacion']
        horas_sol = vision_data['solar_data']['horas_sol_anuales']
        
        # Calculate Factor Verde
        orientacion = get_orientation_from_solar_hours(horas_sol)
        fv_result = calculate_factor_verde(
            area_total_m2=area_m2,
            area_verde_m2=area_util_m2,
            tipo_cubierta='extensiva',
            orientacion=orientacion,
            tipo_infraestructura='cubierta_vegetal_extensiva'
        )
        factor_verde = fv_result['factor_verde']
        
        # Recommend native species
        especies = get_species_by_exposure(clasificacion_solar, max_especies=3)
        especies_con_cantidades = calculate_plant_quantities(area_util_m2, especies)
        especies_nativas_pct = get_native_species_percentage(especies)
        
        # Validate requirements
        requisitos = validate_requirements(
            area_m2=area_m2,
            inclinacion_grados=geo_data['inclinacion_grados'],
            factor_verde=factor_verde,
            especies_nativas_pct=especies_nativas_pct,
            tipo_cubierta='extensiva'
        )
        
        # Calculate budget
        presupuesto = calculate_budget(
            area_m2=area_util_m2,
            especies_list=especies_con_cantidades,
            incluir_riego=True
        )
        
        # Calculate subsidy
        subsidy_info = geo_data['subsidy_info']
        subsidy_calc = calculate_subsidy_amount(
            coste_total=presupuesto['coste_total_inicial_eur'],
            porcentaje=subsidy_info['porcentaje']
        )
        
        # Ecosystem benefits (MITECO 2024)
        beneficios = calculate_ecosystem_benefits(area_util_m2, 'extensiva')
        biodiversidad = calculate_biodiversity_impact(area_util_m2, especies_nativas_pct)
        
        # Energy savings (IDAE)
        ahorro_energia = calculate_energy_savings(area_util_m2, 'extensiva')
        
        # ROI calculation
        ahorro_anual_total = (
            ahorro_energia['ahorro_energia_eur_anual'] +
            beneficios['valor_retencion_agua_eur_anual']
        )
        inversion_neta = subsidy_calc['inversion_neta_eur']
        amortizacion_anos = inversion_neta / ahorro_anual_total if ahorro_anual_total > 0 else 999
        roi_porcentaje = (ahorro_anual_total / inversion_neta * 100) if inversion_neta > 0 else 0
        ahorro_25_anos = ahorro_anual_total * 25
        valor_neto_presente = ahorro_25_anos - inversion_neta
        
        # Calculate Green Score (weighted)
        green_score = self._calculate_green_score(
            factor_verde=factor_verde,
            horas_sol=horas_sol,
            area_util_pct=vision_data['segmentation']['area_util_pct'],
            beneficio_ecosistemico_score=(beneficios['co2_capturado_kg_anual'] / area_util_m2) if area_util_m2 > 0 else 0,
            cumple_normativa=requisitos['cumple_todos']
        )
        
        # Generate recommendations
        recomendaciones = self._generate_recommendations(
            factor_verde=factor_verde,
            cumple_pecv=requisitos['cumple_todos'],
            subsidy_pct=subsidy_info['porcentaje'],
            subsidy_amount=subsidy_calc['monto_subvencion_eur']
        )
        
        # Generate tags
        tags = self._generate_tags(
            horas_sol=horas_sol,
            especies_nativas=especies_nativas_pct >= 60,
            cumple_pecv=requisitos['cumple_todos'],
            elegible_subvencion=subsidy_info['elegible'],
            amortizacion_anos=amortizacion_anos
        )
        
        # Build complete report
        return {
            'success': True,
            'green_score': green_score,
            'area_m2': round(area_m2, 2),
            'perimetro_m': round(geo_data['perimetro_m'], 2),
            'inclinacion_grados': round(geo_data['inclinacion_grados'], 1),
            
            'normativa': {
                'factor_verde': factor_verde,
                'cumple_pecv_madrid': requisitos['cumple_todos'],
                'cumple_miteco': requisitos['cumple_todos'],
                'requisitos': requisitos
            },
            
            'subvencion': {
                'elegible': subsidy_info['elegible'],
                'porcentaje': subsidy_info['porcentaje'],
                'programa': subsidy_info['programa'],
                'monto_estimado_eur': round(subsidy_calc['monto_subvencion_eur'], 2)
            },
            
            'vision_artificial': {
                'segmentacion': vision_data['segmentation'],
                'exposicion_solar': vision_data['solar_data'],
                'ndvi_actual': vision_data['ndvi_actual']
            },
            
            'beneficios_ecosistemicos': {
                'co2_capturado_kg_anual': round(beneficios['co2_capturado_kg_anual'], 0),
                'agua_retenida_litros_anual': round(beneficios['agua_retenida_litros_anual'], 0),
                'reduccion_temperatura_c': beneficios['reduccion_temperatura_c'],
                'ahorro_energia_kwh_anual': round(ahorro_energia['ahorro_energia_kwh_anual'], 0),
                'ahorro_energia_eur_anual': round(ahorro_energia['ahorro_energia_eur_anual'], 0)
            },
            
            'especies_recomendadas': [
                {
                    'nombre_comun': esp['nombre_comun'],
                    'nombre_cientifico': esp['nombre_cientifico'],
                    'tipo': esp['tipo'],
                    'nativa_iberia': esp['nativa_iberia'],
                    'viabilidad': esp['viabilidad'],
                    'razon': esp['razon'],
                    'polinizacion': esp['polinizacion'],
                    'densidad_m2': esp['densidad_m2'],
                    'cantidad_estimada': esp['cantidad_estimada'],
                    'coste_unidad_eur': esp['coste_unidad_eur']
                }
                for esp in especies_con_cantidades
            ],
            
            'presupuesto': presupuesto,
            
            'roi_ambiental': {
                'roi_porcentaje': round(roi_porcentaje, 2),
                'amortizacion_anos': round(amortizacion_anos, 1),
                'ahorro_anual_eur': round(ahorro_anual_total, 0),
                'ahorro_25_anos_eur': round(ahorro_25_anos, 0),
                'valor_neto_presente_eur': round(valor_neto_presente, 0)
            },
            
            'recomendaciones_tecnicas': recomendaciones,
            'tags': tags
        }
    
    def _calculate_green_score(
        self, 
        factor_verde: float, 
        horas_sol: int, 
        area_util_pct: float,
        beneficio_ecosistemico_score: float,
        cumple_normativa: bool
    ) -> float:
        """
        Calculate weighted Green Score (0-100).
        
        Weights:
        - Factor Verde: 30%
        - Solar exposure: 20%
        - Usable area: 15%
        - Ecosystem benefit: 20%
        - Regulatory compliance: 15%
        """
        # Factor Verde score (0-30)
        fv_score = min((factor_verde / 0.8) * 30, 30)
        
        # Solar exposure score (0-20)
        solar_score = min((horas_sol / 2800) * 20, 20)
        
        # Usable area score (0-15)
        area_score = (area_util_pct / 100) * 15
        
        # Ecosystem benefit score (0-20)
        eco_score = min((beneficio_ecosistemico_score / 6) * 20, 20)
        
        # Compliance score (0-15)
        compliance_score = 15 if cumple_normativa else 7.5
        
        total_score = fv_score + solar_score + area_score + eco_score + compliance_score
        
        return round(total_score, 1)
    
    def _generate_recommendations(
        self,
        factor_verde: float,
        cumple_pecv: bool,
        subsidy_pct: int,
        subsidy_amount: float
    ) -> list:
        """Generate technical recommendations."""
        recomendaciones = []
        
        if cumple_pecv:
            recomendaciones.append(
                f"✅ La zona cumple con PECV Madrid 2025 (Factor Verde: {factor_verde})"
            )
        else:
            recomendaciones.append(
                f"⚠️ Factor Verde actual ({factor_verde}) no cumple mínimo PECV (0.6)"
            )
        
        recomendaciones.extend([
            "⚠️ Verificar capacidad estructural del edificio (150 kg/m²)",
            "⚠️ Instalar membrana impermeabilizante (10 años garantía mínima)",
            "💧 Sistema de riego por goteo automatizado (60% agua vs aspersión)",
            "🌱 Sustrato ligero con espesor mínimo 10 cm",
            "🔒 Lámina anti-raíces obligatoria en cubiertas no accesibles",
            "📋 Solicitar licencia municipal y permiso de comunidad"
        ])
        
        if subsidy_pct > 0:
            recomendaciones.append(
                f"💰 Elegible para subvención del {subsidy_pct}% (€{subsidy_amount:,.0f})"
            )
        
        return recomendaciones
    
    def _generate_tags(
        self,
        horas_sol: int,
        especies_nativas: bool,
        cumple_pecv: bool,
        elegible_subvencion: bool,
        amortizacion_anos: float
    ) -> list:
        """Generate summary tags."""
        tags = []
        
        if horas_sol >= 2200:
            tags.append(f"Exposición solar alta ({horas_sol}h/año)")
        elif horas_sol >= 1800:
            tags.append(f"Exposición solar media ({horas_sol}h/año)")
        else:
            tags.append(f"Exposición solar baja ({horas_sol}h/año)")
        
        if especies_nativas:
            tags.append("Especies nativas recomendadas")
        
        if cumple_pecv:
            tags.append("Cumple PECV Madrid 2025")
        
        if elegible_subvencion:
            tags.append("Elegible para subvenciones")
        
        if amortizacion_anos < 15:
            tags.append(f"ROI favorable (<{int(amortizacion_anos)} años)")
        
        return tags


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler."""
    
    def do_POST(self):
        try:
            print(f"[ANALYZE] Request received from {self.headers.get('origin')}")
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            print(f"[ANALYZE] Polygon data: {data.get('polygon', {}).get('type')}")
            
            polygon = data.get('polygon', {})
            
            # Initialize and run analysis
            engine = AnalysisEngine(polygon)
            result = engine.analyze()
            
            print(f"[ANALYZE] Analysis complete, Green Score: {result['green_score']}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            print(f"[ANALYZE] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_msg = {'success': False, 'error': str(e)}
            self.wfile.write(json.dumps(error_msg).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        # Health check endpoint
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            'status': 'ok',
            'service': 'analyze',
            'version': '2.0.0',
            'architecture': '3-layer intelligent engine'
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
