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