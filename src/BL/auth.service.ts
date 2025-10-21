import {
  ServiceRepository,
  ServiceRoleRepository,
  RolePermissionRepository,
  ServiceEndpointRepository,
  ApiKeyRepository,
} from '@/DAL/auth.repository';
import type {
  Service,
  CreateServiceInput,
  ModifyServiceInput,
  ServiceRole,
  CreateServiceRoleInput,
  RolePermission,
  CreateRolePermissionInput,
  ServiceEndpoint,
  CreateServiceEndpointInput,
  UpdateServiceEndpointInput,
  ApiKey,
  CreateApiKeyInput,
  ResetApiKeyExpiryInput,
} from '@/DTO/auth.dto';
import logger from '@/lib/modules/logger.module';

// ===== Service Operations =====
export const ServiceService = {
  getService: async (id: string): Promise<Service | null> => {
    logger.debug(`[ServiceService.getService] Getting service with id: ${id}`);
    try {
      const service = await ServiceRepository.findById(id);
      logger.debug(`[ServiceService.getService] Service ${id} ${service ? 'retrieved' : 'not found'}`);
      return service;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceService.getService] Error getting service', error);
      throw error;
    }
  },

  createService: async (input: CreateServiceInput): Promise<Service> => {
    logger.info(`[ServiceService.createService] Creating service with name: ${input.name}`);
    try {
      const service = await ServiceRepository.create(input);
      logger.info(`[ServiceService.createService] Service created successfully with id: ${service.id}`);
      return service;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceService.createService] Error creating service', error);
      throw error;
    }
  },

  listServices: async (page: number = 1, pageSize: number = 10): Promise<{ services: Service[]; total: number }> => {
    logger.debug(`[ServiceService.listServices] Listing services - page: ${page}, pageSize: ${pageSize}`);
    try {
      const result = await ServiceRepository.findAll(page, pageSize);
      logger.debug(`[ServiceService.listServices] Retrieved ${result.services.length} services out of ${result.total} total`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceService.listServices] Error listing services', error);
      throw error;
    }
  },

  modifyService: async (input: ModifyServiceInput): Promise<Service | null> => {
    logger.info(`[ServiceService.modifyService] Modifying service with id: ${input.id}`);
    try {
      const service = await ServiceRepository.modify(input);
      logger.info(`[ServiceService.modifyService] Service ${input.id} ${service ? 'modified successfully' : 'not found'}`);
      return service;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceService.modifyService] Error modifying service', error);
      throw error;
    }
  },
};

// ===== ServiceRole Operations =====
export const ServiceRoleService = {
  getServiceRole: async (serviceId: string, roleId: string): Promise<ServiceRole | null> => {
    logger.debug(`[ServiceRoleService.getServiceRole] Getting serviceRole: ${serviceId}, ${roleId}`);
    try {
      const serviceRole = await ServiceRoleRepository.findByCompositeKey(serviceId, roleId);
      logger.debug(`[ServiceRoleService.getServiceRole] ServiceRole ${serviceRole ? 'retrieved' : 'not found'}`);
      return serviceRole;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleService.getServiceRole] Error getting serviceRole', error);
      throw error;
    }
  },

  createServiceRole: async (input: CreateServiceRoleInput): Promise<ServiceRole> => {
    logger.info(`[ServiceRoleService.createServiceRole] Creating serviceRole: ${input.serviceId}, ${input.roleId}`);
    try {
      const serviceRole = await ServiceRoleRepository.create(input);
      logger.info(`[ServiceRoleService.createServiceRole] ServiceRole created successfully`);
      return serviceRole;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleService.createServiceRole] Error creating serviceRole', error);
      throw error;
    }
  },

  listServiceRoles: async (serviceId?: string): Promise<ServiceRole[]> => {
    logger.debug(`[ServiceRoleService.listServiceRoles] Listing serviceRoles for service: ${serviceId || 'all'}`);
    try {
      const serviceRoles = serviceId ? await ServiceRoleRepository.findByServiceId(serviceId) : [];
      logger.debug(`[ServiceRoleService.listServiceRoles] Retrieved ${serviceRoles.length} serviceRoles`);
      return serviceRoles;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleService.listServiceRoles] Error listing serviceRoles', error);
      throw error;
    }
  },

  deleteServiceRole: async (serviceId: string, roleId: string): Promise<boolean> => {
    logger.info(`[ServiceRoleService.deleteServiceRole] Deleting serviceRole: ${serviceId}, ${roleId}`);
    try {
      const result = await ServiceRoleRepository.delete(serviceId, roleId);
      logger.info(`[ServiceRoleService.deleteServiceRole] ServiceRole ${result ? 'deleted successfully' : 'deletion failed'}`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleService.deleteServiceRole] Error deleting serviceRole', error);
      throw error;
    }
  },
};

