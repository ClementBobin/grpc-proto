import * as grpc from '@grpc/grpc-js';
import prisma from '@/DAL/prismaClient';
import { loadServerConfig } from '../config';
import { generateApiKey } from '../encrypt';

const config = loadServerConfig();

/**
 * API Key payload interface
 */
export interface ApiKeyPayload {
  serviceId: string;
  serviceName: string;
}

/**
 * Service info attached to gRPC call
 */
export interface ServiceInfo {
  serviceId: string;
  serviceName: string;
  role: string;
  permissions: string[];
}

/**
 * Create API key for a service
 */
export async function createApiKey(serviceName: string, expirationDays?: number): Promise<{ key: string; expiresAt: Date }> {
  const service = await prisma.service.findUnique({
    where: { name: serviceName },
  });

  if (!service) {
    throw new Error(`Service not found: ${serviceName}`);
  }

  const key = generateApiKey();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expirationDays || config.apiKeyExpirationDays));

  await prisma.apiKey.create({
    data: {
      key,
      serviceId: service.id,
      expiresAt,
    },
  });

  return { key, expiresAt };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(key: string): Promise<void> {
  await prisma.apiKey.update({
    where: { key },
    data: { isRevoked: true },
  });
}

/**
 * Verify API key and extract service info
 */
async function verifyApiKey(key: string): Promise<ApiKeyPayload> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: {
      service: true,
    },
  });

  if (!apiKey) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'Invalid API key' };
  }

  if (apiKey.isRevoked) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'API key has been revoked' };
  }

  if (apiKey.expiresAt < new Date()) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'API key has expired' };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { key },
    data: { lastUsedAt: new Date() },
  });

  return {
    serviceId: apiKey.service.id,
    serviceName: apiKey.service.name,
  };
}

/**
 * Verify service token (API key only)
 */
async function verifyServiceToken(token: string): Promise<{ serviceName: string }> {
  const payload = await verifyApiKey(token);
  return { serviceName: payload.serviceName };
}



/**
 * Check if service has specific permission for an endpoint
 */
async function checkServicePermission(
  serviceId: string,
  permissionName: string
): Promise<boolean> {
  const service = await prisma.service.findUnique({
    where: { name: serviceId },
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

  if (!service) {
    return false;
  }

  // Check if any of the service's roles has the required permission
  for (const serviceRole of service.serviceRoles) {
    const hasPermission = serviceRole.role.rolePermissions.some(
      (rp) => rp.permission.name === permissionName
    );
    if (hasPermission) {
      return true;
    }
  }

  return false;
}



/**
 * Middleware to require service authentication with permission check
 */
export function requireServiceAuthWithPermission<T, U>(
  handler: (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => void | Promise<void>,
  permissionName: string
) {
  return async (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => {
    try {
      const meta = call.metadata.get('service-authorization');
      if (!meta || meta.length === 0) {
        throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing API key' };
      }

      const token = (meta[0] as string).replace(/^Bearer\s+/i, '');
      const { serviceName } = await verifyServiceToken(token);
      
      // Check permission
      const hasPermission = await checkServicePermission(serviceName, permissionName);
      if (!hasPermission) {
        throw { 
          code: grpc.status.PERMISSION_DENIED, 
          message: `Service does not have permission: ${permissionName}` 
        };
      }

      // Attach service name to call for logging/debugging
      (call as any).serviceName = serviceName;

      await handler(call, callback);
    } catch (err: any) {
      callback(err, null as any);
    }
  };
}



/**
 * Fetch endpoint permissions from database for a service
 */
async function getServiceEndpointPermissions(serviceName: string): Promise<{ [endpoint: string]: string }> {
  const endpoints = await prisma.serviceEndpoint.findMany({
    where: { serviceName },
    include: {
      permission: true,
    },
  });

  const permissions: { [endpoint: string]: string } = {};
  for (const endpoint of endpoints) {
    permissions[endpoint.endpointName] = endpoint.permission.name;
  }

  return permissions;
}

/**
 * Apply API key authentication middleware to service based on database configuration
 * Automatically fetches endpoint permissions from database and applies them
 * 
 * @param serviceImplementation - The gRPC service implementation
 * @param serviceName - The service name (e.g., 'UserService', 'InfraService')
 * @returns Service implementation wrapped with authentication middleware
 */
export async function applyServiceAuthMiddleware<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  serviceName: string
): Promise<T> {
  // Fetch endpoint permissions from database
  const endpointPermissions = await getServiceEndpointPermissions(serviceName);
  
  const wrapped: any = {};

  for (const methodName of Object.keys(serviceImplementation)) {
    const originalHandler = (serviceImplementation as any)[methodName];
    const permission = endpointPermissions[methodName];

    if (permission) {
      // Auth with permission check enabled for this endpoint
      wrapped[methodName] = requireServiceAuthWithPermission(originalHandler, permission);
    } else {
      // No specific permission required, use original handler
      wrapped[methodName] = originalHandler;
    }
  }

  return wrapped as T;
}
