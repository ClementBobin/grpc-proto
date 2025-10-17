import * as grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import { encryptField, decryptField } from '../encrypt';
import { loadServerConfig, type EndpointAuthConfig, type ServiceAuthConfig } from '../config';

const config = loadServerConfig();
const JWT_SECRET = config.jwtSecret;

/**
 * Shared helper: verify JWT and check roles
 */
function verifyTokenAndRole(call: grpc.ServerUnaryCall<any, any>, allowedRoles?: string[]) {
  const meta = call.metadata.get('authorization');
  if (!meta || meta.length === 0) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing token' };
  }

  const token = (meta[0] as string).replace(/^Bearer\s+/i, '');
  let payload: any;
  
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'Invalid token' };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    throw { code: grpc.status.PERMISSION_DENIED, message: 'Insufficient role' };
  }

  return payload;
}

/**
 * Wrap a single gRPC handler with optional auth
 */
export function requireAuth<T, U>(
  handler: (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => void | Promise<void>,
  allowedRoles?: string[]
) {
  return async (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>) => {
    try {
      (call as any).user = verifyTokenAndRole(call, allowedRoles);
      await handler(call, callback);
    } catch (err: any) {
      callback(err, null as any);
    }
  };
}

/**
 * Wrap an entire gRPC service implementation with global auth
 */
export function requireAuthGlobal<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  allowedRoles?: string[]
): T {
  const wrapped: any = {};

  for (const methodName of Object.keys(serviceImplementation)) {
    const originalHandler = (serviceImplementation as any)[methodName];
    wrapped[methodName] = async (call: any, callback: any) => {
      try {
        (call as any).user = verifyTokenAndRole(call, allowedRoles);
        await originalHandler(call, callback);
      } catch (err: any) {
        callback(err, null);
      }
    };
  }

  return wrapped as T;
}

/**
 * Wrap gRPC service implementation with service-level auth configuration
 */
export function requireAuthService<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  authConfig: ServiceAuthConfig
): T {
  if (!authConfig.enabled) {
    return serviceImplementation;
  }

  return requireAuthGlobal(serviceImplementation, authConfig.allowedRoles);
}

/**
 * Wrap gRPC service implementation with endpoint-level auth configuration
 */
export function requireAuthEndpoint<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  endpointConfig: EndpointAuthConfig
): T {
  const wrapped: any = {};

  for (const methodName of Object.keys(serviceImplementation)) {
    const originalHandler = (serviceImplementation as any)[methodName];
    const methodConfig = endpointConfig[methodName];

    if (methodConfig && methodConfig.enabled) {
      // Auth enabled for this endpoint
      wrapped[methodName] = async (call: any, callback: any) => {
        try {
          (call as any).user = verifyTokenAndRole(call, methodConfig.allowedRoles);
          await originalHandler(call, callback);
        } catch (err: any) {
          callback(err, null);
        }
      };
    } else {
      // No auth for this endpoint
      wrapped[methodName] = originalHandler;
    }
  }

  return wrapped as T;
}

/**
 * Apply auth middleware based on configuration level
 */
export function applyAuthMiddleware<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  options?: {
    level?: 'global' | 'service' | 'endpoint';
    globalRoles?: string[];
    serviceConfig?: ServiceAuthConfig;
    endpointConfig?: EndpointAuthConfig;
  }
): T {
  if (!config.enableAuth) {
    return serviceImplementation;
  }

  const level = options?.level || config.authLevel;

  switch (level) {
    case 'global':
      return requireAuthGlobal(serviceImplementation, options?.globalRoles);
    case 'service':
      return requireAuthService(serviceImplementation, options?.serviceConfig || { enabled: true });
    case 'endpoint':
      return requireAuthEndpoint(serviceImplementation, options?.endpointConfig || {});
    default:
      return serviceImplementation;
  }
}