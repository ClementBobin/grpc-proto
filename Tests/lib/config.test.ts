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
      expect(config.apiKeyExpirationDays).toBe(30);
    });

    it('should load configuration from environment variables', () => {
      process.env.GRPC_PORT = '0.0.0.0:9090';
      process.env.USE_TLS = 'true';
      process.env.TLS_CERT_PATH = '/path/to/cert';
      process.env.TLS_KEY_PATH = '/path/to/key';
      process.env.TLS_CA_PATH = '/path/to/ca';
      process.env.API_KEY_EXPIRATION_DAYS = '60';

      const config = loadServerConfig();

      expect(config.port).toBe('0.0.0.0:9090');
      expect(config.useTLS).toBe(true);
      expect(config.certPath).toBe('/path/to/cert');
      expect(config.keyPath).toBe('/path/to/key');
      expect(config.caPath).toBe('/path/to/ca');
      expect(config.apiKeyExpirationDays).toBe(60);
    });

    it('should disable TLS when USE_TLS is not set', () => {
      delete process.env.USE_TLS;

      const config = loadServerConfig();

      expect(config.useTLS).toBe(false);
    });

    it('should use default API key expiration when not set', () => {
      delete process.env.API_KEY_EXPIRATION_DAYS;

      const config = loadServerConfig();

      expect(config.apiKeyExpirationDays).toBe(30);
    });
  });
});