// ===== RolePermission Operations =====
export const RolePermissionService = {
  getRolePermission: async (roleId: string, permissionId: string): Promise<RolePermission | null> => {
    logger.debug(`[RolePermissionService.getRolePermission] Getting rolePermission: ${roleId}, ${permissionId}`);
    try {
      const rolePermission = await RolePermissionRepository.findByCompositeKey(roleId, permissionId);
      logger.debug(`[RolePermissionService.getRolePermission] RolePermission ${rolePermission ? 'retrieved' : 'not found'}`);
      return rolePermission;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionService.getRolePermission] Error getting rolePermission', error);
      throw error;
    }
  },

  createRolePermission: async (input: CreateRolePermissionInput): Promise<RolePermission> => {
    logger.info(`[RolePermissionService.createRolePermission] Creating rolePermission: ${input.roleId}, ${input.permissionId}`);
    try {
      const rolePermission = await RolePermissionRepository.create(input);
      logger.info(`[RolePermissionService.createRolePermission] RolePermission created successfully`);
      return rolePermission;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionService.createRolePermission] Error creating rolePermission', error);
      throw error;
    }
  },

  listRolePermissions: async (roleId?: string): Promise<RolePermission[]> => {
    logger.debug(`[RolePermissionService.listRolePermissions] Listing rolePermissions for role: ${roleId || 'all'}`);
    try {
      const rolePermissions = roleId ? await RolePermissionRepository.findByRoleId(roleId) : [];
      logger.debug(`[RolePermissionService.listRolePermissions] Retrieved ${rolePermissions.length} rolePermissions`);
      return rolePermissions;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionService.listRolePermissions] Error listing rolePermissions', error);
      throw error;
    }
  },

  deleteRolePermission: async (roleId: string, permissionId: string): Promise<boolean> => {
    logger.info(`[RolePermissionService.deleteRolePermission] Deleting rolePermission: ${roleId}, ${permissionId}`);
    try {
      const result = await RolePermissionRepository.delete(roleId, permissionId);
      logger.info(`[RolePermissionService.deleteRolePermission] RolePermission ${result ? 'deleted successfully' : 'deletion failed'}`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionService.deleteRolePermission] Error deleting rolePermission', error);
      throw error;
    }
  },
};

