import * as auditLogService from '../services/AdminAuditLog.service.js';
import { ApiResponse } from '../utils/ApiResponse.util.js';
import { asyncHandler } from '../utils/AsyncHandler.util.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getLogs(req.query);
  new ApiResponse(200, result, 'Audit logs retrieved').send(res);
});