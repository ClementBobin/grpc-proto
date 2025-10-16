import { z } from 'zod';

export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  database: z.enum(['connected', 'disconnected']),
  error: z.string().optional(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
