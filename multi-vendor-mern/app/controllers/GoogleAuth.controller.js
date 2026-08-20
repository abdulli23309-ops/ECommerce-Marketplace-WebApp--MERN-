import * as googleAuthService from '../services/GoogleAuth.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await googleAuthService.authenticateWithGoogle(req.body);

  new ApiResponse(200, {
    user: result.user,
    tokens: result.tokens,
  }, 'Google authentication successful').send(res);
});