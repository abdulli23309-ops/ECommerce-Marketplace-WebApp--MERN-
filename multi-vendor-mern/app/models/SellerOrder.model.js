import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    productNameSnapshot: {
      type: String,
      required: true,
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const sellerOrderSchema = new mongoose.Schema(
  {
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParentOrder',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    isReadBySeller: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: [
        'Pending',
        'Processing',
        'Packed',
        'Dispatched',
        'OutForDelivery',
        'Shipped',
        'Delivered',
        'Cancelled',
      ],
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
export default SellerOrder;