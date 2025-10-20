import * as grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { loadServerConfig } from '../config';
import crypto from 'crypto';

const config = loadServerConfig();
const SERVICE_JWT_SECRET = config.serviceJwtSecret;
const prisma = new PrismaClient();

/**
 * Service JWT payload interface
 */
export interface ServiceJwtPayload {
  sub: string; // service ID
  aud: string; // audience (should be 'grpc_auth')
  role: string; // service role (e.g., 'service-admin')
  iat?: number;
  exp?: number;
}

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
 * Generate a secure API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
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
 * Verify service token (supports both JWT and API key)
 */
async function verifyServiceToken(token: string): Promise<{ serviceName: string; isApiKey: boolean }> {
  // Check if it's an API key (64 hex characters) or JWT
  const apiKeyPattern = /^[a-f0-9]{64}$/i;
  
  if (apiKeyPattern.test(token)) {
    // It's an API key
    const payload = await verifyApiKey(token);
    return { serviceName: payload.serviceName, isApiKey: true };
  } else {
    // It's a JWT token
    try {
      const payload = jwt.verify(token, SERVICE_JWT_SECRET) as ServiceJwtPayload;
      
      // Verify audience
      if (payload.aud !== 'grpc_auth') {
        throw new Error('Invalid audience');
      }
      
      return { serviceName: payload.sub, isApiKey: false };
    } catch (err) {
      throw { code: grpc.status.UNAUTHENTICATED, message: 'Invalid service token' };
    }
  }
}

/**
 * Check if service has required role
 */
async function checkServiceRole(serviceId: string, requiredRole?: string): Promise<ServiceInfo> {
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
    throw { code: grpc.status.PERMISSION_DENIED, message: 'Service not found' };
  }

  // Extract all roles for this service
  const serviceRoles = service.serviceRoles.map((sr) => sr.role);
  
  // Check if service has the required role
  if (requiredRole) {
    const hasRole = serviceRoles.some((role) => role.name === requiredRole);
    if (!hasRole) {
      throw { code: grpc.status.PERMISSION_DENIED, message: 'Insufficient service role' };
    }
  }

  // Extract all permissions from all roles
  const permissions = serviceRoles.flatMap((role) =>
    role.rolePermissions.map((rp) => rp.permission.name)
  );

  // Get the primary role (first one or the one matching requiredRole)
  const primaryRole = requiredRole
    ? serviceRoles.find((r) => r.name === requiredRole)?.name || serviceRoles[0]?.name || ''
    : serviceRoles[0]?.name || '';

  return {
    serviceId: service.id,
    serviceName: service.name,
    role: primaryRole,
    permissions: [...new Set(permissions)], // Remove duplicates
  };
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
 * Middleware to require service authentication
 */
export function requireServiceAuth<T, U>(
  handler: (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => void | Promise<void>,
  requiredRole?: string
) {
  return async (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => {
    try {
      const meta = call.metadata.get('service-authorization');
      if (!meta || meta.length === 0) {
        throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing service token' };
      }

      const token = (meta[0] as string).replace(/^Bearer\s+/i, '');
      const { serviceName } = await verifyServiceToken(token);
      
      // Check role and get service info
      const serviceInfo = await checkServiceRole(serviceName, requiredRole);
      
      // Attach service info to call
      (call as any).service = serviceInfo;

      await handler(call, callback);
    } catch (err: any) {
      callback(err, null as any);
    }
  };
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
        throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing service token' };
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

      // Get service info
      const serviceInfo = await checkServiceRole(serviceName);
      
      // Attach service info to call
      (call as any).service = serviceInfo;

      await handler(call, callback);
    } catch (err: any) {
      callback(err, null as any);
    }
  };
}

/**
 * Wrap entire service implementation with service auth
 */
export function requireServiceAuthGlobal<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  requiredRole?: string
): T {
  const wrapped: any = {};

  for (const methodName of Object.keys(serviceImplementation)) {
    const originalHandler = (serviceImplementation as any)[methodName];
    wrapped[methodName] = requireServiceAuth(originalHandler, requiredRole);
  }

  return wrapped as T;
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
 * Wrap service implementation with endpoint-level permission checks
 */
export function requireServiceAuthEndpoint<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  endpointPermissions: { [endpoint: string]: string }
): T {
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

/**
 * Apply service auth middleware based on configuration
 * If serviceName is provided and no endpointPermissions are given,
 * permissions will be fetched from the database
 */
export async function applyServiceAuthMiddleware<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  options?: {
    level?: 'global' | 'endpoint';
    requiredRole?: string;
    endpointPermissions?: { [endpoint: string]: string };
    serviceName?: string;
  }
): Promise<T> {
  const level = options?.level || 'endpoint';

  switch (level) {
    case 'global':
      return requireServiceAuthGlobal(serviceImplementation, options?.requiredRole);
    case 'endpoint':
      let endpointPermissions = options?.endpointPermissions;
      
      // If no permissions provided but serviceName is given, fetch from database
      if (!endpointPermissions && options?.serviceName) {
        endpointPermissions = await getServiceEndpointPermissions(options.serviceName);
      }
      
      if (endpointPermissions) {
        return requireServiceAuthEndpoint(serviceImplementation, endpointPermissions);
      }
      return serviceImplementation;
    default:
      return serviceImplementation;
  }
}
