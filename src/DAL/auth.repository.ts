import prisma from '@/DAL/prismaClient';
import logger from '@/lib/modules/logger.module';
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
import { v4 as uuidv4 } from 'uuid';

// ===== Service Repository =====
export const ServiceRepository = {
  findById: async (id: string): Promise<Service | null> => {
    logger.debug(`[ServiceRepository.findById] Finding service by id: ${id}`);
    try {
      const service = await prisma.service.findUnique({ where: { id } });
      logger.debug(`[ServiceRepository.findById] Service ${id} ${service ? 'found' : 'not found'}`);
      return service;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRepository.findById] Error finding service by id', error);
      throw error;
    }
  },

  findAll: async (page: number = 1, pageSize: number = 10): Promise<{ services: Service[]; total: number }> => {
    logger.debug(`[ServiceRepository.findAll] Finding services - page: ${page}, pageSize: ${pageSize}`);
    try {
      const [services, total] = await prisma.$transaction([
        prisma.service.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.service.count(),
      ]);

      logger.debug(`[ServiceRepository.findAll] Found ${services.length} services out of ${total} total`);
      return {
        services,
        total,
      };
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRepository.findAll] Error finding services', error);
      throw error;
    }
  },

  create: async (input: CreateServiceInput): Promise<Service> => {
    logger.debug(`[ServiceRepository.create] Creating service with name: ${input.name}`);
    try {
      const data: any = {
        name: input.name,
      };
      if (input.roleId) {
        data.roleId = input.roleId;
      }

      const service = await prisma.service.create({ data });
      logger.info(`[ServiceRepository.create] Service created successfully with id: ${service.id}`);
      return service;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRepository.create] Error creating service', error);
      throw error;
    }
  },

  modify: async (input: ModifyServiceInput): Promise<Service | null> => {
    logger.debug(`[ServiceRepository.modify] Modifying service with id: ${input.id}`);
    try {
      const existingService = await prisma.service.findUnique({ where: { id: input.id } });
      if (!existingService) {
        logger.debug(`[ServiceRepository.modify] Service not found with id: ${input.id}`);
        return null;
      }

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.roleId !== undefined) data.roleId = input.roleId;

      const updatedService = await prisma.service.update({ where: { id: input.id }, data });
      logger.info(`[ServiceRepository.modify] Service modified successfully with id: ${input.id}`);
      return updatedService;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRepository.modify] Error modifying service', error);
      throw error;
    }
  },
};

// ===== ServiceRole Repository =====
export const ServiceRoleRepository = {
  findByCompositeKey: async (serviceId: string, roleId: string): Promise<ServiceRole | null> => {
    logger.debug(`[ServiceRoleRepository.findByCompositeKey] Finding serviceRole: ${serviceId}, ${roleId}`);
    try {
      const serviceRole = await prisma.serviceRole.findUnique({
        where: {
          serviceId_roleId: { serviceId, roleId },
        },
      });
      logger.debug(`[ServiceRoleRepository.findByCompositeKey] ServiceRole ${serviceRole ? 'found' : 'not found'}`);
      return serviceRole;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleRepository.findByCompositeKey] Error finding serviceRole', error);
      throw error;
    }
  },

  findByServiceId: async (serviceId: string): Promise<ServiceRole[]> => {
    logger.debug(`[ServiceRoleRepository.findByServiceId] Finding serviceRoles for service: ${serviceId}`);
    try {
      const serviceRoles = await prisma.serviceRole.findMany({
        where: { serviceId },
      });
      logger.debug(`[ServiceRoleRepository.findByServiceId] Found ${serviceRoles.length} serviceRoles`);
      return serviceRoles;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleRepository.findByServiceId] Error finding serviceRoles', error);
      throw error;
    }
  },

  create: async (input: CreateServiceRoleInput): Promise<ServiceRole> => {
    logger.debug(`[ServiceRoleRepository.create] Creating serviceRole: ${input.serviceId}, ${input.roleId}`);
    try {
      const serviceRole = await prisma.serviceRole.create({
        data: {
          serviceId: input.serviceId,
          roleId: input.roleId,
        },
      });
      logger.info(`[ServiceRoleRepository.create] ServiceRole created successfully`);
      return serviceRole;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleRepository.create] Error creating serviceRole', error);
      throw error;
    }
  },

  delete: async (serviceId: string, roleId: string): Promise<boolean> => {
    logger.debug(`[ServiceRoleRepository.delete] Deleting serviceRole: ${serviceId}, ${roleId}`);
    try {
      await prisma.serviceRole.delete({
        where: {
          serviceId_roleId: { serviceId, roleId },
        },
      });
      logger.info(`[ServiceRoleRepository.delete] ServiceRole deleted successfully`);
      return true;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceRoleRepository.delete] Error deleting serviceRole', error);
      throw error;
    }
  },
};

