import { HealthCheckData } from '../../types/api.js';
import { HealthRepository, healthRepository } from './health.repository.js';
import { env } from '../../config/env.js';

export class HealthService {
  private readonly repository: HealthRepository;
  private readonly startTime: number;

  constructor(repository: HealthRepository = healthRepository) {
    this.repository = repository;
    this.startTime = Date.now();
  }

  /**
   * Get full system health including database status
   */
  async getSystemHealth(): Promise<HealthCheckData> {
    const dbStatus = await this.repository.checkConnection();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: dbStatus.connected ? 'healthy' : 'degraded',
      service: 'smart-scheme-backend',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        responseTimeMs: dbStatus.responseTimeMs,
      },
    };
  }

  /**
   * Liveness probe - determines if application process is running
   */
  getLiveness(): { status: 'alive'; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - determines if application is ready to accept user traffic
   */
  async getReadiness(): Promise<{
    ready: boolean;
    database: 'connected' | 'disconnected';
    timestamp: string;
  }> {
    const dbStatus = await this.repository.checkConnection();
    return {
      ready: dbStatus.connected,
      database: dbStatus.connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
