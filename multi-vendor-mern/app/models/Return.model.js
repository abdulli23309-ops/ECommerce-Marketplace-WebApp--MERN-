import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, unique: true },   // auto‑generated
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
    seller: {                                    // for quick seller lookup
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    refundAmount: { type: Number, default: null },
    status: {
      type: String,
      enum: [
        'PENDING_ADMIN_REVIEW',
        'REJECTED_BY_ADMIN',
        'PENDING_SELLER_REVIEW',
        'APPROVED_PENDING_SHIPMENT',
        'REJECTED_BY_SELLER',
        'ITEM_IN_TRANSIT',
        'SELLER_RECEIVED', 
        'INSPECTED_AND_REFUNDED',
      ],
      default: 'PENDING_ADMIN_REVIEW',           // ← new default
    },
    adminNotes: { type: String, default: null },
    sellerNotes: { type: String, default: null },
    returnTrackingNumber: { type: String, default: null },
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

// Auto‑generate unique returnNumber before saving
returnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const count = await mongoose.model('ReturnRequest').countDocuments();
    this.returnNumber = `RET-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const ReturnRequest = mongoose.model('ReturnRequest', returnSchema);
export default ReturnRequest;