import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// One review per customer per product per seller order (i.e., per order item)
reviewSchema.index(
  { customer: 1, product: 1, sellerOrder: 1 },
  { unique: true }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;