import * as auditLogRepo from '../repositories/AdminAuditLog.repository.js';

export const logAction = async (actorId, action, entityType, entityId, metadata = {}) => {
  return auditLogRepo.create({ actor: actorId, action, entityType, entityId, metadata });
};

export const getLogs = (query) => auditLogRepo.findAllPaginated(query);