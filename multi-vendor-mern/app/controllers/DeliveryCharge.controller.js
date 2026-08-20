import * as deliveryChargeService from '../services/DeliveryCharge.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await deliveryChargeService.listDeliveryCharges();
  new ApiResponse(200, data, 'Delivery charges retrieved').send(res);
});

export const upsert = asyncHandler(async (req, res) => {
  const data = await deliveryChargeService.upsertDeliveryCharge(
    req.params.sellerProfileId,
    req.body
  );
  new ApiResponse(200, data, 'Delivery charge updated').send(res);
});