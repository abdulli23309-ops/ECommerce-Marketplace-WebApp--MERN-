import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['attempt', 'success', 'failure', 'refund', 'cancel'],   // adjust as needed
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
    amount: {
      type: Number,   // may differ from Payment.amount in case of partial capture later
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    stripeEventId: {                    // ← NEW
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
export default PaymentTransaction;