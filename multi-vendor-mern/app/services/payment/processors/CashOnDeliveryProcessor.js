export default class CashOnDeliveryProcessor {
  async createPaymentIntent(payment, order) {
    // COD does not require a payment intent or client secret.
    return {
      paymentIntentId: null,
      clientSecret: null,
    };
  }

  async process(payment, order) {
    // Mark the COD payment as completed immediately in sandbox/test mode.
    payment.status = 'Completed';
    payment.transactionId = `COD-${Date.now()}`;
    payment.paidAt = new Date();
    await payment.save();
    return payment;
  }
}