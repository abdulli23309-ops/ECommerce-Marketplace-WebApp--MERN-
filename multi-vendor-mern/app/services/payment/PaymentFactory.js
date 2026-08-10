import StripeProcessor from './processors/StripeProcessor.js';
import CodProcessor from './processors/CodProcessor.js';

const processors = {
  Stripe: StripeProcessor,
  CashOnDelivery: CodProcessor,
  // Future: PayPal, JazzCash, etc.
};

export const createPaymentProcessor = (method) => {
  const Processor = processors[method];
  if (!Processor) {
    throw new Error(`Unsupported payment method: ${method}`);
  }
  return new Processor();
};