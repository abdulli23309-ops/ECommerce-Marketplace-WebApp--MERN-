import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    taxId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    // ---- Priority 5: seller rating moderation state ----
    lastSellerWarningAt: {
      type: Date,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    lowRatingStatus: {
      type: Boolean,
      default: false,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    warningHistory: [
      {
        warnedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          default: '',
        },
        warnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sellerProfileSchema.virtual('store', {
  ref: 'Store',
  localField: '_id',
  foreignField: 'sellerProfile',
  justOne: true,
});

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;