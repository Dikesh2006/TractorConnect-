/**
 * Formatters and sanitizers for Indian context (IST, INR, mobile numbers, CSV)
 */

/**
 * Format currency in Indian numbering format: e.g. ₹1,25,000.00
 */
const formatINR = (amount, includeSymbol = true) => {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(numeric);
};

/**
 * Round a monetary amount safely to 2 decimal places to avoid floating point drift
 */
const round2Decimals = (num) => {
  const n = typeof num === 'number' ? num : parseFloat(num || 0);
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Format date in IST (Asia/Kolkata)
 */
const formatISTDate = (date, formatType = 'datetime') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  };

  if (formatType === 'datetime') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(d);
};

/**
 * Normalize Indian mobile number: strips +91, 0, hyphens, and whitespace,
 * returning clean 10 digits
 */
const normalizeIndianMobile = (mobile) => {
  if (!mobile) return '';
  let cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Validate Indian mobile number (must be 10 digits starting with 6, 7, 8, or 9)
 */
const isValidIndianMobile = (mobile) => {
  const normalized = normalizeIndianMobile(mobile);
  return /^[6-9]\d{9}$/.test(normalized);
};

/**
 * Sanitize a CSV cell to prevent CSV Formula Injection attacks.
 * If cell starts with '=', '+', '-', '@', '\t', or '\r', prefix with single quote `'`
 */
const sanitizeCSVCell = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // CSV injection protection: prefix dangerous trigger characters with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generate UTF-8 CSV with Byte Order Mark (BOM) for Excel compatibility with Indian names
 */
const generateCSV = (headers, rows) => {
  const BOM = '\uFEFF';
  const headerLine = headers.map((h) => sanitizeCSVCell(h)).join(',');
  const rowLines = rows.map((row) => row.map((cell) => sanitizeCSVCell(cell)).join(','));
  return BOM + [headerLine, ...rowLines].join('\r\n');
};

module.exports = {
  formatINR,
  round2Decimals,
  formatISTDate,
  normalizeIndianMobile,
  isValidIndianMobile,
  sanitizeCSVCell,
  generateCSV
};
