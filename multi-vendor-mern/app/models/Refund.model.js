import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      required: true,
      unique: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;