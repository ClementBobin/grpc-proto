import { loadServerConfig } from '@/lib/config';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadServerConfig', () => {
    it('should load default configuration', () => {
      const config = loadServerConfig();

      expect(config.port).toBe('0.0.0.0:50051');
      expect(config.useTLS).toBe(false);
      expect(config.jwtSecret).toBe('super-secret');
      expect(config.enableAuth).toBe(true);
      expect(config.authLevel).toBe('endpoint');
    });

    it('should load configuration from environment variables', () => {
      process.env.GRPC_PORT = '0.0.0.0:9090';
      process.env.USE_TLS = 'true';
      process.env.JWT_SECRET = 'test-secret';
      process.env.ENABLE_AUTH = 'true';
      process.env.AUTH_LEVEL = 'global';
      process.env.TLS_CERT_PATH = '/path/to/cert';
      process.env.TLS_KEY_PATH = '/path/to/key';
      process.env.TLS_CA_PATH = '/path/to/ca';

      const config = loadServerConfig();

      expect(config.port).toBe('0.0.0.0:9090');
      expect(config.useTLS).toBe(true);
      expect(config.jwtSecret).toBe('test-secret');
      expect(config.enableAuth).toBe(true);
      expect(config.authLevel).toBe('global');
      expect(config.certPath).toBe('/path/to/cert');
      expect(config.keyPath).toBe('/path/to/key');
      expect(config.caPath).toBe('/path/to/ca');
    });

    it('should disable TLS when USE_TLS is not set', () => {
      delete process.env.USE_TLS;

      const config = loadServerConfig();

      expect(config.useTLS).toBe(false);
    });

    it('should disable auth when ENABLE_AUTH is false', () => {
      process.env.ENABLE_AUTH = 'false';

      const config = loadServerConfig();

      expect(config.enableAuth).toBe(false);
    });

    it('should support different auth levels', () => {
      process.env.AUTH_LEVEL = 'service';
      let config = loadServerConfig();
      expect(config.authLevel).toBe('service');

      process.env.AUTH_LEVEL = 'global';
      config = loadServerConfig();
      expect(config.authLevel).toBe('global');

      process.env.AUTH_LEVEL = 'endpoint';
      config = loadServerConfig();
      expect(config.authLevel).toBe('endpoint');
    });
  });
});
