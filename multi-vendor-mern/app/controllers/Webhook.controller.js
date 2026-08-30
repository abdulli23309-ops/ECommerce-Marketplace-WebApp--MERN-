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
    // Do NOT acknowledge processing/database/application failures as successful.
    // Returning 200 here would tell Stripe the webhook was handled, causing it to
    // stop retrying even though the order/payment state may be incomplete. A 5xx
    // response lets Stripe retry the delivery so the event can be reprocessed.
    // Idempotency is preserved: handlePaymentSuccess/handlePaymentFailure short
    // circuit (return without throwing) for already-processed events, so a retry
    // after a transient failure resolves to a 200.
    res.status(500).json({ received: false, error: 'Webhook processing failed' });
  }
});