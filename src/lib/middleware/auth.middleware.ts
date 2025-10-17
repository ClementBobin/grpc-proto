import * as grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import encryptField, decryptField from '../encrypt.ts'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

/**
 * Shared helper: verify JWT and check roles
 */
function verifyTokenAndRole(call: grpc.ServerUnaryCall<any, any>, allowedRoles?: string[]) {
  const meta = call.metadata.get('authorization');
  if (!meta || meta.length === 0) {
    throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing token' };
  }

  const token = (meta[0] as string).replace(/^Bearer\s+/i, '');
  const payload = jwt.verify(token, JWT_SECRET) as any;

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    throw { code: grpc.status.PERMISSION_DENIED, message: 'Insufficient role' };
  }

  return payload;
}

/**
 * Wrap a single gRPC handler
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
 * Wrap an entire gRPC service implementation
 */
export function requireAuthGlobal<T extends grpc.UntypedServiceImplementation>(
  serviceImplementation: T,
  allowedRoles: string[]
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