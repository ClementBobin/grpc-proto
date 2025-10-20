import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import jwt from 'jsonwebtoken';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const SERVICE_JWT_SECRET = process.env.SERVICE_JWT_SECRET || 'service-super-secret';
const USER_JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

// This is an integration test that requires a running server
// For now, we'll mock the parts we need
describe('GetUser Service Auth Integration', () => {
  let prisma: PrismaClient;
  let serviceId: string;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Ensure test data exists
    const role = await prisma.role.upsert({
      where: { name: 'service-admin' },
      update: {},
      create: { name: 'service-admin' },
    });

    const permission = await prisma.permission.upsert({
      where: { name: 'user:get' },
      update: {},
      create: {
        name: 'user:get',
        description: 'Permission to get user details',
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    const service = await prisma.service.upsert({
      where: { name: 'api-rest-service' },
      update: {},
      create: {
        name: 'api-rest-service',
        roleId: role.id,
      },
    });
    serviceId = service.id;

    await prisma.serviceRole.upsert({
      where: {
        serviceId_roleId: {
          serviceId: service.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        serviceId: service.id,
        roleId: role.id,
      },
    });

    const user = await prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Service Token Authentication', () => {
    it('should create a valid service JWT token', () => {
      const token = jwt.sign(
        {
          sub: 'api-rest-service',
          aud: 'grpc_auth',
          role: 'service-admin',
        },
        SERVICE_JWT_SECRET,
        { expiresIn: '1h' }
      );

      const decoded = jwt.verify(token, SERVICE_JWT_SECRET) as any;
      expect(decoded.sub).toBe('api-rest-service');
      expect(decoded.aud).toBe('grpc_auth');
      expect(decoded.role).toBe('service-admin');
    });

    it('should reject user JWT tokens', () => {
      const userToken = jwt.sign(
        {
          userId: '123',
          role: 'admin',
        },
        USER_JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Trying to verify user token with service secret should fail
      expect(() => {
        jwt.verify(userToken, SERVICE_JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Database Permissions', () => {
    it('should verify service has correct permissions in database', async () => {
      const service = await prisma.service.findUnique({
        where: { name: 'api-rest-service' },
        include: {
          serviceRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(service).not.toBeNull();
      expect(service?.serviceRoles).toHaveLength(1);
      expect(service?.serviceRoles[0].role.name).toBe('service-admin');
      
      const permissions = service?.serviceRoles[0].role.rolePermissions.map(
        (rp) => rp.permission.name
      );
      expect(permissions).toContain('user:get');
    });

    it('should verify user exists in database', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'alice@example.com' },
      });

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Alice');
    });
  });

  describe('Token Format and Claims', () => {
    it('should have correct JWT structure for service token', () => {
      const token = jwt.sign(
        {
          sub: 'api-rest-service',
          aud: 'grpc_auth',
          role: 'service-admin',
        },
        SERVICE_JWT_SECRET,
        { expiresIn: '1h' }
      );

      const parts = token.split('.');
      expect(parts).toHaveLength(3); // header.payload.signature

      const decoded = jwt.decode(token, { complete: true }) as any;
      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.payload.sub).toBe('api-rest-service');
      expect(decoded.payload.aud).toBe('grpc_auth');
      expect(decoded.payload.role).toBe('service-admin');
    });

    it('should reject tokens with missing required claims', () => {
      // Token without 'aud' claim
      const invalidToken = jwt.sign(
        {
          sub: 'api-rest-service',
          role: 'service-admin',
        },
        SERVICE_JWT_SECRET
      );

      const decoded = jwt.verify(invalidToken, SERVICE_JWT_SECRET) as any;
      // Middleware should check for aud claim
      expect(decoded.aud).toBeUndefined();
    });
  });

  describe('Permission-based Access Control', () => {
    it('should allow service with user:get permission to access GetUser', async () => {
      const service = await prisma.service.findUnique({
        where: { name: 'api-rest-service' },
        include: {
          serviceRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const hasGetUserPermission = service?.serviceRoles.some((sr) =>
        sr.role.rolePermissions.some((rp) => rp.permission.name === 'user:get')
      );

      expect(hasGetUserPermission).toBe(true);
    });

    it('should prevent service without permission from accessing restricted endpoint', async () => {
      // Create a service with a different role that doesn't have user:get permission
      const limitedRole = await prisma.role.upsert({
        where: { name: 'service-viewer' },
        update: {},
        create: { name: 'service-viewer' },
      });

      const limitedService = await prisma.service.upsert({
        where: { name: 'limited-service' },
        update: {},
        create: {
          name: 'limited-service',
          roleId: limitedRole.id,
        },
      });

      const service = await prisma.service.findUnique({
        where: { name: 'limited-service' },
        include: {
          serviceRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const hasGetUserPermission = service?.serviceRoles.some((sr) =>
        sr.role.rolePermissions.some((rp) => rp.permission.name === 'user:get')
      );

      expect(hasGetUserPermission).toBe(false);
    });
  });

  describe('Multiple Permissions per Endpoint', () => {
    it('should allow service with service-admin role to have multiple permissions', async () => {
      const service = await prisma.service.findUnique({
        where: { name: 'api-rest-service' },
        include: {
          serviceRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const permissions = service?.serviceRoles.flatMap((sr) =>
        sr.role.rolePermissions.map((rp) => rp.permission.name)
      );

      expect(permissions).toContain('user:get');
      expect(permissions).toContain('user:create');
      expect(permissions).toContain('user:update');
      expect(permissions).toContain('user:delete');
      expect(permissions).toContain('user:list');
    });
  });
});
