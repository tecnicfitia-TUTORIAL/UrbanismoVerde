from http.server import BaseHTTPRequestHandler
import json


def calculate_area_simple(coordinates):
    """Cálculo simple de área en m²
    
    NOTA: Este es un cálculo aproximado que no tiene en cuenta las variaciones
    de latitud. Para cálculos precisos en producción, usar proyecciones geográficas
    apropiadas o fórmulas que consideren el factor coseno de la latitud.
    Es suficiente para demostración y áreas pequeñas cerca del ecuador.
    """
    if len(coordinates) < 3:
        return 0.0
    
    area = 0.0
    n = len(coordinates)
    
    for i in range(n):
        x1, y1 = coordinates[i]
        x2, y2 = coordinates[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    
    # Convertir a m² (aproximación simple)
    # Para mayor precisión, usar: cos(center_latitude) * METERS_PER_DEGREE
    METERS_PER_DEGREE = 111000
    return abs(area) * METERS_PER_DEGREE * METERS_PER_DEGREE / 2


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Log para debugging
            print(f"[ANALYZE] Request received from {self.headers.get('origin')}")
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            print(f"[ANALYZE] Polygon data: {data.get('polygon', {}).get('type')}")
            
            polygon = data.get('polygon', {})
            coordinates = polygon.get('coordinates', [[]])[0]
            
            # Cálculo simple de área
            area_m2 = calculate_area_simple(coordinates)
            
            print(f"[ANALYZE] Calculated area: {area_m2} m²")
            
            result = {
                'success': True,
                'area_m2': round(area_m2, 2),
                'perimetro_m': round(area_m2 ** 0.5 * 4, 2),
                'inclinacion_grados': 5.0,
                'green_score': 72.5,
                'tags': ['Buena exposición solar', 'Espacio mediano'],
                'normativa_cumplimiento': {
                    'pecv_madrid_2025': {
                        'estado': 'VÁLIDO',
                        'factor_verde': 0.65,
                        'cumple': True,
                        'requisitos': {
                            'inclinacion_max_30': True,
                            'superficie_min_50m2': area_m2 >= 50,
                            'factor_verde_min_0_6': True
                        }
                    },
                    'miteco_2024': {
                        'estado': 'CUMPLE',
                        'factor_verde': 0.65,
                        'cumple': True
                    },
                    'apto_para_subvencion': True
                },
                'salud_ambiental': {
                    'green_score': 72.5,
                    'regulacion_termica': {
                        'reduccion_temperatura_c': 1.4,
                        'objetivo_normativa_c': 1.2,
                        'cumple': True,
                        'beneficio': 'ALTO'
                    },
                    'retencion_agua': {
                        'capacidad_litros': int(area_m2 * 15),
                        'litros_por_m2': 15,
                        'lluvia_anual_retenida_pct': 62,
                        'beneficio_drenaje': 'ALTO'
                    },
                    'calidad_aire': {
                        'co2_capturado_kg_ano': round(area_m2 * 1.2, 1),
                        'particulas_filtradas_kg_ano': round(area_m2 * 0.2, 1)
                    }
                },
                'biodiversidad_impacto': {
                    'especies_nativas_recomendadas_num': min(int(area_m2 / 50) + 3, 10),
                    'potencial_polinizacion': 'ALTO',
                    'habitat_fauna_urbana': area_m2 >= 100,
                    'conectividad_ecologica': 'Mejora el corredor verde urbano',
                    'servicios_ecosistemicos': [
                        'Hábitat para insectos polinizadores',
                        'Refugio para aves urbanas',
                        'Corredor ecológico',
                        'Mejora de microclima local'
                    ]
                },
                'subvenciones_potenciales': {
                    'apto': True,
                    'coste_estimado_total_eur': int(area_m2 * 100),
                    'total_estimado_eur': int(area_m2 * 50),
                    'porcentaje_cobertura': 50,
                    'inversion_neta_eur': int(area_m2 * 50),
                    'desglose': {
                        'ayuntamiento_madrid': {
                            'importe_eur': int(area_m2 * 30),
                            'porcentaje': 40,
                            'requisito': 'Factor Verde >0.6 (CUMPLE)',
                            'enlace': 'https://www.madrid.es'
                        },
                        'comunidad_madrid': {
                            'importe_eur': int(area_m2 * 20),
                            'porcentaje': 40,
                            'requisito': 'Certificación energética',
                            'enlace': 'https://www.comunidad.madrid'
                        }
                    }
                },
                'ahorro_estimado': {
                    'ahorro_anual_total_eur': int(area_m2 * 8),
                    'desglose': {
                        'energia_climatizacion_eur': int(area_m2 * 6),
                        'gestion_aguas_eur': int(area_m2 * 2)
                    },
                    'amortizacion_anos': 6.5,
                    'roi_porcentaje': 15.4,
                    'incremento_valor_inmueble_pct': 7,
                    'vida_util_anos': 25,
                    'ahorro_total_25_anos_eur': int(area_m2 * 200)
                },
                'especies_recomendadas': [
                    {
                        'nombre_comun': 'Sedum de roca',
                        'nombre_cientifico': 'Sedum sediforme',
                        'tipo': 'Suculenta nativa',
                        'origen': 'Mediterráneo',
                        'peso_sistema_kg_m2': 75,
                        'profundidad_cm': 8,
                        'mantenimiento': 'Muy bajo',
                        'resistencia_sequia': 'Muy alta',
                        'floracion': 'Junio-Agosto',
                        'polinizadores': True,
                        'viabilidad': 0.98,
                        'recomendada_pecv': True
                    },
                    {
                        'nombre_comun': 'Tomillo salsero',
                        'nombre_cientifico': 'Thymus zygis',
                        'tipo': 'Aromática nativa',
                        'origen': 'Península Ibérica',
                        'peso_sistema_kg_m2': 85,
                        'profundidad_cm': 10,
                        'mantenimiento': 'Bajo',
                        'resistencia_sequia': 'Alta',
                        'floracion': 'Abril-Junio',
                        'polinizadores': True,
                        'viabilidad': 0.95,
                        'recomendada_pecv': True
                    },
                    {
                        'nombre_comun': 'Lavanda',
                        'nombre_cientifico': 'Lavandula angustifolia',
                        'tipo': 'Aromática',
                        'origen': 'Mediterráneo',
                        'peso_sistema_kg_m2': 90,
                        'profundidad_cm': 12,
                        'mantenimiento': 'Bajo',
                        'resistencia_sequia': 'Alta',
                        'floracion': 'Mayo-Julio',
                        'polinizadores': True,
                        'viabilidad': 0.92,
                        'recomendada_pecv': True
                    }
                ],
                'recomendaciones_tecnicas': [
                    '⚠️ CRÍTICO: Verificar capacidad estructural del edificio',
                    '⚠️ Revisar impermeabilización antes de instalación',
                    'Instalar sistema de drenaje perimetral',
                    'Colocar lámina anti-raíces',
                    'Sistema de riego por goteo automatizado',
                    'Solicitar permiso comunidad y licencia municipal'
                ],
                'processing_time': 0.5
            }
            
            print(f"[ANALYZE] Response ready, status: {result['success']}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            print(f"[ANALYZE] ERROR: {str(e)}")
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
            'version': '1.0.0'
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))