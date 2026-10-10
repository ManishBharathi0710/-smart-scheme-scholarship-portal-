import { BaseRepository } from '../../database/base-repository.js';
import { checkDatabaseConnection } from '../../database/prisma.js';

export class HealthRepository extends BaseRepository {
  /**
   * Check connection to the database
   */
  async checkConnection(): Promise<{
    connected: boolean;
    responseTimeMs?: number;
    error?: string;
  }> {
    return checkDatabaseConnection();
  }
}

export const healthRepository = new HealthRepository();
