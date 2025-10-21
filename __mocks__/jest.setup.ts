import { jest } from '@jest/globals';
import { mockLogsModule } from './test-utils';

jest.mock('../src/lib/modules/logs.module', () => ({
  __esModule: true,
  default: mockLogsModule(),
}));

beforeEach(async () => {
  jest.clearAllMocks();
});

afterEach(async () => {
});