// ===== RolePermission Repository =====
export const RolePermissionRepository = {
  findByCompositeKey: async (roleId: string, permissionId: string): Promise<RolePermission | null> => {
    logger.debug(`[RolePermissionRepository.findByCompositeKey] Finding rolePermission: ${roleId}, ${permissionId}`);
    try {
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
      });
      logger.debug(`[RolePermissionRepository.findByCompositeKey] RolePermission ${rolePermission ? 'found' : 'not found'}`);
      return rolePermission;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionRepository.findByCompositeKey] Error finding rolePermission', error);
      throw error;
    }
  },

  findByRoleId: async (roleId: string): Promise<RolePermission[]> => {
    logger.debug(`[RolePermissionRepository.findByRoleId] Finding rolePermissions for role: ${roleId}`);
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
      });
      logger.debug(`[RolePermissionRepository.findByRoleId] Found ${rolePermissions.length} rolePermissions`);
      return rolePermissions;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionRepository.findByRoleId] Error finding rolePermissions', error);
      throw error;
    }
  },

  create: async (input: CreateRolePermissionInput): Promise<RolePermission> => {
    logger.debug(`[RolePermissionRepository.create] Creating rolePermission: ${input.roleId}, ${input.permissionId}`);
    try {
      const rolePermission = await prisma.rolePermission.create({
        data: {
          roleId: input.roleId,
          permissionId: input.permissionId,
        },
      });
      logger.info(`[RolePermissionRepository.create] RolePermission created successfully`);
      return rolePermission;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionRepository.create] Error creating rolePermission', error);
      throw error;
    }
  },

  delete: async (roleId: string, permissionId: string): Promise<boolean> => {
    logger.debug(`[RolePermissionRepository.delete] Deleting rolePermission: ${roleId}, ${permissionId}`);
    try {
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
      });
      logger.info(`[RolePermissionRepository.delete] RolePermission deleted successfully`);
      return true;
    } catch (error) {
      logger.logWithErrorHandling('[RolePermissionRepository.delete] Error deleting rolePermission', error);
      throw error;
    }
  },
};

// ===== ServiceEndpoint Repository =====
export const ServiceEndpointRepository = {
  findById: async (id: string): Promise<ServiceEndpoint | null> => {
    logger.debug(`[ServiceEndpointRepository.findById] Finding serviceEndpoint by id: ${id}`);
    try {
      const serviceEndpoint = await prisma.serviceEndpoint.findUnique({ where: { id } });
      logger.debug(`[ServiceEndpointRepository.findById] ServiceEndpoint ${id} ${serviceEndpoint ? 'found' : 'not found'}`);
      return serviceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointRepository.findById] Error finding serviceEndpoint by id', error);
      throw error;
    }
  },

  findByServiceName: async (serviceName: string): Promise<ServiceEndpoint[]> => {
    logger.debug(`[ServiceEndpointRepository.findByServiceName] Finding serviceEndpoints for service: ${serviceName}`);
    try {
      const serviceEndpoints = await prisma.serviceEndpoint.findMany({
        where: { serviceName },
      });
      logger.debug(`[ServiceEndpointRepository.findByServiceName] Found ${serviceEndpoints.length} serviceEndpoints`);
      return serviceEndpoints;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointRepository.findByServiceName] Error finding serviceEndpoints', error);
      throw error;
    }
  },

  create: async (input: CreateServiceEndpointInput): Promise<ServiceEndpoint> => {
    logger.debug(`[ServiceEndpointRepository.create] Creating serviceEndpoint: ${input.serviceName}/${input.endpointName}`);
    try {
      const serviceEndpoint = await prisma.serviceEndpoint.create({
        data: {
          serviceName: input.serviceName,
          endpointName: input.endpointName,
          permissionId: input.permissionId,
        },
      });
      logger.info(`[ServiceEndpointRepository.create] ServiceEndpoint created successfully with id: ${serviceEndpoint.id}`);
      return serviceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointRepository.create] Error creating serviceEndpoint', error);
      throw error;
    }
  },

  update: async (input: UpdateServiceEndpointInput): Promise<ServiceEndpoint | null> => {
    logger.debug(`[ServiceEndpointRepository.update] Updating serviceEndpoint with id: ${input.id}`);
    try {
      const existingServiceEndpoint = await prisma.serviceEndpoint.findUnique({ where: { id: input.id } });
      if (!existingServiceEndpoint) {
        logger.debug(`[ServiceEndpointRepository.update] ServiceEndpoint not found with id: ${input.id}`);
        return null;
      }

      const data: Record<string, unknown> = {};
      if (input.serviceName !== undefined) data.serviceName = input.serviceName;
      if (input.endpointName !== undefined) data.endpointName = input.endpointName;
      if (input.permissionId !== undefined) data.permissionId = input.permissionId;

      const updatedServiceEndpoint = await prisma.serviceEndpoint.update({ where: { id: input.id }, data });
      logger.info(`[ServiceEndpointRepository.update] ServiceEndpoint updated successfully with id: ${input.id}`);
      return updatedServiceEndpoint;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointRepository.update] Error updating serviceEndpoint', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    logger.debug(`[ServiceEndpointRepository.delete] Deleting serviceEndpoint with id: ${id}`);
    try {
      await prisma.serviceEndpoint.delete({ where: { id } });
      logger.info(`[ServiceEndpointRepository.delete] ServiceEndpoint deleted successfully with id: ${id}`);
      return true;
    } catch (error) {
      logger.logWithErrorHandling('[ServiceEndpointRepository.delete] Error deleting serviceEndpoint', error);
      throw error;
    }
  },
};

