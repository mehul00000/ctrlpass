import { CheckInResult } from '../types';

export const SCAN_STATUS_LABEL: Record<CheckInResult['status'], string> = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  DUPLICATE: 'DUPLICATE',
  WRONG_EVENT: 'WRONG EVENT',
  ENTRY_NOT_OPEN: 'ENTRY NOT OPEN',
  ENTRY_CLOSED: 'ENTRY CLOSED',
  ALREADY_CHECKED_IN: 'DUPLICATE',
  CANCELLED: 'INVALID',
  REFUNDED: 'INVALID',
  EXPIRED: 'INVALID',
  UNAUTHORIZED: 'INVALID',
};

export function scanStatusLabel(status: CheckInResult['status']): string {
  return SCAN_STATUS_LABEL[status] ?? 'INVALID';
}
