import * as shipmentService from '../services/Shipment.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const createShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.createShipment(
    req.body.sellerOrderId,
    req.body,
    req.user.id
  );
  new ApiResponse(201, shipment, 'Shipment created').send(res);
});

export const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const shipment = await shipmentService.updateShipmentStatus(
    req.params.id,
    status,
    note,
    req.user.id
  );
  new ApiResponse(200, shipment, 'Shipment status updated').send(res);
});

export const getShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipment(
    req.params.sellerOrderId,
    req.user.id
  );
  new ApiResponse(200, shipment, 'Shipment retrieved').send(res);
});