// ===== ServiceEndpoint Operations =====
export const ServiceEndpointService = {
  getServiceEndpoint: async (id: string): Promise<ServiceEndpoint | null> => {
    logger.debug(`[ServiceEndpointService.getServiceEndpoint] Getting serviceEndpoint with id: ${id}`);
    try {
      const serviceEndpoint = await ServiceEndpointRepository.findById(id);
      logger.debug(`[ServiceEndpointService.getServiceEndpoint] ServiceEndpoint ${id} ${serviceEndpoint ? 'retrieved' : 'not found'}`);
      return serviceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointService.getServiceEndpoint] Error getting serviceEndpoint', error);
      throw error;
    }
  },

  createServiceEndpoint: async (input: CreateServiceEndpointInput): Promise<ServiceEndpoint> => {
    logger.info(`[ServiceEndpointService.createServiceEndpoint] Creating serviceEndpoint: ${input.serviceName}/${input.endpointName}`);
    try {
      const serviceEndpoint = await ServiceEndpointRepository.create(input);
      logger.info(`[ServiceEndpointService.createServiceEndpoint] ServiceEndpoint created successfully with id: ${serviceEndpoint.id}`);
      return serviceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointService.createServiceEndpoint] Error creating serviceEndpoint', error);
      throw error;
    }
  },

  listServiceEndpoints: async (serviceName?: string): Promise<ServiceEndpoint[]> => {
    logger.debug(`[ServiceEndpointService.listServiceEndpoints] Listing serviceEndpoints for service: ${serviceName || 'all'}`);
    try {
      const serviceEndpoints = serviceName ? await ServiceEndpointRepository.findByServiceName(serviceName) : [];
      logger.debug(`[ServiceEndpointService.listServiceEndpoints] Retrieved ${serviceEndpoints.length} serviceEndpoints`);
      return serviceEndpoints;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointService.listServiceEndpoints] Error listing serviceEndpoints', error);
      throw error;
    }
  },

  updateServiceEndpoint: async (input: UpdateServiceEndpointInput): Promise<ServiceEndpoint | null> => {
    logger.info(`[ServiceEndpointService.updateServiceEndpoint] Updating serviceEndpoint with id: ${input.id}`);
    try {
      const serviceEndpoint = await ServiceEndpointRepository.update(input);
      logger.info(`[ServiceEndpointService.updateServiceEndpoint] ServiceEndpoint ${input.id} ${serviceEndpoint ? 'updated successfully' : 'not found'}`);
      return serviceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointService.updateServiceEndpoint] Error updating serviceEndpoint', error);
      throw error;
    }
  },

  deleteServiceEndpoint: async (id: string): Promise<boolean> => {
    logger.info(`[ServiceEndpointService.deleteServiceEndpoint] Deleting serviceEndpoint with id: ${id}`);
    try {
      const result = await ServiceEndpointRepository.delete(id);
      logger.info(`[ServiceEndpointService.deleteServiceEndpoint] ServiceEndpoint ${id} ${result ? 'deleted successfully' : 'deletion failed'}`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointService.deleteServiceEndpoint] Error deleting serviceEndpoint', error);
      throw error;
    }
  },
};

// ===== ApiKey Operations =====
export const ApiKeyService = {
  getApiKey: async (id: string): Promise<ApiKey | null> => {
    logger.debug(`[ApiKeyService.getApiKey] Getting apiKey with id: ${id}`);
    try {
      const apiKey = await ApiKeyRepository.findById(id);
      logger.debug(`[ApiKeyService.getApiKey] ApiKey ${id} ${apiKey ? 'retrieved' : 'not found'}`);
      return apiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyService.getApiKey] Error getting apiKey', error);
      throw error;
    }
  },

  createApiKey: async (input: CreateApiKeyInput): Promise<ApiKey> => {
    logger.info(`[ApiKeyService.createApiKey] Creating apiKey for service: ${input.serviceId}`);
    try {
      const apiKey = await ApiKeyRepository.create(input);
      logger.info(`[ApiKeyService.createApiKey] ApiKey created successfully with id: ${apiKey.id}`);
      return apiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyService.createApiKey] Error creating apiKey', error);
      throw error;
    }
  },

  listApiKeys: async (serviceId?: string): Promise<ApiKey[]> => {
    logger.debug(`[ApiKeyService.listApiKeys] Listing apiKeys for service: ${serviceId || 'all'}`);
    try {
      const apiKeys = serviceId ? await ApiKeyRepository.findByServiceId(serviceId) : [];
      logger.debug(`[ApiKeyService.listApiKeys] Retrieved ${apiKeys.length} apiKeys`);
      return apiKeys;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyService.listApiKeys] Error listing apiKeys', error);
      throw error;
    }
  },

  revokeApiKey: async (id: string): Promise<boolean> => {
    logger.info(`[ApiKeyService.revokeApiKey] Revoking apiKey with id: ${id}`);
    try {
      const result = await ApiKeyRepository.revoke(id);
      logger.info(`[ApiKeyService.revokeApiKey] ApiKey ${id} ${result ? 'revoked successfully' : 'revocation failed'}`);
      return result;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyService.revokeApiKey] Error revoking apiKey', error);
      throw error;
    }
  },

  resetApiKeyExpiry: async (input: ResetApiKeyExpiryInput): Promise<ApiKey | null> => {
    logger.info(`[ApiKeyService.resetApiKeyExpiry] Resetting expiry for apiKey with id: ${input.id}`);
    try {
      const apiKey = await ApiKeyRepository.resetExpiry(input);
      logger.info(`[ApiKeyService.resetApiKeyExpiry] ApiKey ${input.id} ${apiKey ? 'expiry reset successfully' : 'not found'}`);
      return apiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyService.resetApiKeyExpiry] Error resetting apiKey expiry', error);
      throw error;
    }
  },
};
