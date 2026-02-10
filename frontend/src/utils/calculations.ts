import { MaterialCalculation } from '../types';

// Calcular perímetro de un polígono usando fórmula de Haversine
// Coordenadas en formato [lat, lon] como se usa en toda la aplicación
export const calcularPerimetro = (coords: [number, number][]): number => {
  const R = 6371000; // Radio de la Tierra en metros
  let perimetro = 0;
  
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i][0] * Math.PI / 180;
    const lat2 = coords[j][0] * Math.PI / 180;
    const lon1 = coords[i][1] * Math.PI / 180;
    const lon2 = coords[j][1] * Math.PI / 180;
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;
    
    perimetro += distancia;
  }
  
  return Math.round(perimetro * 100) / 100;
};

// Función para calcular materiales
export const calculateMaterials = (areaM2: number, perimetro: number): MaterialCalculation => {
  const sustrato = {
    volumenM3: areaM2 * 0.1,
    bolsas: Math.ceil((areaM2 * 0.1) / 0.05),
    coste: Math.ceil((areaM2 * 0.1) / 0.05) * 8
  };
  
  const riego = {
    metrosLineales: Math.ceil(perimetro * 1.2),
    coste: Math.ceil(perimetro * 1.2) * 2.5
  };
  
  const plantas = {
    cantidad: Math.ceil(areaM2 / 0.25),
    coste: Math.ceil(areaM2 / 0.25) * 5
  };
  
  const total = sustrato.coste + riego.coste + plantas.coste;
  
  return { sustrato, riego, plantas, total };
};
