import mongoose from 'mongoose';

const suspensionTimelineEntry = {
  event: {
    type: String,
    enum: ['SUSPENDED', 'LIFTED'],
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reason: {
    type: String,
    default: '',
  },
};

const sellerSuspensionSchema = new mongoose.Schema(
  {
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Lifted'],
      default: 'Active',
      index: true,
    },
    reason: {
      type: String,
      default: '',
    },
    internalNote: {
      type: String,
      default: '',
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspendedAt: {
      type: Date,
      default: Date.now,
    },
    liftedAt: {
      type: Date,
      default: null,
    },
    liftedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Audit trail of every suspend/lift event on this suspension record.
    timeline: [suspensionTimelineEntry],
  },
  { timestamps: true }
);

// Enforce at most ONE active suspension per seller profile. The partial filter
// makes the index apply only to Active documents, so multiple lifted
// suspensions may coexist historically while exactly one Active exists.
sellerSuspensionSchema.index(
  { sellerProfile: 1 },
  { unique: true, partialFilterExpression: { status: 'Active' } }
);

const SellerSuspension = mongoose.model(
  'SellerSuspension',
  sellerSuspensionSchema
);

export default SellerSuspension;
