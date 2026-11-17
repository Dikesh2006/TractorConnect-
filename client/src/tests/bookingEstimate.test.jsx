import { describe, it, expect } from 'vitest';
import { formatINR, formatISTDate, isValidIndianMobile, normalizeIndianMobile } from '../utils/formatters';

describe('Booking Cost Calculation & Indian Formatters', () => {
  // Pure logic calculation function matching NewBooking and CompleteWorkModal
  const calculateCost = (unitPrice, quantity, minimumCharge = 0) => {
    const raw = unitPrice * quantity;
    return Math.max(raw, minimumCharge);
  };

  it('calculates cost correctly based on acres and unit price', () => {
    // 5 acres @ ₹900/acre = ₹4,500
    expect(calculateCost(900, 5)).toBe(4500);
    // 2.5 acres @ ₹850/acre = ₹2,125
    expect(calculateCost(850, 2.5)).toBe(2125);
  });

  it('respects minimum charge when raw cost is below minimum', () => {
    // 0.5 acre @ ₹800 = ₹400, but minCharge is ₹600 -> returns ₹600
    expect(calculateCost(800, 0.5, 600)).toBe(600);
    // 2 acres @ ₹800 = ₹1,600, minCharge is ₹600 -> returns ₹1,600
    expect(calculateCost(800, 2, 600)).toBe(1600);
  });

  it('formats currency in Indian style with INR symbol', () => {
    const formatted = formatINR(125000);
    expect(formatted).toMatch(/1,25,000/);
  });

  it('formats date in IST (Asia/Kolkata)', () => {
    const testDate = '2026-11-15T04:30:00.000Z'; // 10:00 AM IST
    const formatted = formatISTDate(testDate, true);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Nov');
  });

  it('validates Indian 10-digit mobile numbers', () => {
    expect(isValidIndianMobile('9826011111')).toBe(true);
    expect(isValidIndianMobile('8826011111')).toBe(true);
    expect(isValidIndianMobile('7826011111')).toBe(true);
    expect(isValidIndianMobile('6826011111')).toBe(true);
    expect(isValidIndianMobile('5826011111')).toBe(false); // starts with 5
    expect(isValidIndianMobile('982601111')).toBe(false); // only 9 digits
  });

  it('normalizes Indian mobile numbers by removing +91 prefix and whitespaces', () => {
    expect(normalizeIndianMobile('+91 98260 11111')).toBe('9826011111');
    expect(normalizeIndianMobile('09826011111')).toBe('9826011111');
  });
});

