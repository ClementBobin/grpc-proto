import { Logger } from 'winston';

export const mockLogger = (): Logger => {
  const logger = jest.createMockFromModule<typeof import('../src/lib/modules/logger.module')>('../src/lib/modules/logger.module').default;

  logger.info = jest.fn();
  logger.error = jest.fn();
  logger.warn = jest.fn();
  logger.debug = jest.fn();
  logger.logWithErrorHandling = jest.fn();
  logger.grpcCallStart = jest.fn().mockReturnValue('mock-call-id');
  logger.grpcCallEnd = jest.fn();
  logger.trackOperationTime = jest.fn(async (operation: Promise<any>) => await operation);

  return logger;
};
