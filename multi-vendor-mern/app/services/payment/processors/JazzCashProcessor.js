export default class JazzCashProcessor {
  async createPaymentIntent(payment, order) {
    return {
      paymentIntentId: null,
      clientSecret: null,
    };
  }

  async process(payment, order, mobileAccount = null) {
    const TEST_SUCCESS_NUMBER = '03001234567';

    if (mobileAccount === TEST_SUCCESS_NUMBER) {
      payment.status = 'Completed';
      payment.transactionId = `JC-TEST-${Date.now()}`;
      payment.paidAt = new Date();
    } else {
      payment.status = 'Failed';
      payment.transactionId = null;
      payment.paidAt = null;
    }

    await payment.save();
    return payment;
  }
}