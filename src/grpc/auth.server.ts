import {
  ServiceService,
  ServiceRoleService,
  RolePermissionService,
  ServiceEndpointService,
  ApiKeyService,
} from '@/BL/auth.service';
import {
  CreateServiceSchema,
  ModifyServiceSchema,
  CreateServiceRoleSchema,
  CreateRolePermissionSchema,
  CreateServiceEndpointSchema,
  UpdateServiceEndpointSchema,
  CreateApiKeySchema,
  ResetApiKeyExpirySchema,
} from '@/DTO/auth.dto';
import type { grpc } from '@/lib/grpc';
import type {
  CreateServiceRequest,
  CreateServiceResponse,
  GetServiceRequest,
  GetServiceResponse,
  ListServicesRequest,
  ListServicesResponse,
  ModifyServiceRequest,
  ModifyServiceResponse,
  CreateServiceRoleRequest,
  CreateServiceRoleResponse,
  GetServiceRoleRequest,
  GetServiceRoleResponse,
  ListServiceRolesRequest,
  ListServiceRolesResponse,
  DeleteServiceRoleRequest,
  DeleteServiceRoleResponse,
  CreateRolePermissionRequest,
  CreateRolePermissionResponse,
  GetRolePermissionRequest,
  GetRolePermissionResponse,
  ListRolePermissionsRequest,
  ListRolePermissionsResponse,
  DeleteRolePermissionRequest,
  DeleteRolePermissionResponse,
  CreateServiceEndpointRequest,
  CreateServiceEndpointResponse,
  GetServiceEndpointRequest,
  GetServiceEndpointResponse,
  ListServiceEndpointsRequest,
  ListServiceEndpointsResponse,
  UpdateServiceEndpointRequest,
  UpdateServiceEndpointResponse,
  DeleteServiceEndpointRequest,
  DeleteServiceEndpointResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  GetApiKeyRequest,
  GetApiKeyResponse,
  ListApiKeysRequest,
  ListApiKeysResponse,
  RevokeApiKeyRequest,
  RevokeApiKeyResponse,
  ResetApiKeyExpiryRequest,
  ResetApiKeyExpiryResponse,
} from '@/DTO/auth.dto';
import logger from '@/lib/modules/logger.module';

