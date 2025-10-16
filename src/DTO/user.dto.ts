import { z } from 'zod';

// Zod Schemas
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  id: z.string(),
});

export const UserSchema = CreateUserSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
});

// TypeScript Types
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// gRPC Message Types
export interface GetUserRequest {
  id: string;
}

export interface GetUserResponse {
  user?: User;
  error?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  user?: User;
  error?: string;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
}

export interface UpdateUserResponse {
  user?: User;
  error?: string;
}

export interface DeleteUserRequest {
  id: string;
}

export interface DeleteUserResponse {
  success: boolean;
  error?: string;
}

export interface ListUsersRequest {
  page?: number;
  pageSize?: number;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  error?: string;
}
