import { UserService } from '../../src/BL/user.service';
import { UserRepository } from '../../src/DAL/user.repository';

// Mock the repository
jest.mock('../../src/DAL/user.repository', () => ({
  UserRepository: {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2025-10-16T06:34:37.817Z',
        updatedAt: '2025-10-16T06:34:37.817Z',
      };

      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUser('user_1');

      expect(result).toEqual(mockUser);
      expect(UserRepository.findById).toHaveBeenCalledWith('user_1');
    });

    it('should return null when user not found', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await UserService.getUser('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const input = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const mockUser = {
        id: 'user_2',
        ...input,
      };

      (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.createUser(input);

      expect(result).toEqual(mockUser);
      expect(UserRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const input = {
        id: 'user_1',
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const mockUser = { ...input };

      (UserRepository.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.updateUser(input);

      expect(result).toEqual(mockUser);
      expect(UserRepository.update).toHaveBeenCalledWith(input);
    });

    it('should return null when user not found', async () => {
      const input = {
        id: 'nonexistent',
        name: 'Test',
      };

      (UserRepository.update as jest.Mock).mockResolvedValue(null);

      const result = await UserService.updateUser(input);

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      (UserRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await UserService.deleteUser('user_1');

      expect(result).toBe(true);
      expect(UserRepository.delete).toHaveBeenCalledWith('user_1');
    });

    it('should return false when user not found', async () => {
      (UserRepository.delete as jest.Mock).mockResolvedValue(false);

      const result = await UserService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('listUsers', () => {
    it('should return paginated list of users', async () => {
      const mockResponse = {
        users: [
          {
            id: 'user_1',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2025-10-16T06:34:37.817Z',
            updatedAt: '2025-10-16T06:34:37.817Z',
          },
        ],
        total: 1,
      };

      (UserRepository.findAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await UserService.listUsers(1, 10);

      expect(result).toEqual(mockResponse);
      expect(UserRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });
});
