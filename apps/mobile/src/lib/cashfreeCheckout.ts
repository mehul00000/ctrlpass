import { CFPaymentGatewayService, type CFErrorResponse } from 'react-native-cashfree-pg-sdk';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { ENV } from '../config/env';

/**
 * Opens the Cashfree native drop-in. Resolves when Cashfree verifies the payment
 * (final booking state still arrives via webhook + BookingStatus polling).
 * Rejects when the user cancels or the payment errors.
 */
export function startCashfreeCheckout(paymentSessionId: string, orderId: string): Promise<void> {
  const environment = ENV.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const session = new CFSession(paymentSessionId, orderId, environment);
  return new Promise((resolve, reject) => {
    CFPaymentGatewayService.setCallback({
      onVerify: (verifiedOrderId: string) => {
        CFPaymentGatewayService.removeCallback();
        if (verifiedOrderId === orderId) {
          resolve();
        } else {
          reject(new Error('Payment verified for a different order. Contact support.'));
        }
      },
      onError: (error: CFErrorResponse) => {
        CFPaymentGatewayService.removeCallback();
        reject(new Error(error.getMessage() || 'Payment was cancelled or failed.'));
      },
    });
    CFPaymentGatewayService.doWebPayment(session);
  });
}
