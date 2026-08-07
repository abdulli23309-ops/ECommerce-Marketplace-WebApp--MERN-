import Shipment from '../models/Shipment.model.js'; // add this import at the top if missing

export const getSellerOrders = async (userId) => {
  const { store } = await getStoreId(userId);

  // 1. Fetch seller orders (no populate on shipment)
  const sellerOrders = await SellerOrder.find({ store: store._id })
    .populate('parentOrder', 'orderStatus totalAmount createdAt')
    .populate('items.product', 'name')
    .lean();

  // 2. Collect seller order IDs to fetch shipments
  const sellerOrderIds = sellerOrders.map(so => so._id);

  // 3. Fetch all shipments for these seller orders
  const shipments = await Shipment.find({
    sellerOrder: { $in: sellerOrderIds }
  }).lean();

  // 4. Map shipment by sellerOrder ID for quick lookup
  const shipmentMap = new Map();
  shipments.forEach(s => {
    shipmentMap.set(s.sellerOrder.toString(), s);
  });

  // 5. Group by parentOrder._id to match the frontend structure
  const grouped = new Map();
  for (const so of sellerOrders) {
    const pid = so.parentOrder._id.toString();
    if (!grouped.has(pid)) {
      grouped.set(pid, {
        _id: so.parentOrder._id,
        orderStatus: so.parentOrder.orderStatus,
        totalAmount: so.parentOrder.totalAmount,
        createdAt: so.parentOrder.createdAt,
        sellerOrders: [],
      });
    }
    grouped.get(pid).sellerOrders.push({
      _id: so._id,
      store: so.store,
      status: so.status,
      subTotal: so.subTotal,
      items: so.items,
      shipment: shipmentMap.get(so._id.toString()) || null, // attach shipment if exists
    });
  }

  return Array.from(grouped.values());
};