// ═══════════════════════════════════════════════════════════════
//  validators.js — Input Validation & Sanitization
//  Comprehensive validation untuk semua user input
// ═══════════════════════════════════════════════════════════════

/**
 * Escape HTML untuk prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitize user input - remove dangerous characters
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input) return '';
  return String(input)
    .replace(/[<>"'`]/g, '')
    .trim();
}

/**
 * Validate product data
 * @param {string} name - Product name
 * @param {number} cost - Cost price
 * @param {number} price - Selling price
 * @param {string} category - Category (optional)
 * @param {string} barcode - Barcode (optional)
 * @returns {array} Array of error messages, empty if valid
 */
function validateProduct(name, cost, price, category = '', barcode = '') {
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('❌ Nama produk harus diisi');
  } else if (name.trim().length < 2) {
    errors.push('❌ Nama produk minimal 2 karakter');
  } else if (name.trim().length > 100) {
    errors.push('❌ Nama produk maksimal 100 karakter');
  }

  // Price validation
  if (isNaN(price) || price < 0) {
    errors.push('❌ Harga jual harus angka positif');
  } else if (price === 0) {
    errors.push('❌ Harga jual tidak boleh 0');
  }

  // Cost validation
  if (isNaN(cost) || cost < 0) {
    errors.push('❌ Harga modal harus angka positif (bisa 0)');
  }

  // Cost vs Price validation
  if (price > 0 && cost > 0 && price < cost) {
    errors.push('⚠️  Harga jual harus ≥ harga modal');
  }

  // Category validation
  if (category && category.trim().length > 50) {
    errors.push('❌ Kategori maksimal 50 karakter');
  }

  // Barcode validation (optional)
  if (barcode && barcode.trim().length > 0) {
    if (barcode.trim().length < 3 || barcode.trim().length > 50) {
      errors.push('❌ Barcode harus 3-50 karakter');
    }
  }

  return errors;
}

/**
 * Validate customer data
 * @param {string} name - Customer name
 * @param {string} phone - Phone number (optional)
 * @param {string} notes - Notes (optional)
 * @returns {array} Array of error messages
 */
function validateCustomer(name, phone = '', notes = '') {
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('❌ Nama pelanggan harus diisi');
  } else if (name.trim().length < 2) {
    errors.push('❌ Nama pelanggan minimal 2 karakter');
  } else if (name.trim().length > 100) {
    errors.push('❌ Nama pelanggan maksimal 100 karakter');
  }

  // Phone validation (optional)
  if (phone && phone.trim().length > 0) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      errors.push('❌ Nomor HP minimal 9 digit');
    } else if (cleanPhone.length > 15) {
      errors.push('❌ Nomor HP maksimal 15 digit');
    }
    if (!phone.match(/^[0-9+\s\-().]*$/)) {
      errors.push('❌ Format nomor HP tidak valid');
    }
  }

  // Notes validation
  if (notes && notes.trim().length > 200) {
    errors.push('❌ Catatan maksimal 200 karakter');
  }

  return errors;
}

/**
 * Validate checkout/transaction
 * @param {number} total - Total amount
 * @param {number} payAmount - Payment amount
 * @param {string} payMethod - Payment method
 * @returns {array} Array of error messages
 */
function validateCheckout(total, payAmount, payMethod = 'TUNAI') {
  const errors = [];

  if (total <= 0) {
    errors.push('❌ Total transaksi harus > 0');
  }

  if (payAmount <= 0) {
    errors.push('❌ Jumlah pembayaran harus > 0');
  }

  if (payAmount < total && payMethod === 'TUNAI') {
    errors.push(`⚠️  Uang tunai kurang (kurang Rp ${(total - payAmount).toLocaleString()})`);
  }

  return errors;
}

/**
 * Validate JSON file format untuk import
 * @param {object} data - Parsed JSON data
 * @param {string} type - Data type ('products', 'transactions', 'customers')
 * @returns {array} Array of error messages
 */
function validateJsonFile(data, type = 'products') {
  const errors = [];

  if (!data) {
    errors.push('❌ File kosong atau format tidak valid');
    return errors;
  }

  if (!Array.isArray(data)) {
    errors.push('❌ Data harus berupa array');
    return errors;
  }

  if (data.length === 0) {
    errors.push('⚠️  File tidak berisi data');
    return errors;
  }

  switch (type) {
    case 'products':
      const sampleProduct = data[0];
      if (!sampleProduct.name) {
        errors.push('❌ Kolom "name" harus ada di setiap produk');
      }
      if (sampleProduct.price === undefined) {
        errors.push('❌ Kolom "price" harus ada di setiap produk');
      }
      break;

    case 'transactions':
      const sampleTrx = data[0];
      if (!sampleTrx.id) {
        errors.push('❌ Kolom "id" harus ada di setiap transaksi');
      }
      if (!sampleTrx.items) {
        errors.push('❌ Kolom "items" harus ada di setiap transaksi');
      }
      break;

    case 'customers':
      const sampleCust = data[0];
      if (!sampleCust.name) {
        errors.push('❌ Kolom "name" harus ada di setiap pelanggan');
      }
      break;
  }

  return errors;
}

/**
 * Format validation errors untuk display
 * @param {array} errors - Array of error messages
 * @returns {string} Formatted error message
 */
function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return errors.join('\n');
}

/**
 * Check if all required fields are filled
 * @param {object} fields - Object with field values
 * @param {array} required - Array of required field names
 * @returns {object} {isValid: boolean, errors: array}
 */
function checkRequired(fields, required) {
  const errors = [];
  
  required.forEach(fieldName => {
    const value = fields[fieldName];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      errors.push(`❌ ${fieldName} harus diisi`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate date format
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid date
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate amount (Rupiah currency)
 * @param {number} amount - Amount to validate
 * @returns {object} {isValid: boolean, error: string}
 */
function validateAmount(amount) {
  if (isNaN(amount)) {
    return { isValid: false, error: 'Jumlah harus angka' };
  }
  if (amount < 0) {
    return { isValid: false, error: 'Jumlah tidak boleh negatif' };
  }
  if (amount > 999999999) {
    return { isValid: false, error: 'Jumlah terlalu besar' };
  }
  return { isValid: true, error: null };
}
