// ═══════════════════════════════════════════════════════════════
//  validators.js — Input & Data Validation Rules
// ═══════════════════════════════════════════════════════════════

/**
 * Validasi form produk
 * @returns {Array} Array of error messages, empty if valid
 */
function validateProduct(name, cost, price, category = '', barcode = '') {
  const errors = [];

  // Nama produk
  if (!name || typeof name !== 'string') {
    errors.push('Nama produk harus diisi');
  } else if (name.trim().length === 0) {
    errors.push('Nama produk tidak boleh kosong');
  } else if (name.length > 100) {
    errors.push('Nama produk terlalu panjang (max 100 karakter)');
  }

  // Harga modal
  if (typeof cost !== 'number') {
    errors.push('Harga modal harus berupa angka');
  } else if (cost < 0) {
    errors.push('Harga modal tidak boleh negatif');
  } else if (cost > 999999999) {
    errors.push('Harga modal terlalu besar');
  }

  // Harga jual
  if (typeof price !== 'number') {
    errors.push('Harga jual harus berupa angka');
  } else if (price < 0) {
    errors.push('Harga jual tidak boleh negatif');
  } else if (price > 999999999) {
    errors.push('Harga jual terlalu besar');
  } else if (price < cost && cost > 0) {
    errors.push('⚠️ Harga jual lebih rendah dari modal (rugi!)');
  }

  // Kategori (optional)
  if (category && category.length > 50) {
    errors.push('Kategori terlalu panjang (max 50 karakter)');
  }

  // Barcode (optional)
  if (barcode && !/^[a-zA-Z0-9\-]{1,50}$/.test(barcode)) {
    errors.push('Barcode hanya boleh berisi huruf, angka, dan tanda strip');
  }

  return errors;
}

/**
 * Validasi form pelanggan
 */
function validateCustomer(name, phone = '', notes = '') {
  const errors = [];

  // Nama pelanggan
  if (!name || typeof name !== 'string') {
    errors.push('Nama pelanggan harus diisi');
  } else if (name.trim().length === 0) {
    errors.push('Nama pelanggan tidak boleh kosong');
  } else if (name.length > 100) {
    errors.push('Nama pelanggan terlalu panjang (max 100 karakter)');
  }

  // Nomor HP (optional but should be valid if provided)
  if (phone && !/^(\+62|0)[0-9]{9,12}$/.test(phone.replace(/\D/g, ''))) {
    errors.push('Nomor HP tidak valid. Format: 0812-xxxx-xxxx atau +62-8xx');
  }

  // Catatan (optional)
  if (notes && notes.length > 255) {
    errors.push('Catatan terlalu panjang (max 255 karakter)');
  }

  return errors;
}

/**
 * Validasi pembayaran checkout
 */
function validateCheckout(items, payAmount, total) {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Keranjang belanja kosong');
  }

  if (typeof total !== 'number' || total <= 0) {
    errors.push('Total transaksi tidak valid');
  }

  if (typeof payAmount !== 'number' || payAmount <= 0) {
    errors.push('Nominal pembayaran harus diisi');
  }

  if (payAmount < total) {
    errors.push(`Uang kurang! Butuh Rp ${(total - payAmount).toLocaleString()}`);
  }

  return errors;
}

/**
 * Validasi email (opsional)
 */
function validateEmail(email) {
  if (!email) return true; // Optional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitasi string untuk prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'\/]/g, m => map[m]);
}

/**
 * Sanitasi input untuk prevent injection
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove angle brackets
    .replace(/javascript:/gi, '')  // Remove javascript: protocol
    .slice(0, 1000);  // Limit length
}

/**
 * Validasi ekspor/impor file JSON
 */
function validateJsonFile(data, expectedStructure = null) {
  const errors = [];

  // Check if valid JSON
  if (typeof data !== 'object' || data === null) {
    errors.push('File bukan JSON yang valid');
    return errors;
  }

  // Check if array
  if (!Array.isArray(data)) {
    errors.push('Format file harus berupa array');
    return errors;
  }

  // Check size
  if (data.length === 0) {
    errors.push('File kosong');
    return errors;
  }

  if (data.length > 10000) {
    errors.push('Terlalu banyak data. Max 10.000 baris');
    return errors;
  }

  // Optional: Check structure
  if (expectedStructure && Array.isArray(expectedStructure)) {
    data.forEach((item, idx) => {
      expectedStructure.forEach(field => {
        if (!(field in item)) {
          errors.push(`Baris ${idx + 1}: Field "${field}" tidak ditemukan`);
        }
      });
    });
  }

  return errors;
}

/**
 * Batch validation for arrays
 */
function validateBatch(items, validatorFn) {
  const results = items.map((item, idx) => ({
    index: idx,
    item,
    errors: validatorFn(item)
  }));

  return {
    total: items.length,
    valid: results.filter(r => r.errors.length === 0).length,
    invalid: results.filter(r => r.errors.length > 0),
    allValid: results.every(r => r.errors.length === 0)
  };
}

/**
 * Format validation errors untuk ditampilkan ke user
 */
function formatValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return '';
  }

  return errors.map((err, i) => `${i + 1}. ${err}`).join('\n');
}

/**
 * Reusable form validation dengan callback
 * Contoh: validateForm({
 *   name: { value: 'Kopi', required: true, minLength: 2 },
 *   price: { value: 5000, required: true, min: 0 },
 *   email: { value: 'test@example.com', type: 'email' }
 * })
 */
function validateForm(fields) {
  const errors = {};

  Object.entries(fields).forEach(([fieldName, rules]) => {
    const fieldErrors = [];
    const value = rules.value;

    // Check required
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      fieldErrors.push(`${fieldName} harus diisi`);
    }

    // Check length
    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`${fieldName} minimal ${rules.minLength} karakter`);
    }
    if (rules.maxLength && value && value.length > rules.maxLength) {
      fieldErrors.push(`${fieldName} maksimal ${rules.maxLength} karakter`);
    }

    // Check numeric
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      fieldErrors.push(`${fieldName} minimal ${rules.min}`);
    }
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      fieldErrors.push(`${fieldName} maksimal ${rules.max}`);
    }

    // Check pattern/regex
    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push(`${fieldName} format tidak valid`);
    }

    // Check custom validator
    if (rules.custom && typeof rules.custom === 'function') {
      const customErr = rules.custom(value);
      if (customErr) fieldErrors.push(customErr);
    }

    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Debounce validation untuk real-time validation
 */
function createFieldValidator(validatorFn, debounceMs = 300) {
  let timeout;
  let lastValue;

  return function(value, callback) {
    lastValue = value;
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      if (value === lastValue) {
        const errors = validatorFn(value);
        if (callback) callback(errors);
      }
    }, debounceMs);
  };
}
