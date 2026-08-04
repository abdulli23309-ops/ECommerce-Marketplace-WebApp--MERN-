import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,   // nullable, just like ASP.NET (product may be deleted later)
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
  { _id: false }   // no separate _id for each item (like Cart)
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
      default: null,   // matches ASP.NET nullable StoreId
    },
    subTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
export default SellerOrder;