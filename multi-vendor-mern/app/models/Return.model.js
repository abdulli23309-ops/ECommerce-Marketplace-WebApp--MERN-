import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sellerOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
  type: String,
  default: '',
},
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected', 'Completed'],
      default: 'Requested',
    },
    rejectionReason: {
      type: String,
      default: null,
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
  },
  { timestamps: true }
);

returnSchema.index(
  { customer: 1, product: 1, sellerOrder: 1 },
  { unique: true }
);

const ReturnRequest = mongoose.model('ReturnRequest', returnSchema);
export default ReturnRequest;