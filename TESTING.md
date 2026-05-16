# KasirProMax - Testing Guide

## 🧪 Overview

Panduan lengkap untuk testing KasirProMax application dengan focus pada:
- Unit Tests
- Integration Tests
- E2E Tests
- Performance Testing

---

## 📦 Setup Testing

### Installation
```bash
npm install --save-dev vitest @vitest/ui happy-dom
```

### package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🔍 Unit Tests

### Validators Test (`tests/validators.test.js`)

```javascript
import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhoneNumber,
  validateAmount,
  sanitizeInput
} from '../js/validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid phone', () => {
      expect(validatePhoneNumber('+62812345678')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(validatePhoneNumber('123')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove XSS attempts', () => {
      const input = '<script>alert("xss")</script>';
      expect(sanitizeInput(input)).not.toContain('<script>');
    });

    it('should preserve safe content', () => {
      const input = 'Hello World';
      expect(sanitizeInput(input)).toBe('Hello World');
    });
  });
});
```

---

## 🔗 Integration Tests

### Database Integration

```javascript
describe('Database Integration', () => {
  beforeEach(() => {
    // Setup test database
  });

  afterEach(() => {
    // Cleanup test data
  });

  it('should save and retrieve transaction', async () => {
    const transaction = {
      id: '123',
      amount: 100000,
      items: [],
      timestamp: Date.now()
    };

    await db.saveTransaction(transaction);
    const retrieved = await db.getTransaction('123');

    expect(retrieved).toEqual(transaction);
  });
});
```

### API Integration

```javascript
describe('API Integration', () => {
  it('should sync data successfully', async () => {
    const mockData = { items: [...] };
    
    const result = await syncEngine.sync(mockData);
    expect(result.success).toBe(true);
  });

  it('should retry on network error', async () => {
    // Simulate network error
    let attempts = 0;
    
    const result = await syncEngine.syncWithRetry(() => {
      attempts++;
      if (attempts < 3) throw new Error('Network error');
      return { success: true };
    });

    expect(attempts).toBe(3);
    expect(result.success).toBe(true);
  });
});
```

---

## 🎯 E2E Tests (Manual Checklist)

### Transaction Flow
- [ ] Buka aplikasi
- [ ] Tambah item ke cart
- [ ] Hitung total dengan diskon
- [ ] Proses pembayaran
- [ ] Generate receipt
- [ ] Verify data tersimpan di database

### Sync Flow
- [ ] Buka offline mode
- [ ] Lakukan transaksi
- [ ] Buka online mode
- [ ] Trigger sync
- [ ] Verify data tersinkronisasi ke server

### Settings Flow
- [ ] Buka settings
- [ ] Update konfigurasi
- [ ] Verify perubahan applied
- [ ] Refresh aplikasi
- [ ] Verify settings persisted

---

## 📊 Coverage Targets

| File | Target |
|------|--------|
| validators.js | 95%+ |
| sync-engine.js | 90%+ |
| state-log.js | 90%+ |
| config.js | 85%+ |
| helpers.js | 85%+ |

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## ⚡ Performance Testing

### Load Testing
```javascript
describe('Performance', () => {
  it('should handle 1000 transactions', async () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      await db.saveTransaction({ /* ... */ });
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000); // < 5 seconds
  });
});
```

### Memory Usage
- Monitor memory dengan DevTools
- Target: < 50MB untuk normal usage
- Target: < 100MB peak

---

## 🐛 Debug Testing

### Using Test UI
```bash
npm run test:ui
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### Single Test File
```bash
npm test -- validators.test.js
```

### Single Test Case
```bash
npm test -- -t "validateEmail"
```

---

## 🔄 CI/CD Integration

### GitHub Actions (`.github/workflows/test.yml`)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 📋 Test Checklist

Before deploying:
- [ ] All unit tests pass
- [ ] Coverage > 85%
- [ ] No console errors
- [ ] No security warnings
- [ ] Performance acceptable
- [ ] Manual E2E tests pass
- [ ] Database integrity verified

---

## 🚀 Running Tests Locally

### Quick Test
```bash
npm test
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### With UI Dashboard
```bash
npm run test:ui
```

### Full Report with Coverage
```bash
npm run test:coverage
```

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Chai Assertions](https://www.chaijs.com/api/)

---

**Last Updated**: 2026-05-16
