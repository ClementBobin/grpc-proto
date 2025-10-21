import { jest } from '@jest/globals';

jest.mock('../src/lib/modules/logger.module', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logWithErrorHandling: jest.fn(),
    routeStart: jest.fn().mockReturnValue('mock-request-id'),
    routeEnd: jest.fn(),
    trackOperationTime: jest.fn(async (operation: Promise<any>) => await operation),
  },
}));

beforeEach(async () => {
  jest.clearAllMocks();
});

afterEach(async () => {
});
