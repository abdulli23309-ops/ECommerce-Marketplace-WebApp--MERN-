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
    quantity: { type: Number, default: 1, min: 1 },
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

// Auto-generate unique returnNumber before saving.
// Concurrency-safe: uses an atomic findOneAndUpdate counter collection instead
// of countDocuments(), which could produce duplicate numbers (and unique-index
// collisions) when concurrent return requests are created.
returnSchema.pre('save', async function () {
  if (!this.returnNumber) {
    const counter = await mongoose.connection
      .collection('counters')
      .findOneAndUpdate(
        { _id: 'returnNumber' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
    const seq = counter.seq ?? counter.value?.seq ?? 1;
    this.returnNumber = `RET-${String(seq).padStart(6, '0')}`;
  }
});

const ReturnRequest = mongoose.model('ReturnRequest', returnSchema);
export default ReturnRequest;