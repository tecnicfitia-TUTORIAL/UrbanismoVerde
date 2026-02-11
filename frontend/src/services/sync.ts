/**
 * Background Sync Service
 * 
 * Handles automatic synchronization of local data with Supabase.
 * Runs periodically and syncs pending changes when online.
 */

import { supabase, TABLES } from '../config/supabase';
import { CacheService } from './cache';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  isSyncing: boolean;
  pendingOperations: number;
  error: string | null;
}

// Configuration constants
const DEFAULT_SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const MAX_SYNC_RETRIES = 5;

class SyncServiceClass {
  private syncInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: number | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // Use environment variable or default
    this.syncInterval = import.meta.env.VITE_SYNC_INTERVAL_MS 
      ? parseInt(import.meta.env.VITE_SYNC_INTERVAL_MS, 10)
      : DEFAULT_SYNC_INTERVAL;
  }

  /**
   * Start automatic sync
   */
  start(): void {
    if (this.intervalId) {
      console.log('Sync service already running');
      return;
    }

    console.log('Starting sync service...');
    
    // Initial sync
    this.sync();

    // Schedule periodic syncs
    this.intervalId = setInterval(() => {
      this.sync();
    }, this.syncInterval);

    console.log(`✅ Sync service iniciado (intervalo: ${this.syncInterval / 1000 / 60} minutos)`);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network back online, syncing...');
      this.sync();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline');
      this.notifyListeners();
    });
  }

  /**
   * Stop automatic sync
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Sync service detenido');
    }
  }

  /**
   * Check if browser is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Perform sync operation
   */
  async sync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline()) {
      console.log('Offline, skipping sync');
      this.notifyListeners();
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      console.log('🔄 Starting sync...');

      // Process sync queue
      await this.processSyncQueue();

      // Sync zonas verdes
      await this.syncZonasVerdes();

      // Sync analisis
      await this.syncAnalisis();

      // Sync especies (read-only, just update cache)
      await this.syncEspecies();

      this.lastSyncTime = Date.now();
      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Error in sync:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Process pending operations in sync queue
   */
  private async processSyncQueue(): Promise<void> {
    const queue = await CacheService.getSyncQueue();
    
    if (queue.length === 0) {
      return;
    }

    console.log(`Processing ${queue.length} items in sync queue`);

    for (const item of queue) {
      try {
        switch (item.operation) {
          case 'create':
            await this.syncCreate(item.table, item.data);
            break;
          case 'update':
            await this.syncUpdate(item.table, item.data);
            break;
          case 'delete':
            await this.syncDelete(item.table, item.data.id);
            break;
        }

        // Remove from queue on success
        if (item.id) {
          await CacheService.removeFromSyncQueue(item.id);
        }
      } catch (error) {
        console.error(`Error syncing ${item.operation} for ${item.table}:`, error);
        
        // Increment retry count
        if (item.id) {
          await CacheService.updateSyncQueueRetries(item.id, item.retries + 1);
        }

        // Remove if too many retries
        if (item.retries >= MAX_SYNC_RETRIES && item.id) {
          console.error(`Max retries (${MAX_SYNC_RETRIES}) reached for operation, removing from queue`);
          await CacheService.removeFromSyncQueue(item.id);
        }
      }
    }
  }

  /**
   * Sync create operation
   */
  private async syncCreate(table: string, data: any): Promise<void> {
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
  }

  /**
   * Sync update operation
   */
  private async syncUpdate(table: string, data: any): Promise<void> {
    const { error } = await supabase.from(table).update(data).eq('id', data.id);
    if (error) throw error;
  }

  /**
   * Sync delete operation
   */
  private async syncDelete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Sync zonas verdes from Supabase to cache
   */
  private async syncZonasVerdes(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ZONAS_VERDES)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        await CacheService.setMany(
          'zonas_verdes',
          data.map(item => ({ id: item.id, data: item })),
          true
        );
        console.log(`✅ Synced ${data.length} zonas verdes`);
      }
    } catch (error) {
      console.error('Error syncing zonas verdes:', error);
    }
  }

  /**
   * Sync analisis from Supabase to cache
   */
  private async syncAnalisis(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANALISIS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        await CacheService.setMany(
          'analisis',
          data.map(item => ({ id: item.id, data: item })),
          true
        );
        console.log(`✅ Synced ${data.length} analisis`);
      }
    } catch (error) {
      console.error('Error syncing analisis:', error);
    }
  }

  /**
   * Sync especies from Supabase to cache
   */
  private async syncEspecies(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ESPECIES)
        .select('*')
        .order('nombre_comun', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        await CacheService.setMany(
          'especies',
          data.map(item => ({ id: item.id, data: item })),
          true
        );
        console.log(`✅ Synced ${data.length} especies`);
      }
    } catch (error) {
      console.error('Error syncing especies:', error);
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline(),
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing,
      pendingOperations: 0, // Will be updated by cache stats
      error: null,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<void> {
    console.log('Force sync requested');
    await this.sync();
  }
}

// Export singleton instance
export const SyncService = new SyncServiceClass();
