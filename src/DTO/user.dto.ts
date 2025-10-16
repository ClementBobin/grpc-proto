import { z } from 'zod';

// Zod Schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
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
