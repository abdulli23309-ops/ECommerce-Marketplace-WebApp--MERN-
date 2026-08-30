import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// M-013: The catalog is priced in PKR (frontend formatPKR / order totals), so a
// Stripe PaymentIntent must default to 'pkr' (a two-decimal currency) unless an
// explicit STRIPE_CURRENCY override is configured. This keeps the amount Stripe
// charges aligned with the prices customers actually see.
//
// StripeProcessor imports Stripe at module top of stripe.js; we stub it so the
// captured currency is the only thing under test, and rebuild the module to
// evaluate process.env.STRIPE_CURRENCY at import time like production does.

describe('M-013: Stripe PaymentIntent currency defaults to pkr', () => {
  const captured = { currency: null };
  const fakeIntent = { id: 'pi_test', client_secret: 'cs_test' };

  const loadProcessor = async () => {
    vi.resetModules();
    vi.doMock('../app/stripe.js', () => ({
      default: {
        paymentIntents: {
          create: vi.fn(async (opts) => {
            captured.currency = opts.currency;
            return fakeIntent;
          }),
        },
      },
    }));
    // Re-import the processor fresh so it picks up the stubbed Stripe. StripeProcessor
    // imports '../../../stripe.js' which resolves to the same multi-vendor-mern/app/
    // stripe.js the mock targets, so both specifiers match by resolved path.
    const mod = await import('../app/services/payment/processors/StripeProcessor.js');
    return mod.default;
  };

  afterEach(() => {
    delete process.env.STRIPE_CURRENCY;
    vi.doUnmock('../../../app/stripe.js');
    vi.resetModules();
  });

  it('defaults the intent currency to pkr when STRIPE_CURRENCY is unset', async () => {
    delete process.env.STRIPE_CURRENCY;
    const StripeProcessor = await loadProcessor();
    const processor = new StripeProcessor();

    const result = await processor.createPaymentIntent(
      { _id: 'pay1' },
      { _id: 'order1', customer: 'cust1', totalAmount: 250 }
    );

    expect(captured.currency).toBe('pkr');
    expect(result.clientSecret).toBe('cs_test');
    expect(result.paymentIntentId).toBe('pi_test');
  });

  it('respects an explicit STRIPE_CURRENCY override', async () => {
    process.env.STRIPE_CURRENCY = 'usd';
    const StripeProcessor = await loadProcessor();
    const processor = new StripeProcessor();

    await processor.createPaymentIntent(
      { _id: 'pay1' },
      { _id: 'order1', customer: 'cust1', totalAmount: 100 }
    );

    expect(captured.currency).toBe('usd');
  });
});