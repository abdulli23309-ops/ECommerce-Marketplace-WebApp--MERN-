import mongoose from 'mongoose';

const appealHistoryEntry = {
  event: {
    type: String,
    enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'SUPERSEDED'],
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
};

const sellerAppealSchema = new mongoose.Schema(
  {
    suspension: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerSuspension',
      required: true,
    },
    sellerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Superseded'],
      default: 'Pending',
      index: true,
    },
    // v1: text-only appeals (Spec D2 — no attachments).
    appealText: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decisionReason: {
      type: String,
      default: '',
    },
    // Full audit trail of every appeal ever filed against the suspension.
    history: [appealHistoryEntry],
  },
  { timestamps: true }
);

// Enforce exactly ONE pending appeal per suspension at the database level
// (Spec D1). The partial filter applies the uniqueness only to Pending docs.
sellerAppealSchema.index(
  { suspension: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } }
);

const SellerAppeal = mongoose.model('SellerAppeal', sellerAppealSchema);

export default SellerAppeal;
