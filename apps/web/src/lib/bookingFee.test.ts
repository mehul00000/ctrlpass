import { bookingFeeMinor } from '@ctrlpass/types';

// Display-side mirror of the authoritative SQL booking_fee_minor(); the reservation
// response from reserve_booking remains the only payable amount.
describe('bookingFeeMinor', () => {
  it('matches the server formula: ₹30 + ₹5 per extra ticket, capped at ₹60', () => {
    expect(bookingFeeMinor(1, true)).toBe(3000);
    expect(bookingFeeMinor(3, true)).toBe(4000);
    expect(bookingFeeMinor(7, true)).toBe(6000);
    expect(bookingFeeMinor(10, true)).toBe(6000);
  });

  it('waives the fee for free events', () => {
    expect(bookingFeeMinor(2, false)).toBe(0);
    expect(bookingFeeMinor(0, true)).toBe(0);
  });
});
