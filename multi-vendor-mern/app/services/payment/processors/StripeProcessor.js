import stripe from '../../../stripe.js';

/**
 * Stripe payment processor – Phase 4: real Stripe PaymentIntent creation.
 * Still no database writes, no webhook, no order/stock changes.
 */
export default class StripeProcessor {
  /**
   * Creates a real Stripe PaymentIntent.
   * @param {Object} payment - Payment document (not modified)
   * @param {Object} order   - ParentOrder document (not modified)
   * @returns {Object} { clientSecret, paymentIntentId }
   */
  async createPaymentIntent(payment, order) {
    // The catalog is priced in PKR (see frontend formatPKR and order totals).
    // PKR is a two-decimal Stripe currency, so minor units = amount × 100.
    const amount = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      // M-013: default to the catalog currency (pkr) so PaymentIntents match
      // the prices customers actually see. STRIPE_CURRENCY remains available
      // as an explicit override for other deployments.
      currency: process.env.STRIPE_CURRENCY || 'pkr',
      metadata: {
        parentOrderId: order._id.toString(),
        paymentId: payment._id.toString(),
        customerId: order.customer.toString(),
      },
      automatic_payment_methods: {
        enabled: true,   // will be scoped to Card in the frontend/confirmation phase
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // confirmPayment() intentionally omitted – webhook will handle final status
}