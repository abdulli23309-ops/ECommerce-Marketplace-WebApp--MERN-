import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';
import * as authorizationTestService from '../services/AuthorizationTest.service.js';

const authenticated = asyncHandler(async (req, res) => {
  const data = authorizationTestService.authenticatedAccess(req.user);
  new ApiResponse(200, data, 'Authenticated access granted').send(res);
});

const seller = asyncHandler(async (req, res) => {
  const data = authorizationTestService.roleAccess(req.user, 'Seller');
  new ApiResponse(200, data, 'Seller access granted').send(res);
});

const admin = asyncHandler(async (req, res) => {
  const data = authorizationTestService.roleAccess(req.user, 'Admin');
  new ApiResponse(200, data, 'Admin access granted').send(res);
});

const productsCreate = asyncHandler(async (req, res) => {
  const data = authorizationTestService.permissionAccess(req.user, 'Products.Create');
  new ApiResponse(200, data, 'Products.Create permission granted').send(res);
});

export { admin, authenticated, productsCreate, seller };
