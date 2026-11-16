import { scanStatusLabel } from './scanStatus';

describe('scanStatusLabel', () => {
  it('maps gate results to operator copy', () => {
    expect(scanStatusLabel('VALID')).toBe('VALID');
    expect(scanStatusLabel('INVALID')).toBe('INVALID');
    expect(scanStatusLabel('DUPLICATE')).toBe('DUPLICATE');
    expect(scanStatusLabel('ALREADY_CHECKED_IN')).toBe('DUPLICATE');
    expect(scanStatusLabel('WRONG_EVENT')).toBe('WRONG EVENT');
    expect(scanStatusLabel('ENTRY_NOT_OPEN')).toBe('ENTRY NOT OPEN');
    expect(scanStatusLabel('ENTRY_CLOSED')).toBe('ENTRY CLOSED');
  });
});
