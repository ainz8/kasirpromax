// ═══════════════════════════════════════════════════════════════
//  sync-engine.js — Cloud Sync dengan Retry Logic & Error Handling
//  Auto-retry dengan exponential backoff saat offline/error
// ═══════════════════════════════════════════════════════════════

const SyncEngine = (() => {
  const config = {
    maxRetries: 3,
    baseDelay: 1000,        // 1 second
    maxDelay: 30000,        // 30 seconds
    autoSyncInterval: 300000 // 5 minutes
  };

  let syncState = {
    isRunning: false,
    lastSyncTime: null,
    syncCount: 0,
    errorCount: 0,
    lastError: null
  };

  let autoSyncTimer = null;
  const syncEventListeners = [];

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Delay in milliseconds
   */
  function getRetryDelay(attempt) {
    const delay = config.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Emit sync event to listeners
   * @param {string} event - Event name (start, progress, complete, error)
   * @param {object} data - Event data
   */
  function emitEvent(event, data = {}) {
    syncEventListeners.forEach(listener => {
      if (listener.event === event || event === 'all') {
        listener.callback({ ...data, timestamp: new Date().toISOString() });
      }
    });
  }

  /**
   * Subscribe to sync events
   * @param {string} event - Event to listen (start, progress, complete, error)
   * @param {function} callback - Callback function
   */
  function on(event, callback) {
    syncEventListeners.push({ event, callback });
  }

  /**
   * Execute sync dengan retry logic
   * @param {function} syncFn - Sync function to execute
   * @param {string} name - Name untuk logging
   * @returns {promise} Sync result
   */
  async function executeWithRetry(syncFn, name = 'Sync') {
    let lastError;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`[SyncEngine] ${name} attempt ${attempt}/${config.maxRetries}`);
        emitEvent('progress', { 
          attempt, 
          maxAttempts: config.maxRetries,
          message: `${name} (attempt ${attempt}/${config.maxRetries})`
        });

        const result = await syncFn();
        syncState.syncCount++;
        syncState.errorCount = 0;
        syncState.lastSyncTime = new Date();
        syncState.lastError = null;

        console.log(`[SyncEngine] ${name} SUCCESS on attempt ${attempt}`);
        emitEvent('complete', { attempt, result });
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`[SyncEngine] ${name} attempt ${attempt} failed:`, error.message);

        if (attempt < config.maxRetries) {
          const delay = getRetryDelay(attempt);
          console.log(`[SyncEngine] Retrying in ${delay}ms...`);
          emitEvent('retry', { attempt, delay, error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          syncState.errorCount++;
          syncState.lastError = error;
          console.error(`[SyncEngine] ${name} FAILED after ${config.maxRetries} attempts`);
          emitEvent('error', { attempt, error: error.message, retries: config.maxRetries });
        }
      }
    }

    throw lastError;
  }

  /**
   * Full sync: Push then Pull
   * @returns {promise}
   */
  async function fullSync() {
    if (syncState.isRunning) {
      console.warn('[SyncEngine] Sync already running, skipping...');
      return;
    }

    if (!navigator.onLine) {
      console.warn('[SyncEngine] Offline, sync scheduled for when online');
      emitEvent('offline', { message: 'App sedang offline, sync akan dilakukan saat online' });
      return;
    }

    if (!Sync?.isConfigured?.()) {
      console.warn('[SyncEngine] Sync tidak dikonfigurasi');
      return;
    }

    try {
      syncState.isRunning = true;
      emitEvent('start', { message: 'Memulai sinkronisasi...' });

      // Push local changes to cloud
      await executeWithRetry(
        () => Sync.push?.() || Promise.resolve(),
        'Push ke cloud'
      );

      // Pull latest from cloud
      await executeWithRetry(
        () => Sync.pull?.() || Promise.resolve(),
        'Pull dari cloud'
      );

      console.log('[SyncEngine] Full sync completed successfully');
      toast('✓ Data tersinkron', 'success');

    } catch (error) {
      console.error('[SyncEngine] Full sync failed:', error);
      toast(`✗ Sync gagal: ${error.message}`, 'error');
      throw error;
    } finally {
      syncState.isRunning = false;
    }
  }

  /**
   * Manual sync trigger
   */
  async function sync() {
    try {
      await fullSync();
    } catch (error) {
      console.error('[SyncEngine] Manual sync failed:', error);
    }
  }

  /**
   * Setup auto-sync
   */
  function startAutoSync() {
    if (autoSyncTimer) clearInterval(autoSyncTimer);

    autoSyncTimer = setInterval(() => {
      if (navigator.onLine && Sync?.isConfigured?.()) {
        console.log('[SyncEngine] Auto-sync triggered');
        fullSync().catch(err => console.error('[SyncEngine] Auto-sync error:', err));
      }
    }, config.autoSyncInterval);

    console.log(`[SyncEngine] Auto-sync enabled (every ${config.autoSyncInterval / 1000}s)`);
  }

  /**
   * Stop auto-sync
   */
  function stopAutoSync() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
      autoSyncTimer = null;
      console.log('[SyncEngine] Auto-sync disabled');
    }
  }

  /**
   * Setup online/offline listeners
   */
  function setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[SyncEngine] Back online!');
      emitEvent('online', { message: 'Kembali online, sinkronisasi dimulai...' });
      fullSync().catch(err => console.error('[SyncEngine] Sync on online failed:', err));
    });

    window.addEventListener('offline', () => {
      console.log('[SyncEngine] Went offline');
      emitEvent('offline', { message: 'Offline - perubahan akan tersimpan lokal' });
    });
  }

  /**
   * Get sync state
   * @returns {object} Current sync state
   */
  function getState() {
    return {
      ...syncState,
      isOnline: navigator.onLine,
      isConfigured: Sync?.isConfigured?.() || false
    };
  }

  /**
   * Reset sync stats
   */
  function reset() {
    syncState = {
      isRunning: false,
      lastSyncTime: null,
      syncCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  /**
   * Update config
   * @param {object} newConfig - Config to update
   */
  function setConfig(newConfig) {
    Object.assign(config, newConfig);
    console.log('[SyncEngine] Config updated:', config);
  }

  // Initialize
  setupNetworkListeners();
  startAutoSync();

  return {
    sync,
    fullSync,
    startAutoSync,
    stopAutoSync,
    getState,
    reset,
    setConfig,
    on
  };
})();

// Setup UI sync status listeners
if (typeof document !== 'undefined') {
  SyncEngine.on('start', (data) => {
    console.log('[UI] Sync started:', data.message);
  });

  SyncEngine.on('complete', (data) => {
    console.log('[UI] Sync completed');
  });

  SyncEngine.on('error', (data) => {
    console.error('[UI] Sync error:', data.error);
  });

  SyncEngine.on('offline', (data) => {
    console.warn('[UI]', data.message);
  });
}
