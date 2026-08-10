import * as paymentService from '../services/Payment.service.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = paymentService.verifyWebhookSignature(req.body, sig);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await paymentService.handlePaymentSuccess(event);   // full event
        break;
      case 'payment_intent.payment_failed':
        await paymentService.handlePaymentFailure(event);   // full event
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    if (err.type === 'StripeSignatureVerificationError') {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }
    console.error('Webhook processing error:', err);
    res.status(200).json({ received: true });
  }
});