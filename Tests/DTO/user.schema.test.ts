import { UserSchema, CreateUserSchema, UpdateUserSchema } from '../../src/DTO/user.dto';

describe('User DTOs', () => {
  describe('UserSchema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2025-10-16T06:34:37.817Z',
        updatedAt: '2025-10-16T06:34:37.817Z',
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'not-an-email',
        createdAt: '2025-10-16T06:34:37.817Z',
        updatedAt: '2025-10-16T06:34:37.817Z',
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime', () => {
      const invalidUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: 'not-a-datetime',
        updatedAt: '2025-10-16T06:34:37.817Z',
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateUserSchema', () => {
    it('should validate valid create user input', () => {
      const validInput = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const result = CreateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        email: 'jane@example.com',
      };

      const result = CreateUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        name: 'Jane Doe',
        email: 'not-an-email',
      };

      const result = CreateUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateUserSchema', () => {
    it('should validate valid update with all fields', () => {
      const validInput = {
        id: 'user_1',
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const result = UpdateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate valid update with only name', () => {
      const validInput = {
        id: 'user_1',
        name: 'John Updated',
      };

      const result = UpdateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate valid update with only email', () => {
      const validInput = {
        id: 'user_1',
        email: 'john.updated@example.com',
      };

      const result = UpdateUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require id field', () => {
      const invalidInput = {
        name: 'John Updated',
      };

      const result = UpdateUserSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
