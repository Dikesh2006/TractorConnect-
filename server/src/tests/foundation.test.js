const request = require('supertest');
const app = require('../app');
const {
  formatINR,
  round2Decimals,
  formatISTDate,
  normalizeIndianMobile,
  isValidIndianMobile,
  sanitizeCSVCell,
  generateCSV
} = require('../utils/formatters');

describe('Server Foundation & Health', () => {
  it('should return health check data on GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('environment');
  });

  it('should return welcome payload on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('TractorConnect API');
  });

  it('should return endpoints list on GET /api/v1', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.endpoints)).toBe(true);
  });

  it('should handle 404 for non-existent routes', async () => {
    const res = await request(app).get('/api/non-existent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });
});

describe('Indian Context Utilities & CSV Sanitization', () => {
  it('formats currency in Indian style (₹)', () => {
    const formatted = formatINR(125000);
    // Note: Intl formatting may use non-breaking space
    expect(formatted).toMatch(/1,25,000/);
  });

  it('rounds numbers to 2 decimal places safely', () => {
    expect(round2Decimals(1234.567)).toBe(1234.57);
    expect(round2Decimals(1234.5)).toBe(1234.5);
  });

  it('validates and normalizes Indian mobile numbers', () => {
    expect(normalizeIndianMobile('+91 98765 43210')).toBe('9876543210');
    expect(normalizeIndianMobile('09876543210')).toBe('9876543210');
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('5876543210')).toBe(false); // starts with 5
    expect(isValidIndianMobile('987654321')).toBe(false); // only 9 digits
  });

  it('prevents CSV Formula Injection by prefixing dangerous characters', () => {
    expect(sanitizeCSVCell('=SUM(A1:B1)')).toBe("'=SUM(A1:B1)");
    expect(sanitizeCSVCell('+100')).toBe("'+100");
    expect(sanitizeCSVCell('-250')).toBe("'-250");
    expect(sanitizeCSVCell('@cmd')).toBe("'@cmd");
    expect(sanitizeCSVCell('Normal Text')).toBe('Normal Text');
  });

  it('generates CSV with UTF-8 BOM', () => {
    const headers = ['Name', 'Village', 'Amount'];
    const rows = [['रामेश्वर (Ramesh)', 'Bilkisganj', 1500]];
    const csv = generateCSV(headers, rows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('रामेश्वर (Ramesh)');
  });
});

