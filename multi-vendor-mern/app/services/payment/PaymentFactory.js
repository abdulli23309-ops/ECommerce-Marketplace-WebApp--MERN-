import StripeProcessor from './processors/StripeProcessor.js';
import CashOnDeliveryProcessor from './processors/CashOnDeliveryProcessor.js';
import EasyPaisaProcessor from './processors/EasyPaisaProcessor.js';
import JazzCashProcessor from './processors/JazzCashProcessor.js';

export const createPaymentProcessor = (method) => {
  switch (method) {
    case 'Stripe':
      return new StripeProcessor();
    case 'CashOnDelivery':
      return new CashOnDeliveryProcessor();
    case 'EasyPaisa':
      return new EasyPaisaProcessor();
    case 'JazzCash':
      return new JazzCashProcessor();
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
};