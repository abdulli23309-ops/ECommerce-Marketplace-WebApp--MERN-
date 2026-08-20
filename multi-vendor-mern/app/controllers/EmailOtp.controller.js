import * as emailOtpService from '../services/EmailOtp.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { purpose = 'account_verification' } = req.body;

  const result = await emailOtpService.generateAndSendOtp(req.user.id, purpose);

  new ApiResponse(
    200,
    {
      emailOtpId: result.emailOtpId,
      expiresAt: result.expiresAt,
    },
    'OTP sent'
  ).send(res);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { purpose = 'account_verification', otp } = req.body;

  await emailOtpService.verifyOtpAndMarkVerified(req.user.id, purpose, otp);

  new ApiResponse(200, { verified: true }, 'OTP verified').send(res);
});