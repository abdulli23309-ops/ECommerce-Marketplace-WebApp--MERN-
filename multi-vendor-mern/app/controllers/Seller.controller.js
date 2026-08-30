import * as sellerService from '../services/Seller.service.js';
import * as sellerAppealService from '../services/SellerAppeal.service.js';
import * as moderationService from '../services/Moderation.service.js';
import SellerAppeal from '../models/SellerAppeal.model.js';
import SellerProfile from '../models/SellerProfile.model.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import { ApiError } from '../utils/ApiError.util.js';

export const getStatus = asyncHandler(async (req, res) => {
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) {
    return new ApiResponse(200, { hasProfile: false }, 'No seller profile').send(res);
  }
  return new ApiResponse(200, {
    hasProfile: true,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
  }, 'Seller status').send(res);
});

// Seller views their current suspension + derived moderation label.
export const getSuspensionStatus = asyncHandler(async (req, res) => {
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) {
    return new ApiResponse(200, { suspended: false }, 'No seller profile').send(res);
  }
  const active = await moderationService.getActiveSuspension(profile._id);

  // Compute lastRejectedAt from appeals for the active suspension or profile
  let lastRejectedAt = null;
  if (active) {
    const appeals = await SellerAppeal.find({ suspension: active._id, status: 'Rejected', decidedAt: { $ne: null } })
      .sort({ decidedAt: -1 })
      .limit(1)
      .lean();
    if (appeals.length > 0) lastRejectedAt = appeals[0].decidedAt;
  } else if (profile.status === 'Suspended') {
    // Fallback: check most recent rejection for this seller
    const appeals = await SellerAppeal.find({ sellerProfile: profile._id, status: 'Rejected', decidedAt: { $ne: null } })
      .sort({ decidedAt: -1 })
      .limit(1)
      .lean();
    if (appeals.length > 0) lastRejectedAt = appeals[0].decidedAt;
  }

  // Flatten suspension fields for frontend convenience (seller-safe only)
  const suspensionData = active ? {
    _id: active._id,
    reason: active.reason,
    suspendedAt: active.suspendedAt,
    suspendedBy: active.suspendedBy,
    status: active.status,
  } : null;

  new ApiResponse(
    200,
    {
      suspended: profile.status === 'Suspended',
      suspension: suspensionData,
      lastRejectedAt,
    },
    'Suspension status retrieved'
  ).send(res);
});

// Appeals (seller)
export const submitAppeal = asyncHandler(async (req, res) => {
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  const appeal = await sellerAppealService.submitAppeal(
    profile._id,
    req.body.appealText,
    req.user.id
  );
  new ApiResponse(201, appeal, 'Appeal submitted').send(res);
});

export const getMyAppeals = asyncHandler(async (req, res) => {
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) return new ApiResponse(200, [], 'No appeals').send(res);
  const appeals = await sellerAppealService.getSellerAppeals(profile._id, req.query.status);
  new ApiResponse(200, appeals, 'Appeals retrieved').send(res);
});

export const getMyAppealById = asyncHandler(async (req, res) => {
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  const appeal = await sellerAppealService.getSellerAppealById(req.params.id);
  if (!appeal || appeal.sellerProfile.toString() !== profile._id.toString()) {
    throw new ApiError(404, 'Appeal not found');
  }
  // Map _id to id for frontend convenience
  const appealResponse = appeal.toObject ? appeal.toObject() : appeal;
  appealResponse.id = appealResponse._id;
  new ApiResponse(200, appealResponse, 'Appeal retrieved').send(res);
});

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await sellerService.createProfile(req.user.id, req.body);
  new ApiResponse(201, profile, 'Seller profile created').send(res);
});

export const uploadStoreLogo = asyncHandler(async (req, res) => {
  // Suspended sellers cannot create new marketplace activity (store logo is marketplace activity)
  const profile = await sellerService.getProfile(req.user.id);
  if (!profile) throw new ApiError(404, 'Seller profile not found');
  if (profile.status === 'Suspended') {
    throw new ApiError(403, 'Your seller account is suspended and cannot create new marketplace activity');
  }
  const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);
  if (imagePaths.length === 0) throw new ApiError(400, 'No image uploaded');
  new ApiResponse(200, { logoUrl: imagePaths[0] }, 'Logo uploaded').send(res);
});

export const getSellerOrderById = asyncHandler(async (req, res) => {
  const order = await sellerService.getSellerOrderById(req.user.id, req.params.id);
  new ApiResponse(200, order, 'Seller order retrieved').send(res);
});

export const applyAsSeller = asyncHandler(async (req, res) => {
  const result = await sellerService.applyAsSeller(req.user.id, req.body, req.files);
  new ApiResponse(201, result, 'Application submitted').send(res);
});

// ---------- UPDATED: null‑safe getProfile ----------
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await sellerService.getSellerProfile(req.user.id);

  if (!profile) {
    return new ApiResponse(200, null, 'No seller profile found').send(res);
  }

  new ApiResponse(200, profile, 'Seller profile').send(res);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await sellerService.updateSellerProfile(req.user.id, req.body);
  new ApiResponse(200, profile, 'Profile updated').send(res);
});