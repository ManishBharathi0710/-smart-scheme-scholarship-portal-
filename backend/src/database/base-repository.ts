import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma.js';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Base Repository providing consistent database access and transaction context support
 */
export abstract class BaseRepository {
  protected readonly defaultDb: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.defaultDb = client;
  }

  /**
   * Helper to return either the active transaction client or the default database client
   */
  protected getDb(tx?: PrismaTransactionClient): PrismaTransactionClient {
    return tx || this.defaultDb;
  }

  /**
   * Executes operations within an ACID transaction
   */
  public async transaction<T>(
    operation: (tx: PrismaTransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.defaultDb.$transaction(async (tx) => {
      return operation(tx as unknown as PrismaTransactionClient);
    }, options);
  }
}
