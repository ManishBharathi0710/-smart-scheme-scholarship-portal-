import { Prisma, RecommendationEligibilityStatus, SchemeStatus } from '@prisma/client';
import { BaseRepository, PrismaTransactionClient } from '../../database/base-repository.js';
import { RecommendationListQuery } from './recommendations.types.js';
import { FullRecommendationEvaluation } from './engine/types.js';

export class RecommendationsRepository extends BaseRepository {
  /**
   * Find paginated recommendations for a specific user with filtering and sorting
   */
  public async findUserRecommendations(userId: string, query: RecommendationListQuery) {
    const {
      page = 1,
      pageSize = 20,
      status,
      programType,
      category,
      applicationStatus,
      expiringSoon,
    } = query;

    const skip = (page - 1) * pageSize;
    const db = this.getDb();

    const where: Prisma.RecommendationWhereInput = {
      userId,
      scheme: {
        isPublished: true,
        status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
        verificationStatus: 'VERIFIED',
        ...(programType ? { programType } : {}),
        ...(category ? { categories: { has: category } } : {}),
      },
      ...(status ? { eligibilityStatus: status } : {}),
      ...(applicationStatus ? { applicationStatus } : {}),
      ...(expiringSoon !== undefined ? { isExpiringSoon: expiringSoon } : {}),
    };

    const [items, total] = await Promise.all([
      db.recommendation.findMany({
        where,
        include: {
          scheme: {
            include: {
              department: true,
              benefits: true,
              applicationPeriods: true,
            },
          },
          schemeVersion: {
            select: {
              versionNumber: true,
            },
          },
        },
        orderBy: [
          { eligibilityStatus: 'asc' }, // Will be refined in service layer with deterministic weights
          { applicationStatus: 'asc' },
          { isExpiringSoon: 'desc' },
          { evaluatedAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      db.recommendation.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find a single recommendation by ID ensuring strict user ownership
   */
  public async findRecommendationById(id: string, userId: string) {
    const db = this.getDb();

    return db.recommendation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        scheme: {
          include: {
            department: true,
            benefits: true,
            documents: true,
            applicationPeriods: true,
          },
        },
        schemeVersion: true,
      },
    });
  }

  /**
   * Find existing recommendation by unique triple: (userId, schemeId, schemeVersionId)
   */
  public async findExistingEvaluation(userId: string, schemeId: string, schemeVersionId: string) {
    const db = this.getDb();

    return db.recommendation.findUnique({
      where: {
        userId_schemeId_schemeVersionId: {
          userId,
          schemeId,
          schemeVersionId,
        },
      },
    });
  }

  /**
   * Find the latest recommendation evaluation for a user and scheme
   */
  public async findLatestUserRecommendationForScheme(userId: string, schemeId: string) {
    const db = this.getDb();

    return db.recommendation.findFirst({
      where: {
        userId,
        schemeId,
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
      include: {
        schemeVersion: {
          select: {
            versionNumber: true,
          },
        },
      },
    });
  }

  /**
   * Find latest recommendations for a set of schemes for comparison/catalog
   */
  public async findUserRecommendationsForSchemes(userId: string, schemeIds: string[]) {
    const db = this.getDb();

    return db.recommendation.findMany({
      where: {
        userId,
        schemeId: { in: schemeIds },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
      include: {
        schemeVersion: {
          select: {
            versionNumber: true,
          },
        },
      },
    });
  }

  /**
   * Upsert a recommendation record deterministically
   */
  public async upsertRecommendation(
    userId: string,
    evalData: FullRecommendationEvaluation,
    tx?: PrismaTransactionClient,
  ) {
    const db = this.getDb(tx);

    return db.recommendation.upsert({
      where: {
        userId_schemeId_schemeVersionId: {
          userId,
          schemeId: evalData.schemeId,
          schemeVersionId: evalData.schemeVersionId,
        },
      },
      create: {
        userId,
        schemeId: evalData.schemeId,
        schemeVersionId: evalData.schemeVersionId,
        eligibilityStatus: evalData.eligibilityStatus,
        applicationStatus: evalData.applicationStatus,
        isExpiringSoon: evalData.isExpiringSoon,
        matchedCount: evalData.matchedCount,
        failedCount: evalData.failedCount,
        unknownCount: evalData.unknownCount,
        evaluationDetails: evalData.evaluationDetails as unknown as Prisma.InputJsonValue,
        evaluatedAt: new Date(),
      },
      update: {
        eligibilityStatus: evalData.eligibilityStatus,
        applicationStatus: evalData.applicationStatus,
        isExpiringSoon: evalData.isExpiringSoon,
        matchedCount: evalData.matchedCount,
        failedCount: evalData.failedCount,
        unknownCount: evalData.unknownCount,
        evaluationDetails: evalData.evaluationDetails as unknown as Prisma.InputJsonValue,
        evaluatedAt: new Date(),
      },
    });
  }

  /**
   * Save all evaluations for a user atomically in a transaction
   */
  public async saveBatchRecommendations(
    userId: string,
    evaluations: FullRecommendationEvaluation[],
  ) {
    return this.transaction(async (tx) => {
      const results = [];
      for (const ev of evaluations) {
        const res = await this.upsertRecommendation(userId, ev, tx);
        results.push(res);
      }
      return results;
    });
  }

  /**
   * Count user recommendations by eligibility status
   */
  public async countByStatus(
    userId: string,
  ): Promise<Record<RecommendationEligibilityStatus, number>> {
    const db = this.getDb();

    const counts = await db.recommendation.groupBy({
      by: ['eligibilityStatus'],
      where: {
        userId,
        scheme: {
          isPublished: true,
          status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
        },
      },
      _count: {
        id: true,
      },
    });

    const result: Record<RecommendationEligibilityStatus, number> = {
      ELIGIBLE: 0,
      LIKELY_ELIGIBLE: 0,
      NEEDS_VERIFICATION: 0,
      NOT_ELIGIBLE: 0,
    };

    for (const c of counts) {
      result[c.eligibilityStatus] = c._count.id;
    }

    return result;
  }
}

export const recommendationsRepository = new RecommendationsRepository();
