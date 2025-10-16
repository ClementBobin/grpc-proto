import { HealthStatusSchema } from '../../src/DTO/infra.dto';

describe('HealthStatusSchema', () => {
  it('should validate a healthy status object', () => {
    const validHealthStatus = {
      status: 'healthy',
      timestamp: '2025-10-16T06:34:37.817Z',
      database: 'connected',
    };

    const result = HealthStatusSchema.safeParse(validHealthStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validHealthStatus);
    }
  });

  it('should validate an unhealthy status object with error', () => {
    const validHealthStatus = {
      status: 'unhealthy',
      timestamp: '2025-10-16T06:34:37.817Z',
      database: 'disconnected',
      error: 'Connection timeout',
    };

    const result = HealthStatusSchema.safeParse(validHealthStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validHealthStatus);
    }
  });

  it('should reject invalid status value', () => {
    const invalidHealthStatus = {
      status: 'unknown',
      timestamp: '2025-10-16T06:34:37.817Z',
      database: 'connected',
    };

    const result = HealthStatusSchema.safeParse(invalidHealthStatus);
    expect(result.success).toBe(false);
  });

  it('should reject invalid timestamp format', () => {
    const invalidHealthStatus = {
      status: 'healthy',
      timestamp: 'not-a-timestamp',
      database: 'connected',
    };

    const result = HealthStatusSchema.safeParse(invalidHealthStatus);
    expect(result.success).toBe(false);
  });

  it('should reject invalid database value', () => {
    const invalidHealthStatus = {
      status: 'healthy',
      timestamp: '2025-10-16T06:34:37.817Z',
      database: 'invalid',
    };

    const result = HealthStatusSchema.safeParse(invalidHealthStatus);
    expect(result.success).toBe(false);
  });
});
