import * as sellerService from '../services/Seller.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getStatus = asyncHandler(async (req, res) => {
  try {
    console.log('getStatus called, userId:', req.user.id);
    const profile = await sellerService.getProfile(req.user.id);
    if (!profile) {
      return new ApiResponse(200, { hasProfile: false }, 'No seller profile').send(res);
    }
    return new ApiResponse(200, {
      hasProfile: true,
      status: profile.status,
      rejectionReason: profile.rejectionReason,
    }, 'Seller status').send(res);
  } catch (err) {
    console.error('getStatus error:', err.message, err.stack);
    throw err;
  }
});

export const createProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await sellerService.createProfile(req.user.id, req.body);
    new ApiResponse(201, profile, 'Seller profile created').send(res);
  } catch (err) {
    console.error('createProfile error:', err.message, err.stack);
    throw err;
  }
});
export const uploadStoreLogo = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  if (imagePaths.length === 0) throw new ApiError(400, 'No image uploaded');
  new ApiResponse(200, { logoUrl: imagePaths[0] }, 'Logo uploaded').send(res);
});
export const getSellerOrderById = asyncHandler(async (req, res) => {
  const order = await SellerOrder.findById(req.params.id).populate('store', 'name').lean();
  if (!order) throw new ApiError(404, 'Seller order not found');
  new ApiResponse(200, order, 'Seller order retrieved').send(res);
});

export const applyAsSeller = asyncHandler(async (req, res) => {
  const result = await sellerService.applyAsSeller(req.user.id, req.body, req.files);
  new ApiResponse(201, result, 'Application submitted').send(res);
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await sellerService.getSellerProfile(req.user.id);
  new ApiResponse(200, profile, 'Seller profile').send(res);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await sellerService.updateSellerProfile(req.user.id, req.body);
  new ApiResponse(200, profile, 'Profile updated').send(res);
});