import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParentOrder',
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      required: true,
      enum: ['Dummy', 'CashOnDelivery', 'Stripe', 'PayPal', 'JazzCash', 'EasyPaisa'],
      default: 'Dummy',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    transactionId: {
      type: String,
      default: null,
    },
    stripePaymentIntentId: {      // ← new field
      type: String,
      default: null,
      index: true,
    },
    cardBrand: { type: String, default: null },
cardLast4: { type: String, default: null },
cardExpMonth: { type: Number, default: null },
cardExpYear: { type: Number, default: null },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;