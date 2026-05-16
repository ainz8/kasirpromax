# 🔧 Refactoring Guide — KasirProMax v1.1.0

Panduan lengkap untuk memahami dan menggunakan fitur-fitur baru dalam refactoring.

---

## 📦 File-File Baru

### 1. **`js/validators.js`** — Input Validation & XSS Prevention

**Apa yang fixed:**
- ✅ Tidak ada validasi input pada form
- ✅ XSS risk dari inline HTML
- ✅ Data invalid bisa masuk ke database

**Fungsi utama:**

```javascript
// Validasi produk
const errors = validateProduct(name, cost, price, category, barcode);
if (errors.length > 0) {
  customAlert(formatValidationErrors(errors), { type: 'warning' });
  return;
}

// Escape HTML untuk prevent XSS
const safeName = escapeHtml(productName);

// Validasi pelanggan
const custErrors = validateCustomer(name, phone, notes);

// Validasi checkout
const checkoutErrors = validateCheckout(total, payAmount, payMethod);

// Sanitize user input
const cleanInput = sanitizeInput(userInput);
```

**Return value:**
Semua fungsi return `array of error messages`. Kosong = valid ✅

---

### 2. **`js/state-log.js`** — Audit Trail & State Recovery

**Apa yang fixed:**
- ✅ Tidak ada history perubahan data
- ✅ Sulit debug kalau data corrupt
- ✅ Tidak ada state recovery mechanism

**Fungsi utama:**

```javascript
// Log state changes otomatis
StateLog.logProductAdd(product);
StateLog.logProductUpdate(id, before, after);
StateLog.logProductDelete(id, deletedData);

// Get audit trail
StateLog.getRecent(50);           // 50 perubahan terbaru
StateLog.filter('product', 'UPDATE');  // Filter by entity & action
StateLog.getByTimeRange(start, end);   // Get by date range

// Export untuk debugging
StateLog.exportLogs();             // Download JSON
StateLog.getSummary();             // Get statistics

// Admin tools
StateLog.getLogsForDebug();        // Debug info
StateLog.clear();                  // Clear semua logs
```

**Logging otomatis:**
- Setiap `saveProduct()` → auto-log
- Setiap transaksi → auto-log
- Setiap customer change → auto-log

---

### 3. **`js/sync-engine.js`** — Retry Logic & Error Handling

**Apa yang fixed:**
- ✅ Tidak ada error recovery untuk failed sync
- ✅ Kalau timeout, app stuck
- ✅ Tidak ada retry mechanism

**Fitur:**

```javascript
// Manual sync
SyncEngine.sync();

// Subscribe to sync events
SyncEngine.on('start', (data) => {
  console.log('Sync dimulai:', data.message);
});

SyncEngine.on('progress', (data) => {
  console.log(`Attempt ${data.attempt}/${data.maxAttempts}`);
});

SyncEngine.on('complete', (data) => {
  console.log('Sync berhasil!');
});

SyncEngine.on('error', (data) => {
  console.error('Sync gagal:', data.error);
});

SyncEngine.on('retry', (data) => {
  console.log(`Retry dalam ${data.delay}ms`);
});

SyncEngine.on('offline', (data) => {
  console.log('Offline:', data.message);
});

// Get sync state
const state = SyncEngine.getState();
// { isRunning, lastSyncTime, syncCount, errorCount, lastError, isOnline, isConfigured }

// Config auto-sync interval
SyncEngine.setConfig({ autoSyncInterval: 300000 }); // 5 minutes
```

**Retry strategy:**
- Exponential backoff: 1s → 2s → 4s
- Max 3 attempts
- Auto-retry saat online
- User-friendly error messages

---

## 🔒 Security Improvements

### 1. **Environment Variables**

**BEFORE:**
```javascript
// ❌ DANGEROUS - Credentials in source code
window.TURSO_TOKEN = 'eyJhbGciOiJFZERTQSI...(exposed)'
```

**AFTER:**
```
// ✅ SAFE - Use .env.local (in .gitignore)
TURSO_TOKEN=eyJhbGci...(not in repo)
```

**Setup:**
1. Copy `.env.example` ke `.env.local`
2. Fill dengan actual credentials
3. Never commit `.env.local`
4. Load di `js/config.js`

---

### 2. **XSS Prevention**

