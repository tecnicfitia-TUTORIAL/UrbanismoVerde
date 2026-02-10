/**
 * IndexedDB Cache Service
 * 
 * Provides local caching functionality using IndexedDB for offline support.
 * Stores zone data, analysis results, and other entities for offline access.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema definition
interface EcoUrbeDB extends DBSchema {
  zonas_verdes: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean; 'by-timestamp': number };
  };
  analisis: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean; 'by-timestamp': number };
  };
  especies: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  sync_queue: {
    key: number;
    value: {
      id?: number;
      table: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retries: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'ecourbe-cache';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EcoUrbeDB> | null = null;

/**
 * Initialize and open the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<EcoUrbeDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<EcoUrbeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create zonas_verdes store
      if (!db.objectStoreNames.contains('zonas_verdes')) {
        const zonasStore = db.createObjectStore('zonas_verdes', { keyPath: 'id' });
        zonasStore.createIndex('by-synced', 'synced');
        zonasStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create analisis store
      if (!db.objectStoreNames.contains('analisis')) {
        const analisisStore = db.createObjectStore('analisis', { keyPath: 'id' });
        analisisStore.createIndex('by-synced', 'synced');
        analisisStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create especies store
      if (!db.objectStoreNames.contains('especies')) {
        const especiesStore = db.createObjectStore('especies', { keyPath: 'id' });
        especiesStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

/**
 * Cache service class
 */
export class CacheService {
  /**
   * Get an item from cache
   */
  static async get<T>(store: keyof EcoUrbeDB, key: string): Promise<T | null> {
    try {
      const db = await getDB();
      const item = await db.get(store as any, key);
      return item ? (item as any).data : null;
    } catch (error) {
      console.error(`Error getting item from cache:`, error);
      return null;
    }
  }

  /**
   * Get all items from a store
   */
  static async getAll<T>(store: keyof EcoUrbeDB): Promise<T[]> {
    try {
      const db = await getDB();
      const items = await db.getAll(store as any);
      return items.map((item: any) => item.data);
    } catch (error) {
      console.error(`Error getting all items from cache:`, error);
      return [];
    }
  }

  /**
   * Set an item in cache
   */
  static async set(store: keyof EcoUrbeDB, key: string, data: any, synced: boolean = true): Promise<void> {
    try {
      const db = await getDB();
      await db.put(store as any, {
        id: key,
        data,
        timestamp: Date.now(),
        synced,
      });
    } catch (error) {
      console.error(`Error setting item in cache:`, error);
    }
  }

  /**
   * Set multiple items in cache
   */
  static async setMany(store: keyof EcoUrbeDB, items: Array<{ id: string; data: any }>, synced: boolean = true): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction(store as any, 'readwrite');
      
      await Promise.all([
        ...items.map(item => 
          tx.store.put({
            id: item.id,
            data: item.data,
            timestamp: Date.now(),
            synced,
          } as any)
        ),
        tx.done,
      ]);
    } catch (error) {
      console.error(`Error setting multiple items in cache:`, error);
    }
  }

  /**
   * Delete an item from cache
   */
  static async delete(store: keyof EcoUrbeDB, key: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(store as any, key);
    } catch (error) {
      console.error(`Error deleting item from cache:`, error);
    }
  }

  /**
   * Clear all items from a store
   */
  static async clear(store: keyof EcoUrbeDB): Promise<void> {
    try {
      const db = await getDB();
      await db.clear(store as any);
    } catch (error) {
      console.error(`Error clearing cache store:`, error);
    }
  }

  /**
   * Get unsynced items from a store
   */
  static async getUnsynced(store: 'zonas_verdes' | 'analisis'): Promise<any[]> {
    try {
      const db = await getDB();
      const items = await db.getAllFromIndex(store, 'by-synced', false);
      return items.map(item => item.data);
    } catch (error) {
      console.error(`Error getting unsynced items:`, error);
      return [];
    }
  }

  /**
   * Add operation to sync queue
   */
  static async addToSyncQueue(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    try {
      const db = await getDB();
      await db.add('sync_queue', {
        table,
        operation,
        data,
        timestamp: Date.now(),
        retries: 0,
      });
    } catch (error) {
      console.error(`Error adding to sync queue:`, error);
    }
  }

  /**
   * Get all items from sync queue
   */
  static async getSyncQueue(): Promise<any[]> {
    try {
      const db = await getDB();
      return await db.getAll('sync_queue');
    } catch (error) {
      console.error(`Error getting sync queue:`, error);
      return [];
    }
  }

  /**
   * Remove item from sync queue
   */
  static async removeFromSyncQueue(id: number): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('sync_queue', id);
    } catch (error) {
      console.error(`Error removing from sync queue:`, error);
    }
  }

  /**
   * Update retry count for sync queue item
   */
  static async updateSyncQueueRetries(id: number, retries: number): Promise<void> {
    try {
      const db = await getDB();
      const item = await db.get('sync_queue', id);
      if (item) {
        item.retries = retries;
        await db.put('sync_queue', item);
      }
    } catch (error) {
      console.error(`Error updating sync queue retries:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    zonas: number;
    analisis: number;
    especies: number;
    syncQueue: number;
    unsyncedZonas: number;
    unsyncedAnalisis: number;
  }> {
    try {
      const db = await getDB();
      const [zonas, analisis, especies, syncQueue] = await Promise.all([
        db.count('zonas_verdes'),
        db.count('analisis'),
        db.count('especies'),
        db.count('sync_queue'),
      ]);

      const [unsyncedZonas, unsyncedAnalisis] = await Promise.all([
        db.countFromIndex('zonas_verdes', 'by-synced', false),
        db.countFromIndex('analisis', 'by-synced', false),
      ]);

      return {
        zonas,
        analisis,
        especies,
        syncQueue,
        unsyncedZonas,
        unsyncedAnalisis,
      };
    } catch (error) {
      console.error(`Error getting cache stats:`, error);
      return {
        zonas: 0,
        analisis: 0,
        especies: 0,
        syncQueue: 0,
        unsyncedZonas: 0,
        unsyncedAnalisis: 0,
      };
    }
  }
}
