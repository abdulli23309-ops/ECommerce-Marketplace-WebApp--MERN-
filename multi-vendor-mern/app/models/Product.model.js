import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    internalNote: {
      type: String,
      default: null,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['PendingApproval', 'Approved', 'Rejected', 'Suspended', 'Archived'],
      default: 'PendingApproval',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ---- Priority 5: product rating moderation state ----
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

    // ---- Priority 5.8: seller-provided free delivery ----
    freeDelivery: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.index(
  { name: 1, store: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Product = mongoose.model('Product', productSchema);

export default Product;