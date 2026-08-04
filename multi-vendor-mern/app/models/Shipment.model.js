import mongoose from 'mongoose';

const trackingEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Packed', 'Dispatched', 'OutForDelivery', 'Delivered'],
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    sellerOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      unique: true,           // one shipment per seller order
      index: true,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    carrier: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Packed', 'Dispatched', 'OutForDelivery', 'Delivered'],
      default: 'Pending',
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    trackingHistory: [trackingEntrySchema],
  },
  { timestamps: true }
);

// When status changes, we'll push an entry to trackingHistory in the service

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;