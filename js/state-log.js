// ═══════════════════════════════════════════════════════════════
//  state-log.js — State Change Audit Trail
//  Track semua perubahan data untuk debugging dan recovery
// ═══════════════════════════════════════════════════════════════

const StateLog = {
  logs: [],
  maxLogs: 1000,
  isEnabled: true,

  /**
   * Add state change log
   * @param {string} action - Action name (e.g., 'PRODUCT_ADD', 'TRANSACTION_CREATE')
   * @param {string} entity - Entity type (e.g., 'product', 'transaction', 'customer')
   * @param {object} changes - Object with before/after/payload
   * @param {string} userId - Optional user ID
   */
  log(action, entity, changes = {}, userId = 'anonymous') {
    if (!this.isEnabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      action,
      entity,
      userId,
      changes,
      hash: this.generateHash(action, entity, changes)
    };

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`[StateLog] ${action} on ${entity}`, changes);
  },

  /**
   * Log product add
   */
  logProductAdd(product) {
    this.log('PRODUCT_ADD', 'product', { payload: product });
  },

  /**
   * Log product update
   */
  logProductUpdate(productId, before, after) {
    this.log('PRODUCT_UPDATE', 'product', { productId, before, after });
  },

  /**
   * Log product delete
   */
  logProductDelete(productId, product) {
    this.log('PRODUCT_DELETE', 'product', { productId, deletedData: product });
  },

  /**
   * Log transaction create
   */
  logTransactionCreate(transaction) {
    this.log('TRANSACTION_CREATE', 'transaction', { 
      payload: {
        id: transaction.id,
        itemCount: transaction.items.length,
        total: transaction.items.reduce((s, i) => s + (i.price * i.qty), 0),
        payMethod: transaction.payMethod
      }
    });
  },

  /**
   * Log transaction update
   */
  logTransactionUpdate(transactionId, before, after) {
    this.log('TRANSACTION_UPDATE', 'transaction', { transactionId, before, after });
  },

  /**
   * Log transaction delete
   */
  logTransactionDelete(transactionId, transaction) {
    this.log('TRANSACTION_DELETE', 'transaction', { transactionId, deletedData: transaction });
  },

  /**
   * Log customer add
   */
  logCustomerAdd(customer) {
    this.log('CUSTOMER_ADD', 'customer', { payload: customer });
  },

  /**
   * Log customer update
   */
  logCustomerUpdate(customerId, before, after) {
    this.log('CUSTOMER_UPDATE', 'customer', { customerId, before, after });
  },

  /**
   * Log customer delete
   */
  logCustomerDelete(customerId, customer) {
    this.log('CUSTOMER_DELETE', 'customer', { customerId, deletedData: customer });
  },

  /**
   * Log data export
   */
  logDataExport(dataType, recordCount) {
    this.log('DATA_EXPORT', dataType, { recordCount, format: 'JSON' });
  },

  /**
   * Log data import
   */
  logDataImport(dataType, recordCount) {
    this.log('DATA_IMPORT', dataType, { recordCount, format: 'JSON' });
  },

  /**
   * Get recent logs
   */
  getRecent(limit = 50) {
    return this.logs.slice(-limit);
  },

  /**
   * Filter logs by entity or action
   */
  filter(entity = null, action = null) {
    return this.logs.filter(log => {
      const entityMatch = !entity || log.entity === entity;
      const actionMatch = !action || log.action === action;
      return entityMatch && actionMatch;
    });
  },

  /**
   * Get logs by time range
   */
  getByTimeRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  },

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✓ State logs diexport', 'success');
  },

  /**
   * Clear all logs
   */
  clear() {
    const count = this.logs.length;
    this.logs = [];
    console.log(`[StateLog] Cleared ${count} logs`);
  },

  /**
   * Get summary statistics
   */
  getSummary() {
    const summary = {};
    
    this.logs.forEach(log => {
      const key = `${log.entity}_${log.action}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  },

  /**
   * Generate simple hash untuk detect tampering
   */
  generateHash(action, entity, changes) {
    const str = `${action}${entity}${JSON.stringify(changes)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  },

  /**
   * Get logs untuk UI debugging
   */
  getLogsForDebug() {
    return {
      totalLogs: this.logs.length,
      isEnabled: this.isEnabled,
      summary: this.getSummary(),
      recent: this.getRecent(20)
    };
  },

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`[StateLog] Logging ${enabled ? 'enabled' : 'disabled'}`);
  }
};

/**
 * Hook untuk auto-log setiap kali data berubah
 * Integrasi dengan inventory.js, pos.js, customers.js
 */
function autoLogStateChanges() {
  // Override product operations
  const originalSaveProduct = saveProduct;
  if (originalSaveProduct) {
    window.saveProduct = function(...args) {
      const result = originalSaveProduct.apply(this, args);
      StateLog.logProductAdd(products[products.length - 1]);
      return result;
    };
  }

  // Override transaction creation
  const originalProcessAndPreview = processAndPreview;
  if (originalProcessAndPreview) {
    window.processAndPreview = function(...args) {
      const transactionBefore = { ...transactions[transactions.length - 1] || null };
      const result = originalProcessAndPreview.apply(this, args);
      const transactionAfter = transactions[transactions.length - 1];
      if (transactionAfter) {
        StateLog.logTransactionCreate(transactionAfter);
      }
      return result;
    };
  }
}

// Auto-enable state logging
StateLog.setEnabled(true);
