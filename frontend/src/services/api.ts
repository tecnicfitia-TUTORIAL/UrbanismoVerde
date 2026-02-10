/**
 * API Service with Offline Support
 * 
 * Provides API methods with automatic fallback to local cache when offline.
 * Integrates Supabase for backend operations and IndexedDB for offline storage.
 */

import { supabase, TABLES, ZonaVerde, Especie } from '../config/supabase';
import { CacheService } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface AnalyzeRequest {
  coordenadas: Array<{ lat: number; lon: number }>;
  municipio_id?: string;
}

export interface AnalyzeResponse {
  viabilidad: 'alta' | 'media' | 'baja' | 'nula';
  area_m2: number;
  tipo_suelo_detectado: string;
  exposicion_solar: number;
  especies_recomendadas: Array<{
    nombre_comun: string;
    nombre_cientifico: string;
    viabilidad: number;
  }>;
  coste_estimado: number;
  notas: string;
}

/**
 * Check if online and able to connect to Supabase
 */
async function isOnlineAndConnected(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    const { error } = await supabase.from(TABLES.ZONAS_VERDES).select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Zonas Verdes API
 */
export const zonasVerdesApi = {
  /**
   * Get all zonas verdes with offline fallback
   */
  async getAll(): Promise<ZonaVerde[]> {
    const isConnected = await isOnlineAndConnected();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from(TABLES.ZONAS_VERDES)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Update cache
        if (data) {
          await CacheService.setMany(
            'zonas_verdes',
            data.map(item => ({ id: item.id, data: item })),
            true
          );
          return data;
        }
      } catch (error) {
        console.error('Error fetching from Supabase, falling back to cache:', error);
      }
    }

    // Fallback to cache
    console.log('Using cached data for zonas verdes');
    return await CacheService.getAll<ZonaVerde>('zonas_verdes');
  },

  /**
   * Get zona verde by ID with offline fallback
   */
  async getById(id: string): Promise<ZonaVerde | null> {
    const isConnected = await isOnlineAndConnected();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from(TABLES.ZONAS_VERDES)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Update cache
        if (data) {
          await CacheService.set('zonas_verdes', id, data, true);
          return data;
        }
      } catch (error) {
        console.error('Error fetching from Supabase, falling back to cache:', error);
      }
    }

    // Fallback to cache
    return await CacheService.get<ZonaVerde>('zonas_verdes', id);
  },

  /**
   * Create new zona verde with offline support
   */
  async create(zona: Omit<ZonaVerde, 'id' | 'created_at' | 'updated_at'>): Promise<ZonaVerde> {
    const isConnected = await isOnlineAndConnected();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newZona: ZonaVerde = {
      ...zona,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from(TABLES.ZONAS_VERDES)
          .insert(newZona)
          .select()
          .single();

        if (error) throw error;

        // Update cache
        if (data) {
          await CacheService.set('zonas_verdes', data.id, data, true);
          return data;
        }
      } catch (error) {
        console.error('Error creating in Supabase, queuing for sync:', error);
      }
    }

    // Save to cache and queue for sync
    await CacheService.set('zonas_verdes', id, newZona, false);
    await CacheService.addToSyncQueue(TABLES.ZONAS_VERDES, 'create', newZona);
    return newZona;
  },

  /**
   * Update zona verde with offline support
   */
  async update(id: string, updates: Partial<ZonaVerde>): Promise<ZonaVerde> {
    const isConnected = await isOnlineAndConnected();
    const now = new Date().toISOString();
    
    const updatedZona = {
      ...updates,
      id,
      updated_at: now,
    };

    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from(TABLES.ZONAS_VERDES)
          .update(updatedZona)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Update cache
        if (data) {
          await CacheService.set('zonas_verdes', id, data, true);
          return data;
        }
      } catch (error) {
        console.error('Error updating in Supabase, queuing for sync:', error);
      }
    }

    // Get from cache, update, and queue for sync
    const cached = await CacheService.get<ZonaVerde>('zonas_verdes', id);
    const merged = { ...cached, ...updatedZona } as ZonaVerde;
    await CacheService.set('zonas_verdes', id, merged, false);
    await CacheService.addToSyncQueue(TABLES.ZONAS_VERDES, 'update', merged);
    return merged;
  },

  /**
   * Delete zona verde with offline support
   */
  async delete(id: string): Promise<void> {
    const isConnected = await isOnlineAndConnected();

    if (isConnected) {
      try {
        const { error } = await supabase
          .from(TABLES.ZONAS_VERDES)
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove from cache
        await CacheService.delete('zonas_verdes', id);
        return;
      } catch (error) {
        console.error('Error deleting from Supabase, queuing for sync:', error);
      }
    }

    // Queue for sync and mark in cache
    await CacheService.addToSyncQueue(TABLES.ZONAS_VERDES, 'delete', { id });
    await CacheService.delete('zonas_verdes', id);
  },
};

/**
 * Especies API
 */
export const especiesApi = {
  /**
   * Get all especies with offline fallback
   */
  async getAll(): Promise<Especie[]> {
    const isConnected = await isOnlineAndConnected();
    
    if (isConnected) {
      try {
        const { data, error } = await supabase
          .from(TABLES.ESPECIES)
          .select('*')
          .order('nombre_comun', { ascending: true });

        if (error) throw error;

        // Update cache
        if (data) {
          await CacheService.setMany(
            'especies',
            data.map(item => ({ id: item.id, data: item })),
            true
          );
          return data;
        }
      } catch (error) {
        console.error('Error fetching especies from Supabase, falling back to cache:', error);
      }
    }

    // Fallback to cache
    return await CacheService.getAll<Especie>('especies');
  },
};

/**
 * Legacy API for backward compatibility
 */
export const api = {
  async analyzeZone(coords: Array<{ lat: number; lon: number }>): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordenadas: coords })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
};

// Función para enviar polígono al servicio de IA
export const analyzeGreenScore = async (
  coordinates: [number, number][]
): Promise<{ green_score: number; recommendations: string[] }> => {
  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
  
  // Construir GeoJSON - convertir de [lat, lon] a [lon, lat] para GeoJSON
  // GeoJSON Polygon requiere un array de anillos (rings), donde cada anillo es un array de coordenadas
  const geojson = {
    type: 'Polygon',
    coordinates: [coordinates.map(coord => [coord[1], coord[0]])]
  };
  
  const response = await fetch(`${AI_SERVICE_URL}/api/analyze-green-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon: geojson })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};
