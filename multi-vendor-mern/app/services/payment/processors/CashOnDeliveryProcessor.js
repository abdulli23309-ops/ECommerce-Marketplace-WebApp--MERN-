export default class CashOnDeliveryProcessor {
  async createPaymentIntent(payment, order) {
    // COD does not require a payment intent or client secret.
    return {
      paymentIntentId: null,
      clientSecret: null,
    };
  }

  async process(payment, order) {
    // Cash on Delivery is collected when the courier delivers the order, so no
    // money has moved at checkout. The payment therefore stays 'Pending':
    // we do NOT mark it Completed, and we do not set paidAt or a transactionId.
    // It becomes Completed only when the cash is collected on delivery.
    payment.status = 'Pending';
    await payment.save();
    return payment;
  }
}