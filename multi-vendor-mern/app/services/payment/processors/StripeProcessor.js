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
    const amount = Math.round(order.totalAmount * 100);   // temporary: assumes two-decimal currency (USD for testing)

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: process.env.STRIPE_CURRENCY || 'usd',   // configurable – do NOT treat as final business currency
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