// ===== ApiKey Repository =====
export const ApiKeyRepository = {
  findById: async (id: string): Promise<ApiKey | null> => {
    logger.debug(`[ApiKeyRepository.findById] Finding apiKey by id: ${id}`);
    try {
      const apiKey = await prisma.apiKey.findUnique({ where: { id } });
      logger.debug(`[ApiKeyRepository.findById] ApiKey ${id} ${apiKey ? 'found' : 'not found'}`);
      return apiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyRepository.findById] Error finding apiKey by id', error);
      throw error;
    }
  },

  findByServiceId: async (serviceId: string): Promise<ApiKey[]> => {
    logger.debug(`[ApiKeyRepository.findByServiceId] Finding apiKeys for service: ${serviceId}`);
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { serviceId },
      });
      logger.debug(`[ApiKeyRepository.findByServiceId] Found ${apiKeys.length} apiKeys`);
      return apiKeys;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyRepository.findByServiceId] Error finding apiKeys', error);
      throw error;
    }
  },

  create: async (input: CreateApiKeyInput): Promise<ApiKey> => {
    logger.debug(`[ApiKeyRepository.create] Creating apiKey for service: ${input.serviceId}`);
    try {
      const key = uuidv4(); // Generate a unique API key
      const apiKey = await prisma.apiKey.create({
        data: {
          key,
          serviceId: input.serviceId,
          expiresAt: new Date(input.expiresAt),
        },
      });
      logger.info(`[ApiKeyRepository.create] ApiKey created successfully with id: ${apiKey.id}`);
      return apiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyRepository.create] Error creating apiKey', error);
      throw error;
    }
  },

  revoke: async (id: string): Promise<boolean> => {
    logger.debug(`[ApiKeyRepository.revoke] Revoking apiKey with id: ${id}`);
    try {
      await prisma.apiKey.update({
        where: { id },
        data: { isRevoked: true },
      });
      logger.info(`[ApiKeyRepository.revoke] ApiKey revoked successfully with id: ${id}`);
      return true;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyRepository.revoke] Error revoking apiKey', error);
      throw error;
    }
  },

  resetExpiry: async (input: ResetApiKeyExpiryInput): Promise<ApiKey | null> => {
    logger.debug(`[ApiKeyRepository.resetExpiry] Resetting expiry for apiKey with id: ${input.id}`);
    try {
      const existingApiKey = await prisma.apiKey.findUnique({ where: { id: input.id } });
      if (!existingApiKey) {
        logger.debug(`[ApiKeyRepository.resetExpiry] ApiKey not found with id: ${input.id}`);
        return null;
      }

      const updatedApiKey = await prisma.apiKey.update({
        where: { id: input.id },
        data: { expiresAt: new Date(input.expiresAt) },
      });
      logger.info(`[ApiKeyRepository.resetExpiry] ApiKey expiry reset successfully with id: ${input.id}`);
      return updatedApiKey;
    } catch (error) {
      logger.logWithErrorHandling('[ApiKeyRepository.resetExpiry] Error resetting apiKey expiry', error);
      throw error;
    }
  },
};
