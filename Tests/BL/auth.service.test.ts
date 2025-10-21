import {
  ServiceService,
  ServiceRoleService,
  RolePermissionService,
  ServiceEndpointService,
  ApiKeyService,
} from '../../src/BL/auth.service';
import {
  ServiceRepository,
  ServiceRoleRepository,
  RolePermissionRepository,
  ServiceEndpointRepository,
  ApiKeyRepository,
} from '../../src/DAL/auth.repository';

// Mock the repositories
jest.mock('../../src/DAL/auth.repository', () => ({
  ServiceRepository: {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    modify: jest.fn(),
  },
  ServiceRoleRepository: {
    findByCompositeKey: jest.fn(),
    findByServiceId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  RolePermissionRepository: {
    findByCompositeKey: jest.fn(),
    findByRoleId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  ServiceEndpointRepository: {
    findById: jest.fn(),
    findByServiceName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  ApiKeyRepository: {
    findById: jest.fn(),
    findByServiceId: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
    resetExpiry: jest.fn(),
  },
}));

describe('ServiceService', () => {
  describe('getService', () => {
    it('should return service when found', async () => {
      const mockService = {
        id: 'service_1',
        name: 'TestService',
        roleId: 'role_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceRepository.findById as jest.Mock).mockResolvedValue(mockService);

      const result = await ServiceService.getService('service_1');

      expect(result).toEqual(mockService);
      expect(ServiceRepository.findById).toHaveBeenCalledWith('service_1');
    });

    it('should return null when service not found', async () => {
      (ServiceRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await ServiceService.getService('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createService', () => {
    it('should create and return a new service', async () => {
      const input = {
        name: 'NewService',
        roleId: 'role_1',
      };

      const mockService = {
        id: 'service_2',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceRepository.create as jest.Mock).mockResolvedValue(mockService);

      const result = await ServiceService.createService(input);

      expect(result).toEqual(mockService);
      expect(ServiceRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('listServices', () => {
    it('should return paginated list of services', async () => {
      const mockResponse = {
        services: [
          {
            id: 'service_1',
            name: 'Service1',
            roleId: 'role_1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      };

      (ServiceRepository.findAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ServiceService.listServices(1, 10);

      expect(result).toEqual(mockResponse);
      expect(ServiceRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('modifyService', () => {
    it('should modify and return the service', async () => {
      const input = {
        id: 'service_1',
        name: 'UpdatedService',
        roleId: 'role_2',
      };

      const mockService = {
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceRepository.modify as jest.Mock).mockResolvedValue(mockService);

      const result = await ServiceService.modifyService(input);

      expect(result).toEqual(mockService);
      expect(ServiceRepository.modify).toHaveBeenCalledWith(input);
    });

    it('should return null when service not found', async () => {
      const input = {
        id: 'nonexistent',
        name: 'Test',
      };

      (ServiceRepository.modify as jest.Mock).mockResolvedValue(null);

      const result = await ServiceService.modifyService(input);

      expect(result).toBeNull();
    });
  });
});

describe('ServiceRoleService', () => {
  describe('getServiceRole', () => {
    it('should return serviceRole when found', async () => {
      const mockServiceRole = {
        serviceId: 'service_1',
        roleId: 'role_1',
      };

      (ServiceRoleRepository.findByCompositeKey as jest.Mock).mockResolvedValue(mockServiceRole);

      const result = await ServiceRoleService.getServiceRole('service_1', 'role_1');

      expect(result).toEqual(mockServiceRole);
      expect(ServiceRoleRepository.findByCompositeKey).toHaveBeenCalledWith('service_1', 'role_1');
    });
  });

  describe('createServiceRole', () => {
    it('should create and return a new serviceRole', async () => {
      const input = {
        serviceId: 'service_1',
        roleId: 'role_1',
      };

      (ServiceRoleRepository.create as jest.Mock).mockResolvedValue(input);

      const result = await ServiceRoleService.createServiceRole(input);

      expect(result).toEqual(input);
      expect(ServiceRoleRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('listServiceRoles', () => {
    it('should return list of serviceRoles for a service', async () => {
      const mockServiceRoles = [
        { serviceId: 'service_1', roleId: 'role_1' },
        { serviceId: 'service_1', roleId: 'role_2' },
      ];

      (ServiceRoleRepository.findByServiceId as jest.Mock).mockResolvedValue(mockServiceRoles);

      const result = await ServiceRoleService.listServiceRoles('service_1');

      expect(result).toEqual(mockServiceRoles);
      expect(ServiceRoleRepository.findByServiceId).toHaveBeenCalledWith('service_1');
    });
  });

  describe('deleteServiceRole', () => {
    it('should delete serviceRole and return true', async () => {
      (ServiceRoleRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await ServiceRoleService.deleteServiceRole('service_1', 'role_1');

      expect(result).toBe(true);
      expect(ServiceRoleRepository.delete).toHaveBeenCalledWith('service_1', 'role_1');
    });
  });
});

describe('RolePermissionService', () => {
  describe('getRolePermission', () => {
    it('should return rolePermission when found', async () => {
      const mockRolePermission = {
        roleId: 'role_1',
        permissionId: 'perm_1',
      };

      (RolePermissionRepository.findByCompositeKey as jest.Mock).mockResolvedValue(mockRolePermission);

      const result = await RolePermissionService.getRolePermission('role_1', 'perm_1');

      expect(result).toEqual(mockRolePermission);
      expect(RolePermissionRepository.findByCompositeKey).toHaveBeenCalledWith('role_1', 'perm_1');
    });
  });

  describe('createRolePermission', () => {
    it('should create and return a new rolePermission', async () => {
      const input = {
        roleId: 'role_1',
        permissionId: 'perm_1',
      };

      (RolePermissionRepository.create as jest.Mock).mockResolvedValue(input);

      const result = await RolePermissionService.createRolePermission(input);

      expect(result).toEqual(input);
      expect(RolePermissionRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('listRolePermissions', () => {
    it('should return list of rolePermissions for a role', async () => {
      const mockRolePermissions = [
        { roleId: 'role_1', permissionId: 'perm_1' },
        { roleId: 'role_1', permissionId: 'perm_2' },
      ];

      (RolePermissionRepository.findByRoleId as jest.Mock).mockResolvedValue(mockRolePermissions);

      const result = await RolePermissionService.listRolePermissions('role_1');

      expect(result).toEqual(mockRolePermissions);
      expect(RolePermissionRepository.findByRoleId).toHaveBeenCalledWith('role_1');
    });
  });

  describe('deleteRolePermission', () => {
    it('should delete rolePermission and return true', async () => {
      (RolePermissionRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await RolePermissionService.deleteRolePermission('role_1', 'perm_1');

      expect(result).toBe(true);
      expect(RolePermissionRepository.delete).toHaveBeenCalledWith('role_1', 'perm_1');
    });
  });
});

describe('ServiceEndpointService', () => {
  describe('getServiceEndpoint', () => {
    it('should return serviceEndpoint when found', async () => {
      const mockServiceEndpoint = {
        id: 'endpoint_1',
        serviceName: 'TestService',
        endpointName: 'GetData',
        permissionId: 'perm_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceEndpointRepository.findById as jest.Mock).mockResolvedValue(mockServiceEndpoint);

      const result = await ServiceEndpointService.getServiceEndpoint('endpoint_1');

      expect(result).toEqual(mockServiceEndpoint);
      expect(ServiceEndpointRepository.findById).toHaveBeenCalledWith('endpoint_1');
    });
  });

  describe('createServiceEndpoint', () => {
    it('should create and return a new serviceEndpoint', async () => {
      const input = {
        serviceName: 'TestService',
        endpointName: 'GetData',
        permissionId: 'perm_1',
      };

      const mockServiceEndpoint = {
        id: 'endpoint_1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceEndpointRepository.create as jest.Mock).mockResolvedValue(mockServiceEndpoint);

      const result = await ServiceEndpointService.createServiceEndpoint(input);

      expect(result).toEqual(mockServiceEndpoint);
      expect(ServiceEndpointRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('listServiceEndpoints', () => {
    it('should return list of serviceEndpoints for a service', async () => {
      const mockServiceEndpoints = [
        {
          id: 'endpoint_1',
          serviceName: 'TestService',
          endpointName: 'GetData',
          permissionId: 'perm_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (ServiceEndpointRepository.findByServiceName as jest.Mock).mockResolvedValue(mockServiceEndpoints);

      const result = await ServiceEndpointService.listServiceEndpoints('TestService');

      expect(result).toEqual(mockServiceEndpoints);
      expect(ServiceEndpointRepository.findByServiceName).toHaveBeenCalledWith('TestService');
    });
  });

  describe('updateServiceEndpoint', () => {
    it('should update and return the serviceEndpoint', async () => {
      const input = {
        id: 'endpoint_1',
        endpointName: 'UpdatedEndpoint',
      };

      const mockServiceEndpoint = {
        id: 'endpoint_1',
        serviceName: 'TestService',
        endpointName: 'UpdatedEndpoint',
        permissionId: 'perm_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (ServiceEndpointRepository.update as jest.Mock).mockResolvedValue(mockServiceEndpoint);

      const result = await ServiceEndpointService.updateServiceEndpoint(input);

      expect(result).toEqual(mockServiceEndpoint);
      expect(ServiceEndpointRepository.update).toHaveBeenCalledWith(input);
    });
  });

  describe('deleteServiceEndpoint', () => {
    it('should delete serviceEndpoint and return true', async () => {
      (ServiceEndpointRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await ServiceEndpointService.deleteServiceEndpoint('endpoint_1');

      expect(result).toBe(true);
      expect(ServiceEndpointRepository.delete).toHaveBeenCalledWith('endpoint_1');
    });
  });
});

describe('ApiKeyService', () => {
  describe('getApiKey', () => {
    it('should return apiKey when found', async () => {
      const mockApiKey = {
        id: 'apikey_1',
        key: 'key_123',
        serviceId: 'service_1',
        expiresAt: new Date(),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
      };

      (ApiKeyRepository.findById as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await ApiKeyService.getApiKey('apikey_1');

      expect(result).toEqual(mockApiKey);
      expect(ApiKeyRepository.findById).toHaveBeenCalledWith('apikey_1');
    });
  });

  describe('createApiKey', () => {
    it('should create and return a new apiKey', async () => {
      const input = {
        serviceId: 'service_1',
        expiresAt: '2025-12-31T00:00:00Z',
      };

      const mockApiKey = {
        id: 'apikey_1',
        key: 'key_123',
        serviceId: 'service_1',
        expiresAt: new Date(input.expiresAt),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
      };

      (ApiKeyRepository.create as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await ApiKeyService.createApiKey(input);

      expect(result).toEqual(mockApiKey);
      expect(ApiKeyRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('listApiKeys', () => {
    it('should return list of apiKeys for a service', async () => {
      const mockApiKeys = [
        {
          id: 'apikey_1',
          key: 'key_123',
          serviceId: 'service_1',
          expiresAt: new Date(),
          createdAt: new Date(),
          lastUsedAt: null,
          isRevoked: false,
        },
      ];

      (ApiKeyRepository.findByServiceId as jest.Mock).mockResolvedValue(mockApiKeys);

      const result = await ApiKeyService.listApiKeys('service_1');

      expect(result).toEqual(mockApiKeys);
      expect(ApiKeyRepository.findByServiceId).toHaveBeenCalledWith('service_1');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke apiKey and return true', async () => {
      (ApiKeyRepository.revoke as jest.Mock).mockResolvedValue(true);

      const result = await ApiKeyService.revokeApiKey('apikey_1');

      expect(result).toBe(true);
      expect(ApiKeyRepository.revoke).toHaveBeenCalledWith('apikey_1');
    });
  });

  describe('resetApiKeyExpiry', () => {
    it('should reset apiKey expiry and return updated apiKey', async () => {
      const input = {
        id: 'apikey_1',
        expiresAt: '2026-12-31T00:00:00Z',
      };

      const mockApiKey = {
        id: 'apikey_1',
        key: 'key_123',
        serviceId: 'service_1',
        expiresAt: new Date(input.expiresAt),
        createdAt: new Date(),
        lastUsedAt: null,
        isRevoked: false,
      };

      (ApiKeyRepository.resetExpiry as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await ApiKeyService.resetApiKeyExpiry(input);

      expect(result).toEqual(mockApiKey);
      expect(ApiKeyRepository.resetExpiry).toHaveBeenCalledWith(input);
    });
  });
});
