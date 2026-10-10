import { Prisma } from '@prisma/client';
import { BaseRepository, PrismaTransactionClient } from '../../database/base-repository.js';
import {
  SchemeStatus,
  VerificationStatus,
  ProgramType,
  SchemeCategory,
} from './schemes.constants.js';
import {
  SchemeFilterQuery,
  CreateSchemeInput,
  UpdateSchemeInput,
  BenefitDto,
  DocumentRequirementDto,
  ApplicationPeriodDto,
  EligibilityRuleDto,
} from './schemes.types.js';

export class SchemesRepository extends BaseRepository {
  /**
   * Find public, published & verified schemes with search, filtering, and pagination
   */
  public async findPublishedSchemes(query: SchemeFilterQuery) {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      programType,
      state,
      departmentId,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;

    const where: Prisma.SchemeWhereInput = {
      isPublished: true,
      status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
      verificationStatus: VerificationStatus.VERIFIED,
      ...(category && { categories: { has: category as SchemeCategory } }),
      ...(programType && { programType: programType as ProgramType }),
      ...(departmentId && { departmentId }),
      ...(state && {
        OR: [{ stateScope: 'ALL_INDIA' }, { stateScope: { equals: state, mode: 'insensitive' } }],
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, schemes] = await Promise.all([
      this.defaultDb.scheme.count({ where }),
      this.defaultDb.scheme.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: {
            select: {
              name: true,
              level: true,
              shortName: true,
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
      }),
    ]);

    return { total, schemes };
  }

  /**
   * Find a single public published scheme by slug or UUID
   */
  public async findPublishedSchemeBySlugOrId(slugOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    return this.defaultDb.scheme.findFirst({
      where: {
        ...(isUuid ? { id: slugOrId } : { slug: slugOrId }),
        isPublished: true,
        status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        department: true,
        benefits: true,
        documents: true,
        applicationPeriods: true,
        eligibilityRules: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Find multiple public published schemes by their IDs (for comparison matrix)
   */
  public async findPublishedSchemesByIds(schemeIds: string[]) {
    return this.defaultDb.scheme.findMany({
      where: {
        id: { in: schemeIds },
        isPublished: true,
        status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        department: true,
        benefits: true,
        documents: true,
        applicationPeriods: true,
        eligibilityRules: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Find scheme by slug to verify uniqueness
   */
  public async findSchemeBySlug(slug: string, tx?: PrismaTransactionClient) {
    const db = this.getDb(tx);
    return db.scheme.findUnique({
      where: { slug },
    });
  }

  /**
   * Find all schemes for administrative portal
   */
  public async findAllSchemesAdmin(query: SchemeFilterQuery) {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      programType,
      status,
      verificationStatus,
      departmentId,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;

    const where: Prisma.SchemeWhereInput = {
      ...(status ? { status } : { status: { not: SchemeStatus.ARCHIVED } }),
      ...(verificationStatus && { verificationStatus }),
      ...(category && { categories: { has: category } }),
      ...(programType && { programType }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, schemes] = await Promise.all([
      this.defaultDb.scheme.count({ where }),
      this.defaultDb.scheme.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: true,
          benefits: true,
          documents: true,
          applicationPeriods: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              eligibilityRules: true,
              versions: true,
            },
          },
        },
      }),
    ]);

    return { total, schemes };
  }

  /**
   * Find a complete scheme record for admin review or editing
   */
  public async findSchemeByIdAdmin(id: string, tx?: PrismaTransactionClient) {
    const db = this.getDb(tx);
    return db.scheme.findUnique({
      where: { id },
      include: {
        department: true,
        benefits: true,
        documents: true,
        applicationPeriods: {
          orderBy: { createdAt: 'desc' },
        },
        eligibilityRules: {
          orderBy: { order: 'asc' },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Atomically create a new Scheme draft along with benefits, rules, documents, and initial version snapshot
   */
  public async createSchemeWithRelations(
    data: CreateSchemeInput & { slug: string },
    userId: string,
    tx?: PrismaTransactionClient,
  ) {
    const execute = async (client: PrismaTransactionClient) => {
      const scheme = await client.scheme.create({
        data: {
          slug: data.slug,
          name: data.name,
          shortName: data.shortName,
          description: data.description,
          shortDescription: data.shortDescription,
          programType: data.programType,
          categories: data.categories,
          departmentId: data.departmentId,
          ministry: data.ministry,
          stateScope: data.stateScope || 'ALL_INDIA',
          status: SchemeStatus.DRAFT,
          verificationStatus: VerificationStatus.UNVERIFIED,
          officialSourceUrl: data.officialSourceUrl,
          officialApplicationUrl: data.officialApplicationUrl || null,
          applicationMethod: data.applicationMethod || 'ONLINE',
          applicationInstructions: data.applicationInstructions,
          officialNotificationTitle: data.officialNotificationTitle,
          officialNotificationUrl: data.officialNotificationUrl,
          referenceNumber: data.referenceNumber,
          currentVersion: 1,
          createdBy: userId,
          updatedBy: userId,
          benefits: {
            create: (data.benefits || []).map((b: BenefitDto) => ({
              benefitType: b.benefitType,
              amount: b.amount != null ? new Prisma.Decimal(b.amount) : null,
              maxAmount: b.maxAmount != null ? new Prisma.Decimal(b.maxAmount) : null,
              currency: b.currency || 'INR',
              frequency: b.frequency || 'ANNUAL',
              duration: b.duration,
              description: b.description,
              isVariable: b.isVariable || false,
            })),
          },
          documents: {
            create: (data.documents || []).map((d: DocumentRequirementDto) => ({
              documentType: d.documentType,
              name: d.name,
              description: d.description,
              mandatory: d.mandatory !== false,
              issuingAuthority: d.issuingAuthority,
              notes: d.notes,
            })),
          },
          applicationPeriods: {
            create: (data.applicationPeriods || []).map((ap: ApplicationPeriodDto) => ({
              title: ap.title,
              academicYear: ap.academicYear,
              financialYear: ap.financialYear,
              applicationOpenDate: ap.applicationOpenDate ? new Date(ap.applicationOpenDate) : null,
              applicationCloseDate: ap.applicationCloseDate
                ? new Date(ap.applicationCloseDate)
                : null,
              status: ap.status || 'OPEN',
              instructions: ap.instructions,
            })),
          },
          eligibilityRules: {
            create: (data.eligibilityRules || []).map((r: EligibilityRuleDto, idx: number) => ({
              ruleGroup: r.ruleGroup || 'DEFAULT',
              field: r.field,
              operator: r.operator,
              value: r.value as Prisma.InputJsonValue,
              dataType: r.dataType || 'STRING',
              mandatory: r.mandatory !== false,
              description: r.description,
              order: r.order ?? idx,
              logicalOperator: r.logicalOperator || 'AND',
            })),
          },
        },
        include: {
          department: true,
          benefits: true,
          documents: true,
          applicationPeriods: true,
          eligibilityRules: true,
        },
      });

      // Create Initial Version Snapshot (v1)
      await client.schemeVersion.create({
        data: {
          schemeId: scheme.id,
          versionNumber: 1,
          changeSummary: 'Initial draft creation',
          snapshot: scheme as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      return scheme;
    };

    if (tx) {
      return execute(tx);
    }
    return this.transaction(execute);
  }

  /**
   * Atomically update a Scheme and create an immutable SchemeVersion record
   */
  public async updateSchemeWithRelations(
    id: string,
    data: UpdateSchemeInput,
    userId: string,
    tx?: PrismaTransactionClient,
  ) {
    const execute = async (client: PrismaTransactionClient) => {
      const existing = await client.scheme.findUnique({
        where: { id },
        include: {
          benefits: true,
          documents: true,
          applicationPeriods: true,
          eligibilityRules: true,
        },
      });

      if (!existing) {
        return null;
      }

      const nextVersion = existing.currentVersion + 1;

      // Delete existing relation items to replace with updated set
      await client.benefit.deleteMany({ where: { schemeId: id } });
      await client.documentRequirement.deleteMany({ where: { schemeId: id } });
      await client.applicationPeriod.deleteMany({ where: { schemeId: id } });
      await client.eligibilityRule.deleteMany({ where: { schemeId: id } });

      // Update scheme record
      const updated = await client.scheme.update({
        where: { id },
        data: {
          name: data.name ?? existing.name,
          shortName: data.shortName ?? existing.shortName,
          description: data.description ?? existing.description,
          shortDescription: data.shortDescription ?? existing.shortDescription,
          programType: data.programType ?? existing.programType,
          categories: data.categories ?? existing.categories,
          departmentId: data.departmentId ?? existing.departmentId,
          ministry: data.ministry ?? existing.ministry,
          stateScope: data.stateScope ?? existing.stateScope,
          officialSourceUrl: data.officialSourceUrl ?? existing.officialSourceUrl,
          officialApplicationUrl: data.officialApplicationUrl ?? existing.officialApplicationUrl,
          applicationMethod: data.applicationMethod ?? existing.applicationMethod,
          applicationInstructions: data.applicationInstructions ?? existing.applicationInstructions,
          officialNotificationTitle:
            data.officialNotificationTitle ?? existing.officialNotificationTitle,
          officialNotificationUrl: data.officialNotificationUrl ?? existing.officialNotificationUrl,
          referenceNumber: data.referenceNumber ?? existing.referenceNumber,
          currentVersion: nextVersion,
          updatedBy: userId,
          benefits: {
            create: (data.benefits || []).map((b: BenefitDto) => ({
              benefitType: b.benefitType,
              amount: b.amount != null ? new Prisma.Decimal(b.amount) : null,
              maxAmount: b.maxAmount != null ? new Prisma.Decimal(b.maxAmount) : null,
              currency: b.currency || 'INR',
              frequency: b.frequency || 'ANNUAL',
              duration: b.duration,
              description: b.description,
              isVariable: b.isVariable || false,
            })),
          },
          documents: {
            create: (data.documents || []).map((d: DocumentRequirementDto) => ({
              documentType: d.documentType,
              name: d.name,
              description: d.description,
              mandatory: d.mandatory !== false,
              issuingAuthority: d.issuingAuthority,
              notes: d.notes,
            })),
          },
          applicationPeriods: {
            create: (data.applicationPeriods || []).map((ap: ApplicationPeriodDto) => ({
              title: ap.title,
              academicYear: ap.academicYear,
              financialYear: ap.financialYear,
              applicationOpenDate: ap.applicationOpenDate ? new Date(ap.applicationOpenDate) : null,
              applicationCloseDate: ap.applicationCloseDate
                ? new Date(ap.applicationCloseDate)
                : null,
              status: ap.status || 'OPEN',
              instructions: ap.instructions,
            })),
          },
          eligibilityRules: {
            create: (data.eligibilityRules || []).map((r: EligibilityRuleDto, idx: number) => ({
              ruleGroup: r.ruleGroup || 'DEFAULT',
              field: r.field,
              operator: r.operator,
              value: r.value as Prisma.InputJsonValue,
              dataType: r.dataType || 'STRING',
              mandatory: r.mandatory !== false,
              description: r.description,
              order: r.order ?? idx,
              logicalOperator: r.logicalOperator || 'AND',
            })),
          },
        },
        include: {
          department: true,
          benefits: true,
          documents: true,
          applicationPeriods: true,
          eligibilityRules: true,
        },
      });

      // Create new Version Snapshot
      await client.schemeVersion.create({
        data: {
          schemeId: id,
          versionNumber: nextVersion,
          changeSummary: data.changeSummary || 'Scheme content updated',
          snapshot: updated as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      return updated;
    };

    if (tx) {
      return execute(tx);
    }
    return this.transaction(execute);
  }

  /**
   * Update scheme workflow state (verification, publishing, status changes)
   */
  public async updateSchemeWorkflowState(id: string, updateData: Prisma.SchemeUpdateInput) {
    return this.defaultDb.scheme.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        benefits: true,
        documents: true,
        applicationPeriods: true,
        eligibilityRules: true,
      },
    });
  }

  /**
   * Soft-delete / archive scheme
   */
  public async softDeleteScheme(id: string, userId: string) {
    return this.defaultDb.scheme.update({
      where: { id },
      data: {
        status: SchemeStatus.ARCHIVED,
        isPublished: false,
        updatedBy: userId,
      },
    });
  }

  /**
   * Departments
   */
  public async findDepartments() {
    return this.defaultDb.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  public async findDepartmentById(id: string) {
    return this.defaultDb.department.findUnique({
      where: { id },
    });
  }

  public async createDepartment(data: Prisma.DepartmentCreateInput) {
    return this.defaultDb.department.create({
      data,
    });
  }

  /**
   * Historical versions
   */
  public async findSchemeVersions(schemeId: string) {
    return this.defaultDb.schemeVersion.findMany({
      where: { schemeId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Module 4 recommendation feed
   * Pure deterministic scheme and rule data
   */
  public async getPublishedSchemesForRecommendation() {
    return this.defaultDb.scheme.findMany({
      where: {
        isPublished: true,
        status: { in: [SchemeStatus.PUBLISHED, SchemeStatus.ACTIVE] },
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        department: true,
        eligibilityRules: {
          orderBy: { order: 'asc' },
        },
        benefits: true,
        documents: true,
        applicationPeriods: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
  }
}

export const schemesRepository = new SchemesRepository();
