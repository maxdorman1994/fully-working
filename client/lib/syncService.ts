import { supabase } from "./supabase";
import { debugNetworkError } from "./debug";

export interface SyncEvent {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  old: any;
  new: any;
}

export interface SyncStatus {
  connected: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  conflictCount: number;
}

class SyncService {
  private syncStatus: SyncStatus = {
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    conflictCount: 0,
  };

  private syncCallbacks: Map<string, Set<(event: SyncEvent) => void>> =
    new Map();
  private statusCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private subscriptions: any[] = [];

  /**
   * Initialize real-time sync for all tables
   */
  async initializeSync(): Promise<void> {
    try {
      console.log("🔄 Initializing cross-device sync...");

      // Journal entries sync
      await this.subscribeToTable("journal_entries", (payload) => {
        this.handleSyncEvent("journal_entries", payload);
      });

      // Family members sync
      await this.subscribeToTable("family_members", (payload) => {
        this.handleSyncEvent("family_members", payload);
      });

      // Wishlist sync
      await this.subscribeToTable("wishlist_items", (payload) => {
        this.handleSyncEvent("wishlist_items", payload);
      });

      // Milestones sync
      await this.subscribeToTable("milestones", (payload) => {
        this.handleSyncEvent("milestones", payload);
      });

      // Journal comments and likes sync
      await this.subscribeToTable("journal_comments", (payload) => {
        this.handleSyncEvent("journal_comments", payload);
      });

      await this.subscribeToTable("journal_likes", (payload) => {
        this.handleSyncEvent("journal_likes", payload);
      });

      // App settings sync (logo, theme, etc.)
      await this.subscribeToTable("app_settings", (payload) => {
        this.handleSyncEvent("app_settings", payload);
      });

      this.updateSyncStatus({ connected: true, lastSync: new Date() });
      console.log("✅ Cross-device sync initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize sync:", error);
      this.updateSyncStatus({ connected: false });
      debugNetworkError(error);
    }
  }

  /**
   * Subscribe to real-time changes for a specific table
   */
  private async subscribeToTable(
    tableName: string,
    callback: (payload: any) => void,
  ): Promise<void> {
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
        },
        callback,
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  /**
   * Handle sync events and notify subscribers
   */
  private handleSyncEvent(table: string, payload: any): void {
    const syncEvent: SyncEvent = {
      table,
      eventType: payload.eventType,
      old: payload.old,
      new: payload.new,
    };

    console.log(
      `🔄 Sync event for ${table}:`,
      syncEvent.eventType,
      syncEvent.new?.id || syncEvent.old?.id,
    );

    // Update last sync time
    this.updateSyncStatus({ lastSync: new Date() });

    // Notify table-specific subscribers
    const tableCallbacks = this.syncCallbacks.get(table);
    if (tableCallbacks) {
      tableCallbacks.forEach((callback) => {
        try {
          callback(syncEvent);
        } catch (error) {
          console.error(`Error in sync callback for ${table}:`, error);
        }
      });
    }

    // Store in local storage for offline access
    this.storeOfflineChange(syncEvent);
  }

  /**
   * Subscribe to sync events for a specific table
   */
  subscribe(table: string, callback: (event: SyncEvent) => void): () => void {
    if (!this.syncCallbacks.has(table)) {
      this.syncCallbacks.set(table, new Set());
    }

    this.syncCallbacks.get(table)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.syncCallbacks.get(table);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.syncCallbacks.delete(table);
        }
      }
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribeToStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Update sync status and notify subscribers
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };

    this.statusCallbacks.forEach((callback) => {
      try {
        callback(this.syncStatus);
      } catch (error) {
        console.error("Error in status callback:", error);
      }
    });
  }

  /**
   * Store changes locally for offline access
   */
  private storeOfflineChange(event: SyncEvent): void {
    try {
      const key = `offline_${event.table}_changes`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const changes = [
        ...existing,
        {
          ...event,
          timestamp: new Date().toISOString(),
        },
      ].slice(-100); // Keep last 100 changes

      localStorage.setItem(key, JSON.stringify(changes));
    } catch (error) {
      console.error("Failed to store offline change:", error);
    }
  }

  /**
   * Get offline changes for a table
   */
  getOfflineChanges(table: string): SyncEvent[] {
    try {
      const key = `offline_${table}_changes`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      console.error("Failed to get offline changes:", error);
      return [];
    }
  }

  /**
   * Force sync - useful for manual refresh
   */
  async forceSync(): Promise<void> {
    console.log("🔄 Force syncing data...");
    this.updateSyncStatus({ lastSync: new Date() });

    // Trigger a refresh by notifying all subscribers
    for (const [table, callbacks] of this.syncCallbacks) {
      callbacks.forEach((callback) => {
        try {
          // Send a refresh event
          callback({
            table,
            eventType: "UPDATE",
            old: null,
            new: { _refresh: true },
          });
        } catch (error) {
          console.error(`Error in force sync for ${table}:`, error);
        }
      });
    }
  }

  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("count")
        .limit(1);

      const connected = !error;
      this.updateSyncStatus({ connected });
      return connected;
    } catch (error) {
      this.updateSyncStatus({ connected: false });
      return false;
    }
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    console.log("🔄 Destroying sync service...");

    // Unsubscribe from all real-time subscriptions
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });

    this.subscriptions = [];
    this.syncCallbacks.clear();
    this.statusCallbacks.clear();

    this.updateSyncStatus({ connected: false });
  }

  /**
   * Handle conflicts when same data is edited on multiple devices
   */
  async resolveConflict(
    table: string,
    localData: any,
    remoteData: any,
  ): Promise<any> {
    console.log(`⚠️ Conflict detected in ${table}:`, { localData, remoteData });

    // Simple conflict resolution: most recent timestamp wins
    const localTime = new Date(localData.updated_at || localData.created_at);
    const remoteTime = new Date(remoteData.updated_at || remoteData.created_at);

    if (remoteTime > localTime) {
      console.log("🔄 Remote data is newer, using remote version");
      return remoteData;
    } else {
      console.log("🔄 Local data is newer, keeping local version");
      return localData;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

/**
 * Hook for using sync in React components
 */
export function useSync() {
  return {
    initializeSync: () => syncService.initializeSync(),
    subscribe: (table: string, callback: (event: SyncEvent) => void) =>
      syncService.subscribe(table, callback),
    subscribeToStatus: (callback: (status: SyncStatus) => void) =>
      syncService.subscribeToStatus(callback),
    getStatus: () => syncService.getStatus(),
    forceSync: () => syncService.forceSync(),
    checkConnection: () => syncService.checkConnection(),
    getOfflineChanges: (table: string) => syncService.getOfflineChanges(table),
  };
}

export default syncService;
