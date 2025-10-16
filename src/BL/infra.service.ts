import { InfraRepository } from '@/DAL/infra.repository';

export const InfraService = {
  healthCheck: async () => {
    // Could do DB check, cache check, etc.
    return InfraRepository.getHealthStatus();
  }
};