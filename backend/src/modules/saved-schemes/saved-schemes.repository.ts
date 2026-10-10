import { Prisma } from '@prisma/client';
import { BaseRepository } from '../../database/base-repository.js';
import { SavedSchemeQuery } from './saved-schemes.types.js';

export class SavedSchemesRepository extends BaseRepository {
  /**
   * Save a scheme for a user (Idempotent upsert preventing duplicates)
   */
  public async saveScheme(userId: string, schemeId: string) {
    const db = this.getDb();

    return db.savedScheme.upsert({
      where: {
        userId_schemeId: {
          userId,
          schemeId,
        },
      },
      create: {
        userId,
        schemeId,
      },
      update: {},
      include: {
        scheme: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Remove a scheme from user's saved list
   */
  public async removeSavedScheme(userId: string, schemeId: string) {
    const db = this.getDb();

    try {
      return await db.savedScheme.delete({
        where: {
          userId_schemeId: {
            userId,
            schemeId,
          },
        },
      });
    } catch (err: unknown) {
      // If record not found, delete is already effectively satisfied (idempotent)
      const error = err as { code?: string };
      if (error.code === 'P2025') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Check if a specific scheme is saved by user
   */
  public async isSchemeSaved(userId: string, schemeId: string): Promise<boolean> {
    const db = this.getDb();

    const record = await db.savedScheme.findUnique({
      where: {
        userId_schemeId: {
          userId,
          schemeId,
        },
      },
      select: {
        id: true,
      },
    });

    return !!record;
  }

  /**
   * Get list of all saved scheme IDs for the user
   */
  public async findUserSavedSchemeIds(userId: string): Promise<string[]> {
    const db = this.getDb();

    const records = await db.savedScheme.findMany({
      where: {
        userId,
      },
      select: {
        schemeId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((r) => r.schemeId);
  }

  /**
   * Total count of saved schemes for the user
   */
  public async countUserSavedSchemes(userId: string): Promise<number> {
    const db = this.getDb();
    return db.savedScheme.count({
      where: {
        userId,
        scheme: {
          isPublished: true,
          status: 'PUBLISHED',
          verificationStatus: 'VERIFIED',
        },
      },
    });
  }

  /**
   * Find paginated saved schemes with full scheme metadata and latest user recommendation
   */
  public async findUserSavedSchemes(userId: string, query: SavedSchemeQuery) {
    const { page = 1, pageSize = 20, category, programType, applicationStatus } = query;

    const skip = (page - 1) * pageSize;
    const db = this.getDb();

    const where: Prisma.SavedSchemeWhereInput = {
      userId,
      scheme: {
        isPublished: true,
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        ...(programType ? { programType } : {}),
        ...(category ? { categories: { has: category } } : {}),
        ...(applicationStatus
          ? {
              applicationPeriods: {
                some: { status: applicationStatus },
              },
            }
          : {}),
      },
    };

    const [items, total] = await Promise.all([
      db.savedScheme.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          scheme: {
            include: {
              department: {
                select: {
                  name: true,
                  level: true,
                },
              },
              benefits: {
                take: 1,
                select: {
                  benefitType: true,
                  amount: true,
                  frequency: true,
                  description: true,
                },
              },
              applicationPeriods: {
                where: { status: 'OPEN' },
                take: 1,
                select: {
                  title: true,
                  applicationOpenDate: true,
                  applicationCloseDate: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      db.savedScheme.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}

export const savedSchemesRepository = new SavedSchemesRepository();