```javascript
// ❌ BEFORE - XSS vulnerable
html = `<p>${userInput}</p>`

// ✅ AFTER - Safe
html = `<p>${escapeHtml(userInput)}</p>`
```

**Applied di:**
- `js/inventory.js` - Product names
- `js/pos.js` - Display items
- `js/customers.js` - Customer names

---

### 3. **Input Validation**

```javascript
// ✅ Validate sebelum save
function saveProduct() {
  const errors = validateProduct(name, cost, price, category, barcode);
  if (errors.length > 0) {
    customAlert(formatValidationErrors(errors), { type: 'warning' });
    return;  // Stop!
  }
  // ... proceed dengan save
}
```

**Checks:**
- Nama: 2-100 chars
- Harga jual: > 0, <= modal (dengan warning)
- Kategori: <= 50 chars
- Barcode: 3-50 chars (optional)
- Phone: 9-15 digits

---

## 📊 State Management

### Before vs After

**BEFORE:**
```javascript
// Global state tanpa audit trail
let products = [];
cart.push(item);          // Langsung mutate
products.splice(idx, 1);  // Tanpa logging
```

**AFTER:**
```javascript
// With state logging
StateLog.logProductAdd(product);      // Audit trail
StateLog.logProductUpdate(id, before, after);

// Get history
StateLog.getRecent(50);               // 50 terbaru
StateLog.getSummary();                // Statistics
StateLog.exportLogs();                // Download
```

---

## 🚀 Testing Checklist

### Security Tests

- [ ] Try add product with special chars (`<script>`, etc)
  - Expected: Escaped, not executable

- [ ] Try import JSON with malicious content
  - Expected: Sanitized

- [ ] Check `.env` file tidak di-commit
  - Expected: `.env.local` di `.gitignore`

### Validation Tests

- [ ] Add product tanpa nama → Error
- [ ] Add product with harga jual < modal → Warning
- [ ] Add customer tanpa nama → Error
- [ ] Add customer with invalid phone → Error
- [ ] Checkout dengan pembayaran kurang → Error

### State Logging Tests

```javascript
// Di browser console
StateLog.getRecent(5)         // Check last 5 changes
StateLog.getSummary()         // Get stats
StateLog.exportLogs()         // Download audit trail
StateLog.filter('product')    // Filter by entity
```

### Sync Tests

- [ ] Offline mode: buat transaksi → saved lokal
- [ ] Back online: auto-sync trigger
- [ ] Failed sync: retry 3x dengan exponential backoff
- [ ] Check sync status di UI

---

## 📝 Integration with Existing Code

### In `index.html`

```html
<!-- Load new scripts in order -->
<script src="js/validators.js"></script>      <!-- Utilities first -->
<script src="js/state-log.js"></script>       <!-- State management -->
<script src="js/sync-engine.js"></script>     <!-- Sync logic -->

<!-- Then existing files -->
<script src="js/config.js"></script>
<script src="js/db.js"></script>
<!-- ... etc -->
```

### In `js/inventory.js`

```javascript
// Before saving, validate
const errors = validateProduct(name, cost, price, category, barcode);
if (errors.length > 0) {
  customAlert(formatValidationErrors(errors), { type: 'warning' });
  return;
}

// Save
const product = await API.createProduct({ name, cost, price, category, barcode });

// Log the change
StateLog.logProductAdd(product);

// Sanitize display
html = `<p>${escapeHtml(product.name)}</p>`
```

---

## 🔄 Migration from v1.0.0

1. **Backup data:**
   ```javascript
   exportTransactions();  // Download current data
   exportProducts();
   ```

2. **Pull new branch:**
   ```bash
   git pull origin refactor/security-quality
   ```

3. **Setup environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with actual credentials
   ```

4. **Test thoroughly:**
   - Add products → validate
   - Create transactions → check logs
   - Offline/online → sync retry

5. **Deploy:**
   - Create PR
   - Review changes
   - Merge to main
   - Deploy to Railway

---

## 📚 Future Improvements

1. **Testing Framework** — Unit tests untuk validators
2. **File Size Optimization** — Split large files
3. **i18n Support** — Multi-language (skipped in this version)
4. **Component Refactor** — Separate UI logic
5. **Documentation** — API docs, architecture diagram

---

## 📞 Support

Kalau ada pertanyaan atau issue:
1. Check error message
2. Check `StateLog.getLogsForDebug()`
3. Check browser console
4. Export logs untuk debugging

Happy coding! 🚀
