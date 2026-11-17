/**
 * Frontend Indian Context Formatters (INR, IST, Mobile)
 */

export const formatINR = (amount, includeSymbol = true) => {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(numeric);
};

export const formatISTDate = (date, includeTime = true) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(d);
};

export const normalizeIndianMobile = (mobile) => {
  if (!mobile) return '';
  let cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

export const isValidIndianMobile = (mobile) => {
  const normalized = normalizeIndianMobile(mobile);
  return /^[6-9]\d{9}$/.test(normalized);
};

export const formatIndianCurrency = formatINR;
export const formatIndianDateTime = formatISTDate;


