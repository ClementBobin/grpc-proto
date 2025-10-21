import { z } from 'zod';

// ===== Service Schemas =====
export const CreateServiceSchema = z.object({
  name: z.string().min(1),
  roleId: z.string().optional(),
});

export const ModifyServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  roleId: z.string().optional(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  roleId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ===== ServiceRole Schemas =====
export const CreateServiceRoleSchema = z.object({
  serviceId: z.string(),
  roleId: z.string(),
});

export const ServiceRoleSchema = z.object({
  serviceId: z.string(),
  roleId: z.string(),
});

// ===== RolePermission Schemas =====
export const CreateRolePermissionSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export const RolePermissionSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

// ===== ServiceEndpoint Schemas =====
export const CreateServiceEndpointSchema = z.object({
  serviceName: z.string().min(1),
  endpointName: z.string().min(1),
  permissionId: z.string(),
});

export const UpdateServiceEndpointSchema = z.object({
  id: z.string(),
  serviceName: z.string().min(1).optional(),
  endpointName: z.string().min(1).optional(),
  permissionId: z.string().optional(),
});

export const ServiceEndpointSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  endpointName: z.string(),
  permissionId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ===== ApiKey Schemas =====
export const CreateApiKeySchema = z.object({
  serviceId: z.string(),
  expiresAt: z.string().datetime(),
});

export const ResetApiKeyExpirySchema = z.object({
  id: z.string(),
  expiresAt: z.string().datetime(),
});

export const ApiKeySchema = z.object({
  id: z.string(),
  key: z.string(),
  serviceId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
  isRevoked: z.boolean(),
});

// ===== TypeScript Types =====
export type Service = z.infer<typeof ServiceSchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type ModifyServiceInput = z.infer<typeof ModifyServiceSchema>;

export type ServiceRole = z.infer<typeof ServiceRoleSchema>;
export type CreateServiceRoleInput = z.infer<typeof CreateServiceRoleSchema>;

export type RolePermission = z.infer<typeof RolePermissionSchema>;
export type CreateRolePermissionInput = z.infer<typeof CreateRolePermissionSchema>;

export type ServiceEndpoint = z.infer<typeof ServiceEndpointSchema>;
export type CreateServiceEndpointInput = z.infer<typeof CreateServiceEndpointSchema>;
export type UpdateServiceEndpointInput = z.infer<typeof UpdateServiceEndpointSchema>;

export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type ResetApiKeyExpiryInput = z.infer<typeof ResetApiKeyExpirySchema>;

// ===== gRPC Message Types =====

// Service (gRPC uses string dates in messages)
export interface ServiceMessage {
  id: string;
  name: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetServiceRequest {
  id: string;
}

export interface GetServiceResponse {
  service?: ServiceMessage;
  error?: string;
}

export interface CreateServiceRequest {
  name: string;
  roleId?: string;
}

export interface CreateServiceResponse {
  service?: ServiceMessage;
  error?: string;
}

export interface ModifyServiceRequest {
  id: string;
  name?: string;
  roleId?: string;
}

export interface ModifyServiceResponse {
  service?: ServiceMessage;
  error?: string;
}

export interface ListServicesRequest {
  page?: number;
  pageSize?: number;
}

export interface ListServicesResponse {
  services: ServiceMessage[];
  total: number;
  error?: string;
}

// ServiceRole
export interface GetServiceRoleRequest {
  serviceId: string;
  roleId: string;
}

export interface GetServiceRoleResponse {
  serviceRole?: ServiceRole;
  error?: string;
}

export interface CreateServiceRoleRequest {
  serviceId: string;
  roleId: string;
}

export interface CreateServiceRoleResponse {
  serviceRole?: ServiceRole;
  error?: string;
}

export interface ListServiceRolesRequest {
  serviceId?: string;
}

export interface ListServiceRolesResponse {
  serviceRoles: ServiceRole[];
  error?: string;
}

export interface DeleteServiceRoleRequest {
  serviceId: string;
  roleId: string;
}

export interface DeleteServiceRoleResponse {
  success: boolean;
  error?: string;
}

// RolePermission
export interface GetRolePermissionRequest {
  roleId: string;
  permissionId: string;
}

export interface GetRolePermissionResponse {
  rolePermission?: RolePermission;
  error?: string;
}

export interface CreateRolePermissionRequest {
  roleId: string;
  permissionId: string;
}

export interface CreateRolePermissionResponse {
  rolePermission?: RolePermission;
  error?: string;
}

export interface ListRolePermissionsRequest {
  roleId?: string;
}

export interface ListRolePermissionsResponse {
  rolePermissions: RolePermission[];
  error?: string;
}

export interface DeleteRolePermissionRequest {
  roleId: string;
  permissionId: string;
}

export interface DeleteRolePermissionResponse {
  success: boolean;
  error?: string;
}

// ServiceEndpoint (gRPC uses string dates in messages)
export interface ServiceEndpointMessage {
  id: string;
  serviceName: string;
  endpointName: string;
  permissionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetServiceEndpointRequest {
  id: string;
}

export interface GetServiceEndpointResponse {
  serviceEndpoint?: ServiceEndpointMessage;
  error?: string;
}

export interface CreateServiceEndpointRequest {
  serviceName: string;
  endpointName: string;
  permissionId: string;
}

export interface CreateServiceEndpointResponse {
  serviceEndpoint?: ServiceEndpointMessage;
  error?: string;
}

export interface UpdateServiceEndpointRequest {
  id: string;
  serviceName?: string;
  endpointName?: string;
  permissionId?: string;
}

export interface UpdateServiceEndpointResponse {
  serviceEndpoint?: ServiceEndpointMessage;
  error?: string;
}

export interface ListServiceEndpointsRequest {
  serviceName?: string;
}

export interface ListServiceEndpointsResponse {
  serviceEndpoints: ServiceEndpointMessage[];
  error?: string;
}

export interface DeleteServiceEndpointRequest {
  id: string;
}

export interface DeleteServiceEndpointResponse {
  success: boolean;
  error?: string;
}

// ApiKey (gRPC uses string dates in messages)
export interface ApiKeyMessage {
  id: string;
  key: string;
  serviceId: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
  isRevoked: boolean;
}

export interface GetApiKeyRequest {
  id: string;
}

export interface GetApiKeyResponse {
  apiKey?: ApiKeyMessage;
  error?: string;
}

export interface CreateApiKeyRequest {
  serviceId: string;
  expiresAt: string;
}

export interface CreateApiKeyResponse {
  apiKey?: ApiKeyMessage;
  error?: string;
}

export interface RevokeApiKeyRequest {
  id: string;
}

export interface RevokeApiKeyResponse {
  success: boolean;
  error?: string;
}

export interface ResetApiKeyExpiryRequest {
  id: string;
  expiresAt: string;
}

export interface ResetApiKeyExpiryResponse {
  apiKey?: ApiKeyMessage;
  error?: string;
}

export interface ListApiKeysRequest {
  serviceId?: string;
}

export interface ListApiKeysResponse {
  apiKeys: ApiKeyMessage[];
  error?: string;
}
