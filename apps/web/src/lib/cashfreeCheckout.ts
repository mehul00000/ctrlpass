type CashfreeSdk = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: '_modal' | '_self' }) => Promise<unknown>;
};

function loadCashfreeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout is only available in the browser.'));
  if (document.getElementById('cashfree-sdk')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment checkout.'));
    document.body.appendChild(script);
  });
}

export async function startCashfreeCheckout(paymentSessionId: string): Promise<void> {
  if (!paymentSessionId) {
    throw new Error('Payment session is missing. Try again from checkout.');
  }
  await loadCashfreeScript();
  const factory = (window as unknown as { Cashfree?: (opts: { mode: string }) => CashfreeSdk }).Cashfree;
  if (!factory) {
    throw new Error('Payment checkout is unavailable. Open this booking on a supported browser.');
  }
  const mode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
  const cashfree = factory({ mode });
  await cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });
}
