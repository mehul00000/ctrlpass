import { normalizeCity } from './city';

describe('normalizeCity', () => {
  it('groups the Delhi metro area', () => {
    expect(normalizeCity('New Delhi')).toBe('Delhi-NCR');
    expect(normalizeCity('Noida')).toBe('Delhi-NCR');
    expect(normalizeCity('Gurugram')).toBe('Delhi-NCR');
  });

  it('passes through other cities and handles empties', () => {
    expect(normalizeCity('Mumbai')).toBe('Mumbai');
    expect(normalizeCity(null)).toBe('');
    expect(normalizeCity(undefined)).toBe('');
  });
});