export const authServiceImplementation = {
  // ===== Service operations =====
  createService: async (
    call: grpc.ServerUnaryCall<CreateServiceRequest, CreateServiceResponse>,
    callback: grpc.sendUnaryData<CreateServiceResponse>
  ) => {
    logger.debug('[authServiceImplementation.createService] Request received to create service');
    try {
      const input = CreateServiceSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.createService] Validated input for service: ${input.name}`);
      const service = await ServiceService.createService(input);

      logger.info(`[authServiceImplementation.createService] Service created successfully with id: ${service.id}`);
      callback(null, {
        service: {
          id: service.id,
          name: service.name,
          roleId: service.roleId || '',
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.createService] Error in createService', error);
      callback(null, {
        service: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  getService: async (
    call: grpc.ServerUnaryCall<GetServiceRequest, GetServiceResponse>,
    callback: grpc.sendUnaryData<GetServiceResponse>
  ) => {
    logger.debug(`[authServiceImplementation.getService] Request received for service id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const service = await ServiceService.getService(id);

      if (!service) {
        logger.warn(`[authServiceImplementation.getService] Service not found: ${id}`);
        callback(null, {
          service: undefined,
          error: 'Service not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.getService] Service found: ${id}`);
      callback(null, {
        service: {
          id: service.id,
          name: service.name,
          roleId: service.roleId || '',
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.getService] Error in getService', error);
      callback(null, {
        service: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listServices: async (
    call: grpc.ServerUnaryCall<ListServicesRequest, ListServicesResponse>,
    callback: grpc.sendUnaryData<ListServicesResponse>
  ) => {
    logger.debug(`[authServiceImplementation.listServices] Request received with page: ${call.request.page}, pageSize: ${call.request.pageSize}`);
    try {
      const { page = 1, pageSize = 10 } = call.request;
      const result = await ServiceService.listServices(page, pageSize);

      logger.info(`[authServiceImplementation.listServices] Retrieved ${result.services.length} services out of ${result.total} total`);
      callback(null, {
        services: result.services.map((service) => ({
          id: service.id,
          name: service.name,
          roleId: service.roleId || '',
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        })),
        total: result.total,
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.listServices] Error in listServices', error);
      callback(null, {
        services: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  modifyService: async (
    call: grpc.ServerUnaryCall<ModifyServiceRequest, ModifyServiceResponse>,
    callback: grpc.sendUnaryData<ModifyServiceResponse>
  ) => {
    logger.debug(`[authServiceImplementation.modifyService] Request received to modify service id: ${call.request.id}`);
    try {
      const input = ModifyServiceSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.modifyService] Validated input for service id: ${input.id}`);
      const service = await ServiceService.modifyService(input);

      if (!service) {
        logger.warn(`[authServiceImplementation.modifyService] Service not found: ${input.id}`);
        callback(null, {
          service: undefined,
          error: 'Service not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.modifyService] Service modified successfully: ${input.id}`);
      callback(null, {
        service: {
          id: service.id,
          name: service.name,
          roleId: service.roleId || '',
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.modifyService] Error in modifyService', error);
      callback(null, {
        service: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // ===== ServiceRole operations =====
  createServiceRole: async (
    call: grpc.ServerUnaryCall<CreateServiceRoleRequest, CreateServiceRoleResponse>,
    callback: grpc.sendUnaryData<CreateServiceRoleResponse>
  ) => {
    logger.debug('[authServiceImplementation.createServiceRole] Request received to create serviceRole');
    try {
      const input = CreateServiceRoleSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.createServiceRole] Validated input for serviceRole: ${input.serviceId}, ${input.roleId}`);
      const serviceRole = await ServiceRoleService.createServiceRole(input);

      logger.info(`[authServiceImplementation.createServiceRole] ServiceRole created successfully`);
      callback(null, { serviceRole });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.createServiceRole] Error in createServiceRole', error);
      callback(null, {
        serviceRole: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  getServiceRole: async (
    call: grpc.ServerUnaryCall<GetServiceRoleRequest, GetServiceRoleResponse>,
    callback: grpc.sendUnaryData<GetServiceRoleResponse>
  ) => {
    logger.debug(`[authServiceImplementation.getServiceRole] Request received for serviceRole: ${call.request.serviceId}, ${call.request.roleId}`);
    try {
      const { serviceId, roleId } = call.request;
      const serviceRole = await ServiceRoleService.getServiceRole(serviceId, roleId);

      if (!serviceRole) {
        logger.warn(`[authServiceImplementation.getServiceRole] ServiceRole not found`);
        callback(null, {
          serviceRole: undefined,
          error: 'ServiceRole not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.getServiceRole] ServiceRole found`);
      callback(null, { serviceRole });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.getServiceRole] Error in getServiceRole', error);
      callback(null, {
        serviceRole: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listServiceRoles: async (
    call: grpc.ServerUnaryCall<ListServiceRolesRequest, ListServiceRolesResponse>,
    callback: grpc.sendUnaryData<ListServiceRolesResponse>
  ) => {
    logger.debug(`[authServiceImplementation.listServiceRoles] Request received for service: ${call.request.serviceId || 'all'}`);
    try {
      const { serviceId } = call.request;
      const serviceRoles = await ServiceRoleService.listServiceRoles(serviceId);

      logger.info(`[authServiceImplementation.listServiceRoles] Retrieved ${serviceRoles.length} serviceRoles`);
      callback(null, { serviceRoles });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.listServiceRoles] Error in listServiceRoles', error);
      callback(null, {
        serviceRoles: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  deleteServiceRole: async (
    call: grpc.ServerUnaryCall<DeleteServiceRoleRequest, DeleteServiceRoleResponse>,
    callback: grpc.sendUnaryData<DeleteServiceRoleResponse>
  ) => {
    logger.debug(`[authServiceImplementation.deleteServiceRole] Request received to delete serviceRole: ${call.request.serviceId}, ${call.request.roleId}`);
    try {
      const { serviceId, roleId } = call.request;
      const success = await ServiceRoleService.deleteServiceRole(serviceId, roleId);

      logger.info(`[authServiceImplementation.deleteServiceRole] ServiceRole deletion ${success ? 'successful' : 'failed'}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.deleteServiceRole] Error in deleteServiceRole', error);
      callback(null, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // ===== RolePermission operations =====
  createRolePermission: async (
    call: grpc.ServerUnaryCall<CreateRolePermissionRequest, CreateRolePermissionResponse>,
    callback: grpc.sendUnaryData<CreateRolePermissionResponse>
  ) => {
    logger.debug('[authServiceImplementation.createRolePermission] Request received to create rolePermission');
    try {
      const input = CreateRolePermissionSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.createRolePermission] Validated input for rolePermission: ${input.roleId}, ${input.permissionId}`);
      const rolePermission = await RolePermissionService.createRolePermission(input);

      logger.info(`[authServiceImplementation.createRolePermission] RolePermission created successfully`);
      callback(null, { rolePermission });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.createRolePermission] Error in createRolePermission', error);
      callback(null, {
        rolePermission: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  getRolePermission: async (
    call: grpc.ServerUnaryCall<GetRolePermissionRequest, GetRolePermissionResponse>,
    callback: grpc.sendUnaryData<GetRolePermissionResponse>
  ) => {
    logger.debug(`[authServiceImplementation.getRolePermission] Request received for rolePermission: ${call.request.roleId}, ${call.request.permissionId}`);
    try {
      const { roleId, permissionId } = call.request;
      const rolePermission = await RolePermissionService.getRolePermission(roleId, permissionId);

      if (!rolePermission) {
        logger.warn(`[authServiceImplementation.getRolePermission] RolePermission not found`);
        callback(null, {
          rolePermission: undefined,
          error: 'RolePermission not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.getRolePermission] RolePermission found`);
      callback(null, { rolePermission });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.getRolePermission] Error in getRolePermission', error);
      callback(null, {
        rolePermission: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listRolePermissions: async (
    call: grpc.ServerUnaryCall<ListRolePermissionsRequest, ListRolePermissionsResponse>,
    callback: grpc.sendUnaryData<ListRolePermissionsResponse>
  ) => {
    logger.debug(`[authServiceImplementation.listRolePermissions] Request received for role: ${call.request.roleId || 'all'}`);
    try {
      const { roleId } = call.request;
      const rolePermissions = await RolePermissionService.listRolePermissions(roleId);

      logger.info(`[authServiceImplementation.listRolePermissions] Retrieved ${rolePermissions.length} rolePermissions`);
      callback(null, { rolePermissions });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.listRolePermissions] Error in listRolePermissions', error);
      callback(null, {
        rolePermissions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  deleteRolePermission: async (
    call: grpc.ServerUnaryCall<DeleteRolePermissionRequest, DeleteRolePermissionResponse>,
    callback: grpc.sendUnaryData<DeleteRolePermissionResponse>
  ) => {
    logger.debug(`[authServiceImplementation.deleteRolePermission] Request received to delete rolePermission: ${call.request.roleId}, ${call.request.permissionId}`);
    try {
      const { roleId, permissionId } = call.request;
      const success = await RolePermissionService.deleteRolePermission(roleId, permissionId);

      logger.info(`[authServiceImplementation.deleteRolePermission] RolePermission deletion ${success ? 'successful' : 'failed'}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.deleteRolePermission] Error in deleteRolePermission', error);
      callback(null, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // ===== ServiceEndpoint operations =====
  createServiceEndpoint: async (
    call: grpc.ServerUnaryCall<CreateServiceEndpointRequest, CreateServiceEndpointResponse>,
    callback: grpc.sendUnaryData<CreateServiceEndpointResponse>
  ) => {
    logger.debug('[authServiceImplementation.createServiceEndpoint] Request received to create serviceEndpoint');
    try {
      const input = CreateServiceEndpointSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.createServiceEndpoint] Validated input for serviceEndpoint: ${input.serviceName}/${input.endpointName}`);
      const serviceEndpoint = await ServiceEndpointService.createServiceEndpoint(input);

      logger.info(`[authServiceImplementation.createServiceEndpoint] ServiceEndpoint created successfully with id: ${serviceEndpoint.id}`);
      callback(null, {
        serviceEndpoint: {
          id: serviceEndpoint.id,
          serviceName: serviceEndpoint.serviceName,
          endpointName: serviceEndpoint.endpointName,
          permissionId: serviceEndpoint.permissionId,
          createdAt: serviceEndpoint.createdAt.toISOString(),
          updatedAt: serviceEndpoint.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.createServiceEndpoint] Error in createServiceEndpoint', error);
      callback(null, {
        serviceEndpoint: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  getServiceEndpoint: async (
    call: grpc.ServerUnaryCall<GetServiceEndpointRequest, GetServiceEndpointResponse>,
    callback: grpc.sendUnaryData<GetServiceEndpointResponse>
  ) => {
    logger.debug(`[authServiceImplementation.getServiceEndpoint] Request received for serviceEndpoint id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const serviceEndpoint = await ServiceEndpointService.getServiceEndpoint(id);

      if (!serviceEndpoint) {
        logger.warn(`[authServiceImplementation.getServiceEndpoint] ServiceEndpoint not found: ${id}`);
        callback(null, {
          serviceEndpoint: undefined,
          error: 'ServiceEndpoint not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.getServiceEndpoint] ServiceEndpoint found: ${id}`);
      callback(null, {
        serviceEndpoint: {
          id: serviceEndpoint.id,
          serviceName: serviceEndpoint.serviceName,
          endpointName: serviceEndpoint.endpointName,
          permissionId: serviceEndpoint.permissionId,
          createdAt: serviceEndpoint.createdAt.toISOString(),
          updatedAt: serviceEndpoint.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.getServiceEndpoint] Error in getServiceEndpoint', error);
      callback(null, {
        serviceEndpoint: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listServiceEndpoints: async (
    call: grpc.ServerUnaryCall<ListServiceEndpointsRequest, ListServiceEndpointsResponse>,
    callback: grpc.sendUnaryData<ListServiceEndpointsResponse>
  ) => {
    logger.debug(`[authServiceImplementation.listServiceEndpoints] Request received for service: ${call.request.serviceName || 'all'}`);
    try {
      const { serviceName } = call.request;
      const serviceEndpoints = await ServiceEndpointService.listServiceEndpoints(serviceName);

      logger.info(`[authServiceImplementation.listServiceEndpoints] Retrieved ${serviceEndpoints.length} serviceEndpoints`);
      callback(null, {
        serviceEndpoints: serviceEndpoints.map((se) => ({
          id: se.id,
          serviceName: se.serviceName,
          endpointName: se.endpointName,
          permissionId: se.permissionId,
          createdAt: se.createdAt.toISOString(),
          updatedAt: se.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.listServiceEndpoints] Error in listServiceEndpoints', error);
      callback(null, {
        serviceEndpoints: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  updateServiceEndpoint: async (
    call: grpc.ServerUnaryCall<UpdateServiceEndpointRequest, UpdateServiceEndpointResponse>,
    callback: grpc.sendUnaryData<UpdateServiceEndpointResponse>
  ) => {
    logger.debug(`[authServiceImplementation.updateServiceEndpoint] Request received to update serviceEndpoint id: ${call.request.id}`);
    try {
      const input = UpdateServiceEndpointSchema.parse(call.request);
      logger.debug(`[authServiceImplementation.updateServiceEndpoint] Validated input for serviceEndpoint id: ${input.id}`);
      const serviceEndpoint = await ServiceEndpointService.updateServiceEndpoint(input);

      if (!serviceEndpoint) {
        logger.warn(`[authServiceImplementation.updateServiceEndpoint] ServiceEndpoint not found: ${input.id}`);
        callback(null, {
          serviceEndpoint: undefined,
          error: 'ServiceEndpoint not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.updateServiceEndpoint] ServiceEndpoint updated successfully: ${input.id}`);
      callback(null, {
        serviceEndpoint: {
          id: serviceEndpoint.id,
          serviceName: serviceEndpoint.serviceName,
          endpointName: serviceEndpoint.endpointName,
          permissionId: serviceEndpoint.permissionId,
          createdAt: serviceEndpoint.createdAt.toISOString(),
          updatedAt: serviceEndpoint.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.updateServiceEndpoint] Error in updateServiceEndpoint', error);
      callback(null, {
        serviceEndpoint: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  deleteServiceEndpoint: async (
    call: grpc.ServerUnaryCall<DeleteServiceEndpointRequest, DeleteServiceEndpointResponse>,
    callback: grpc.sendUnaryData<DeleteServiceEndpointResponse>
  ) => {
    logger.debug(`[authServiceImplementation.deleteServiceEndpoint] Request received to delete serviceEndpoint id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const success = await ServiceEndpointService.deleteServiceEndpoint(id);

      logger.info(`[authServiceImplementation.deleteServiceEndpoint] ServiceEndpoint ${id} deletion ${success ? 'successful' : 'failed'}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.deleteServiceEndpoint] Error in deleteServiceEndpoint', error);
      callback(null, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // ===== ApiKey operations =====
  createApiKey: async (
    call: grpc.ServerUnaryCall<CreateApiKeyRequest, CreateApiKeyResponse>,
    callback: grpc.sendUnaryData<CreateApiKeyResponse>
  ) => {
    logger.debug('[authServiceImplementation.createApiKey] Request received to create apiKey');
    try {
      const input = CreateApiKeySchema.parse(call.request);
      logger.debug(`[authServiceImplementation.createApiKey] Validated input for apiKey: service ${input.serviceId}`);
      const apiKey = await ApiKeyService.createApiKey(input);

      logger.info(`[authServiceImplementation.createApiKey] ApiKey created successfully with id: ${apiKey.id}`);
      callback(null, {
        apiKey: {
          id: apiKey.id,
          key: apiKey.key,
          serviceId: apiKey.serviceId,
          expiresAt: apiKey.expiresAt.toISOString(),
          createdAt: apiKey.createdAt.toISOString(),
          lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : '',
          isRevoked: apiKey.isRevoked,
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.createApiKey] Error in createApiKey', error);
      callback(null, {
        apiKey: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  getApiKey: async (
    call: grpc.ServerUnaryCall<GetApiKeyRequest, GetApiKeyResponse>,
    callback: grpc.sendUnaryData<GetApiKeyResponse>
  ) => {
    logger.debug(`[authServiceImplementation.getApiKey] Request received for apiKey id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const apiKey = await ApiKeyService.getApiKey(id);

      if (!apiKey) {
        logger.warn(`[authServiceImplementation.getApiKey] ApiKey not found: ${id}`);
        callback(null, {
          apiKey: undefined,
          error: 'ApiKey not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.getApiKey] ApiKey found: ${id}`);
      callback(null, {
        apiKey: {
          id: apiKey.id,
          key: apiKey.key,
          serviceId: apiKey.serviceId,
          expiresAt: apiKey.expiresAt.toISOString(),
          createdAt: apiKey.createdAt.toISOString(),
          lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : '',
          isRevoked: apiKey.isRevoked,
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.getApiKey] Error in getApiKey', error);
      callback(null, {
        apiKey: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  listApiKeys: async (
    call: grpc.ServerUnaryCall<ListApiKeysRequest, ListApiKeysResponse>,
    callback: grpc.sendUnaryData<ListApiKeysResponse>
  ) => {
    logger.debug(`[authServiceImplementation.listApiKeys] Request received for service: ${call.request.serviceId || 'all'}`);
    try {
      const { serviceId } = call.request;
      const apiKeys = await ApiKeyService.listApiKeys(serviceId);

      logger.info(`[authServiceImplementation.listApiKeys] Retrieved ${apiKeys.length} apiKeys`);
      callback(null, {
        apiKeys: apiKeys.map((apiKey) => ({
          id: apiKey.id,
          key: apiKey.key,
          serviceId: apiKey.serviceId,
          expiresAt: apiKey.expiresAt.toISOString(),
          createdAt: apiKey.createdAt.toISOString(),
          lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : '',
          isRevoked: apiKey.isRevoked,
        })),
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.listApiKeys] Error in listApiKeys', error);
      callback(null, {
        apiKeys: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  revokeApiKey: async (
    call: grpc.ServerUnaryCall<RevokeApiKeyRequest, RevokeApiKeyResponse>,
    callback: grpc.sendUnaryData<RevokeApiKeyResponse>
  ) => {
    logger.debug(`[authServiceImplementation.revokeApiKey] Request received to revoke apiKey id: ${call.request.id}`);
    try {
      const { id } = call.request;
      const success = await ApiKeyService.revokeApiKey(id);

      logger.info(`[authServiceImplementation.revokeApiKey] ApiKey ${id} revocation ${success ? 'successful' : 'failed'}`);
      callback(null, { success });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.revokeApiKey] Error in revokeApiKey', error);
      callback(null, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  resetApiKeyExpiry: async (
    call: grpc.ServerUnaryCall<ResetApiKeyExpiryRequest, ResetApiKeyExpiryResponse>,
    callback: grpc.sendUnaryData<ResetApiKeyExpiryResponse>
  ) => {
    logger.debug(`[authServiceImplementation.resetApiKeyExpiry] Request received to reset expiry for apiKey id: ${call.request.id}`);
    try {
      const input = ResetApiKeyExpirySchema.parse(call.request);
      logger.debug(`[authServiceImplementation.resetApiKeyExpiry] Validated input for apiKey id: ${input.id}`);
      const apiKey = await ApiKeyService.resetApiKeyExpiry(input);

      if (!apiKey) {
        logger.warn(`[authServiceImplementation.resetApiKeyExpiry] ApiKey not found: ${input.id}`);
        callback(null, {
          apiKey: undefined,
          error: 'ApiKey not found',
        });
        return;
      }

      logger.info(`[authServiceImplementation.resetApiKeyExpiry] ApiKey expiry reset successfully: ${input.id}`);
      callback(null, {
        apiKey: {
          id: apiKey.id,
          key: apiKey.key,
          serviceId: apiKey.serviceId,
          expiresAt: apiKey.expiresAt.toISOString(),
          createdAt: apiKey.createdAt.toISOString(),
          lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : '',
          isRevoked: apiKey.isRevoked,
        },
      });
    } catch (error) {
      logger.logWithErrorHandling('[authServiceImplementation.resetApiKeyExpiry] Error in resetApiKeyExpiry', error);
      callback(null, {
        apiKey: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
