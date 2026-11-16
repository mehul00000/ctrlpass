import { userFacingError } from './userFacingError';

describe('userFacingError', () => {
  it('hides PostgREST internals', () => {
    expect(userFacingError(new Error('PostgREST error PGRST116'), 'Could not load events.')).toBe(
      'Could not load events.'
    );
  });

  it('keeps a short operator message', () => {
    expect(userFacingError(new Error('Please sign in to reserve tickets.'), 'Failed')).toBe(
      'Please sign in to reserve tickets.'
    );
  });

  it('maps booking RPC codes to actionable copy', () => {
    expect(userFacingError(new Error('SOLD_OUT'), 'Failed')).toBe(
      'Not enough passes left in that tier. Try a smaller quantity or another tier.'
    );
    expect(userFacingError(new Error('RESERVATION_EXPIRED'), 'Failed')).toBe(
      'Your 10-minute hold expired. Please select your tickets again.'
    );
  });
});
