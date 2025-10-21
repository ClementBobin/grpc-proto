import { LogsModule } from '../src/lib/modules/logs.module';

export const mockLogsModule = (): LogsModule => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
};
