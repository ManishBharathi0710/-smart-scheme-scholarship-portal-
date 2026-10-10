import { schemesRepository } from './schemes.repository.js';
import { savedSchemesRepository } from '../saved-schemes/saved-schemes.repository.js';
import { recommendationsRepository } from '../recommendations/recommendations.repository.js';
import {
  SchemeStatus,
  VerificationStatus,
  ProgramType,
  SchemeCategory,
} from './schemes.constants.js';
import {
  PublicSchemeCard,
  PublicSchemeDetail,
  AdminSchemeRecord,
  SchemeFilterQuery,
  SchemeRecommendationContract,
  CreateSchemeInput,
  UpdateSchemeInput,
  CreateDepartmentInput,
  SchemeComparisonColumn,
  SchemeComparisonResponse,
} from './schemes.types.js';
import { NotFoundError, ValidationError, ConflictError } from '../../errors/app-error.js';
import { logger } from '../../utils/logger.js';

export class SchemesService {
  /**
   * Generates a clean URL-friendly unique slug from scheme name
   */
  private async generateSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existing = await schemesRepository.findSchemeBySlug(slug);
      if (!existing) {
        isUnique = true;
      } else {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
    }

    return slug;
  }

  /**
   * Public Scheme Catalog Search & Filter (Optionally enriched with authenticated user saved/rec state)
   */
  public async getPublishedSchemes(
    query: SchemeFilterQuery,
    userId?: string,
  ): Promise<{
    items: PublicSchemeCard[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { total, schemes } = await schemesRepository.findPublishedSchemes(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const [rawSavedIds, rawUserRecs] = await Promise.all([
      userId ? savedSchemesRepository.findUserSavedSchemeIds(userId) : Promise.resolve([]),
      userId
        ? recommendationsRepository.findUserRecommendationsForSchemes(
            userId,
            schemes.map((s) => s.id),
          )
        : Promise.resolve([]),
    ]);

    const savedSet = new Set(rawSavedIds);
    const recMap = new Map((rawUserRecs || []).map((r) => [r.schemeId, r]));

    const items: PublicSchemeCard[] = schemes.map((s) => {
      const primaryBenefit = s.benefits[0]
        ? {
            type: s.benefits[0].benefitType,
            amount: s.benefits[0].amount ? Number(s.benefits[0].amount) : null,
            frequency: s.benefits[0].frequency,
            description: s.benefits[0].description,
          }
        : null;

      const activePeriod = s.applicationPeriods[0]
        ? {
            title: s.applicationPeriods[0].title,
            openDate: s.applicationPeriods[0].applicationOpenDate,
            closeDate: s.applicationPeriods[0].applicationCloseDate,
            status: s.applicationPeriods[0].status,
          }
        : null;

      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        shortDescription: s.shortDescription,
        programType: s.programType,
        categories: s.categories,
        departmentName: s.department.name,
        departmentLevel: s.department.level,
        stateScope: s.stateScope,
        verificationStatus: s.verificationStatus,
        lastVerifiedAt: s.lastVerifiedAt,
        primaryBenefit,
        activeApplicationPeriod: activePeriod,
        applicationMethod: s.applicationMethod,
        isSaved: savedSet.has(s.id),
        userRecommendationStatus: recMap.get(s.id)?.eligibilityStatus || null,
      };
    });

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Public Scheme Detail Specification (Optionally enriched with authenticated user's eligibility evaluation)
   */
  public async getPublishedSchemeDetail(
    slugOrId: string,
    userId?: string,
  ): Promise<PublicSchemeDetail> {
    const scheme = await schemesRepository.findPublishedSchemeBySlugOrId(slugOrId);

    if (!scheme) {
      throw new NotFoundError('Scheme or scholarship');
    }

    const [isSaved, userRec] = await Promise.all([
      userId ? savedSchemesRepository.isSchemeSaved(userId, scheme.id) : Promise.resolve(false),
      userId
        ? recommendationsRepository.findLatestUserRecommendationForScheme(userId, scheme.id)
        : Promise.resolve(null),
    ]);

    let userRecommendation = null;
    if (userRec) {
      const evalDetails = (userRec.evaluationDetails as Record<string, unknown>) || {};
      userRecommendation = {
        status: userRec.eligibilityStatus,
        matchingRequirements: (evalDetails.matchingRequirements as string[]) || [],
        missingRequirements: (evalDetails.missingRequirements as string[]) || [],
        uncertainRequirements: (evalDetails.uncertainRequirements as string[]) || [],
        evaluatedAt: userRec.evaluatedAt,
      };
    }

    return {
      id: scheme.id,
      slug: scheme.slug,
      name: scheme.name,
      shortName: scheme.shortName,
      description: scheme.description,
      shortDescription: scheme.shortDescription,
      programType: scheme.programType,
      categories: scheme.categories,
      department: {
        id: scheme.department.id,
        name: scheme.department.name,
        shortName: scheme.department.shortName,
        level: scheme.department.level,
        state: scheme.department.state,
        description: scheme.department.description,
        officialWebsite: scheme.department.officialWebsite,
        createdAt: scheme.department.createdAt,
        updatedAt: scheme.department.updatedAt,
      },
      ministry: scheme.ministry,
      stateScope: scheme.stateScope,
      status: scheme.status,
      verificationStatus: scheme.verificationStatus,
      lastVerifiedAt: scheme.lastVerifiedAt,
      officialSourceUrl: scheme.officialSourceUrl,
      officialApplicationUrl: scheme.officialApplicationUrl,
      applicationMethod: scheme.applicationMethod,
      applicationInstructions: scheme.applicationInstructions,
      officialNotificationTitle: scheme.officialNotificationTitle,
      officialNotificationUrl: scheme.officialNotificationUrl,
      referenceNumber: scheme.referenceNumber,
      benefits: scheme.benefits.map((b) => ({
        id: b.id,
        benefitType: b.benefitType,
        amount: b.amount ? Number(b.amount) : null,
        maxAmount: b.maxAmount ? Number(b.maxAmount) : null,
        currency: b.currency,
        frequency: b.frequency,
        duration: b.duration,
        description: b.description,
        isVariable: b.isVariable,
      })),
      documents: scheme.documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        name: d.name,
        description: d.description,
        mandatory: d.mandatory,
        issuingAuthority: d.issuingAuthority,
        notes: d.notes,
      })),
      applicationPeriods: scheme.applicationPeriods.map((ap) => ({
        id: ap.id,
        title: ap.title,
        academicYear: ap.academicYear,
        financialYear: ap.financialYear,
        applicationOpenDate: ap.applicationOpenDate,
        applicationCloseDate: ap.applicationCloseDate,
        status: ap.status,
        instructions: ap.instructions,
      })),
      eligibilityRequirements: scheme.eligibilityRules.map((r) => ({
        field: r.field,
        operator: r.operator,
        description: r.description,
        mandatory: r.mandatory,
      })),
      isPublished: scheme.isPublished,
      publishedAt: scheme.publishedAt,
      updatedAt: scheme.updatedAt,
      isSaved,
      userRecommendation,
    };
  }

  /**
   * Compare multiple schemes side-by-side (1 to 4 schemes)
   * Strictly factual: No algorithmically calculated 'winner', 'rank', or 'match score'
   */
  public async compareSchemes(
    schemeIds: string[],
    userId?: string,
  ): Promise<SchemeComparisonResponse> {
    if (!schemeIds || schemeIds.length === 0) {
      throw new ValidationError('At least 1 scheme ID is required for comparison');
    }
    if (schemeIds.length > 4) {
      throw new ValidationError('You can compare up to 4 schemes at a time.');
    }

    // Deduplicate schemeIds while preserving user selection order
    const uniqueIds = Array.from(new Set(schemeIds));

    const schemes = await schemesRepository.findPublishedSchemesByIds(uniqueIds);

    const schemeMap = new Map(schemes.map((s) => [s.id, s]));
    const orderedSchemes = uniqueIds
      .map((id) => schemeMap.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (orderedSchemes.length === 0) {
      throw new NotFoundError('No published verified schemes found for the specified IDs');
    }

    const [rawSavedIds, rawUserRecs] = await Promise.all([
      userId ? savedSchemesRepository.findUserSavedSchemeIds(userId) : Promise.resolve([]),
      userId
        ? recommendationsRepository.findUserRecommendationsForSchemes(
            userId,
            orderedSchemes.map((s) => s.id),
          )
        : Promise.resolve([]),
    ]);

    const savedSet = new Set(rawSavedIds);
    const recMap = new Map((rawUserRecs || []).map((r) => [r.schemeId, r]));

    const columns: SchemeComparisonColumn[] = orderedSchemes.map((s) => {
      const activePeriod = s.applicationPeriods[0];
      const rec = recMap.get(s.id);
      const evalDetails = (rec?.evaluationDetails as Record<string, unknown>) || {};

      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        programType: s.programType,
        categories: s.categories,
        departmentName: s.department.name,
        departmentLevel: s.department.level,
        geographicScope: s.stateScope,
        benefitsSummary: s.benefits.map((b) => {
          const parts = [b.benefitType.replace(/_/g, ' ')];
          if (b.amount) parts.push(`₹${Number(b.amount).toLocaleString('en-IN')}`);
          if (b.frequency) parts.push(`(${b.frequency.toLowerCase()})`);
          if (b.description) parts.push(`- ${b.description}`);
          return parts.join(' ');
        }),
        applicationStatus: activePeriod?.status || 'UNKNOWN',
        applicationOpenDate: activePeriod?.applicationOpenDate || null,
        applicationCloseDate: activePeriod?.applicationCloseDate || null,
        requiredDocuments: s.documents.map(
          (d) => `${d.name}${d.mandatory ? ' (Mandatory)' : ' (Optional)'}`,
        ),
        applicationMethod: s.applicationMethod,
        officialApplicationUrl: s.officialApplicationUrl,
        officialSourceUrl: s.officialSourceUrl,
        isSaved: savedSet.has(s.id),
        userEligibility: rec
          ? {
              status: rec.eligibilityStatus,
              evaluatedAt: rec.evaluatedAt,
              missingRequirements: (evalDetails.missingRequirements as string[]) || [],
            }
          : null,
      };
    });

    return {
      comparedCount: columns.length,
      maxAllowed: 4,
      schemes: columns,
    };
  }

  /**
   * Filter Metadata for public discovery UI
   */
  public async getFilterMetadata() {
    const departments = await schemesRepository.findDepartments();

    return {
      programTypes: Object.values(ProgramType),
      categories: Object.values(SchemeCategory),
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        shortName: d.shortName,
        level: d.level,
      })),
    };
  }

  /**
   * Admin Scheme Listing
   */
  public async getAllSchemesAdmin(query: SchemeFilterQuery) {
    const { total, schemes } = await schemesRepository.findAllSchemesAdmin(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    return {
      items: schemes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Admin Scheme Detail
   */
  public async getSchemeByIdAdmin(id: string): Promise<AdminSchemeRecord> {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);

    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    return {
      id: scheme.id,
      slug: scheme.slug,
      name: scheme.name,
      shortName: scheme.shortName,
      description: scheme.description,
      shortDescription: scheme.shortDescription,
      programType: scheme.programType,
      categories: scheme.categories,
      department: scheme.department,
      ministry: scheme.ministry,
      stateScope: scheme.stateScope,
      status: scheme.status,
      verificationStatus: scheme.verificationStatus,
      lastVerifiedAt: scheme.lastVerifiedAt,
      officialSourceUrl: scheme.officialSourceUrl,
      officialApplicationUrl: scheme.officialApplicationUrl,
      applicationMethod: scheme.applicationMethod,
      applicationInstructions: scheme.applicationInstructions,
      officialNotificationTitle: scheme.officialNotificationTitle,
      officialNotificationUrl: scheme.officialNotificationUrl,
      referenceNumber: scheme.referenceNumber,
      benefits: scheme.benefits.map((b) => ({
        id: b.id,
        benefitType: b.benefitType,
        amount: b.amount ? Number(b.amount) : null,
        maxAmount: b.maxAmount ? Number(b.maxAmount) : null,
        currency: b.currency,
        frequency: b.frequency,
        duration: b.duration,
        description: b.description,
        isVariable: b.isVariable,
      })),
      documents: scheme.documents,
      applicationPeriods: scheme.applicationPeriods,
      eligibilityRequirements: scheme.eligibilityRules.map((r) => ({
        field: r.field,
        operator: r.operator,
        description: r.description,
        mandatory: r.mandatory,
      })),
      isPublished: scheme.isPublished,
      publishedAt: scheme.publishedAt,
      updatedAt: scheme.updatedAt,
      currentVersion: scheme.currentVersion,
      publishedBy: scheme.publishedBy,
      verifiedBy: scheme.verifiedBy,
      verificationNotes: scheme.verificationNotes,
      createdBy: scheme.createdBy,
      updatedBy: scheme.updatedBy,
      createdAt: scheme.createdAt,
      rawRules: scheme.eligibilityRules.map((r) => ({
        id: r.id,
        ruleGroup: r.ruleGroup,
        field: r.field,
        operator: r.operator,
        value: r.value,
        dataType: r.dataType,
        mandatory: r.mandatory,
        description: r.description,
        order: r.order,
        logicalOperator: r.logicalOperator,
      })),
    };
  }

  /**
   * Create new Scheme Draft (SCHEME_MANAGER, ADMIN, SUPER_ADMIN)
   */
  public async createScheme(data: CreateSchemeInput, userId: string) {
    const department = await schemesRepository.findDepartmentById(data.departmentId);
    if (!department) {
      throw new ValidationError('Specified department does not exist');
    }

    const slug = await this.generateSlug(data.name);

    const scheme = await schemesRepository.createSchemeWithRelations({ ...data, slug }, userId);

    logger.info({
      event: 'SCHEME_CREATED',
      schemeId: scheme.id,
      slug: scheme.slug,
      userId,
      msg: `Created scheme draft "${scheme.name}"`,
    });

    return scheme;
  }

  /**
   * Update Scheme Content and generate new immutable version
   */
  public async updateScheme(id: string, data: UpdateSchemeInput, userId: string) {
    const existing = await schemesRepository.findSchemeByIdAdmin(id);
    if (!existing) {
      throw new NotFoundError('Scheme record');
    }

    if (existing.status === SchemeStatus.ARCHIVED) {
      throw new ConflictError('Cannot update an archived scheme');
    }

    if (data.departmentId) {
      const department = await schemesRepository.findDepartmentById(data.departmentId);
      if (!department) {
        throw new ValidationError('Specified department does not exist');
      }
    }

    const updated = await schemesRepository.updateSchemeWithRelations(id, data, userId);

    logger.info({
      event: 'SCHEME_UPDATED',
      schemeId: id,
      version: updated?.currentVersion,
      userId,
      msg: `Updated scheme "${updated?.name}" (v${updated?.currentVersion})`,
    });

    return updated;
  }

  /**
   * Workflow Step 1: Submit draft for verification (SCHEME_MANAGER, ADMIN)
   */
  public async submitForVerification(id: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    if (
      scheme.status !== SchemeStatus.DRAFT &&
      scheme.verificationStatus !== VerificationStatus.REJECTED
    ) {
      throw new ConflictError('Only drafts or rejected schemes can be submitted for verification');
    }

    if (!scheme.officialSourceUrl) {
      throw new ValidationError('Scheme must specify an official source URL before verification');
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.PENDING_VERIFICATION,
      verificationStatus: VerificationStatus.PENDING,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_SUBMITTED_FOR_VERIFICATION',
      schemeId: id,
      userId,
      msg: `Scheme "${scheme.name}" submitted for verification`,
    });

    return updated;
  }

  /**
   * Workflow Step 2: Verify and Approve scheme (VERIFIER, ADMIN, SUPER_ADMIN)
   */
  public async verifyScheme(id: string, notes: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    if (scheme.status !== SchemeStatus.PENDING_VERIFICATION) {
      throw new ConflictError('Scheme is not currently awaiting verification');
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      lastVerifiedAt: new Date(),
      verifiedBy: userId,
      verificationNotes: notes,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_VERIFIED',
      schemeId: id,
      verifierId: userId,
      msg: `Scheme "${scheme.name}" verified by authorized verifier`,
    });

    return updated;
  }

  /**
   * Workflow Step 2 (Alt): Reject verification with explanatory notes
   */
  public async rejectVerification(id: string, reason: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    if (scheme.status !== SchemeStatus.PENDING_VERIFICATION) {
      throw new ConflictError('Scheme is not currently awaiting verification');
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.DRAFT,
      verificationStatus: VerificationStatus.REJECTED,
      verificationNotes: `Verification Rejected: ${reason}`,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_VERIFICATION_REJECTED',
      schemeId: id,
      verifierId: userId,
      reason,
      msg: `Verification rejected for scheme "${scheme.name}"`,
    });

    return updated;
  }

  /**
   * Workflow Step 3: Publish Scheme (ADMIN, SUPER_ADMIN)
   * Only verified schemes can be published!
   */
  public async publishScheme(id: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    if (scheme.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ConflictError(
        'Cannot publish an unverified scheme. Verification by authorized personnel is required.',
      );
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.PUBLISHED,
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: userId,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_PUBLISHED',
      schemeId: id,
      publisherId: userId,
      msg: `Scheme "${scheme.name}" published for public discovery`,
    });

    return updated;
  }

  /**
   * Workflow Step 4: Unpublish Scheme (ADMIN, SUPER_ADMIN)
   */
  public async unpublishScheme(id: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.DRAFT,
      isPublished: false,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_UNPUBLISHED',
      schemeId: id,
      userId,
      msg: `Scheme "${scheme.name}" unpublished`,
    });

    return updated;
  }

  /**
   * Workflow Step 5: Discontinue Scheme (ADMIN, SUPER_ADMIN)
   */
  public async discontinueScheme(id: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    const updated = await schemesRepository.updateSchemeWorkflowState(id, {
      status: SchemeStatus.DISCONTINUED,
      isPublished: false,
      updatedBy: userId,
    });

    logger.info({
      event: 'SCHEME_DISCONTINUED',
      schemeId: id,
      userId,
      msg: `Scheme "${scheme.name}" marked as discontinued`,
    });

    return updated;
  }

  /**
   * Archive / Soft delete (ADMIN, SUPER_ADMIN)
   */
  public async deleteScheme(id: string, userId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(id);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }

    await schemesRepository.softDeleteScheme(id, userId);

    logger.info({
      event: 'SCHEME_ARCHIVED',
      schemeId: id,
      userId,
      msg: `Scheme "${scheme.name}" archived`,
    });

    return { message: 'Scheme archived successfully' };
  }

  /**
   * Department management
   */
  public async getDepartments() {
    return schemesRepository.findDepartments();
  }

  public async createDepartment(data: CreateDepartmentInput) {
    return schemesRepository.createDepartment(data);
  }

  /**
   * Scheme version history
   */
  public async getSchemeVersions(schemeId: string) {
    const scheme = await schemesRepository.findSchemeByIdAdmin(schemeId);
    if (!scheme) {
      throw new NotFoundError('Scheme record');
    }
    return schemesRepository.findSchemeVersions(schemeId);
  }

  /**
   * Module 4 Recommendation Engine Service Contract
   * Provides clean, typed scheme definitions and active rules for deterministic evaluation.
   */
  public async getSchemesForRecommendation(): Promise<SchemeRecommendationContract[]> {
    const schemes = await schemesRepository.getPublishedSchemesForRecommendation();

    return schemes.map((s) => {
      const activePeriod =
        s.applicationPeriods.find((p) => p.status === 'OPEN') || s.applicationPeriods[0] || null;
      const latestVersion = s.versions[0];
      return {
        schemeId: s.id,
        slug: s.slug,
        name: s.name,
        shortDescription: s.shortDescription,
        departmentName: s.department?.name || 'Government Department',
        versionId: latestVersion?.id || s.id,
        versionNumber: latestVersion?.versionNumber || s.currentVersion || 1,
        programType: s.programType,
        categories: s.categories,
        stateScope: s.stateScope,
        status: s.status,
        verificationStatus: s.verificationStatus,
        isPublished: s.isPublished,
        applicationPeriodStatus: activePeriod ? activePeriod.status : 'CLOSED',
        activePeriod: activePeriod
          ? {
              openDate: activePeriod.applicationOpenDate,
              closeDate: activePeriod.applicationCloseDate,
              status: activePeriod.status,
            }
          : null,
        rules: s.eligibilityRules.map((r) => ({
          id: r.id,
          field: r.field,
          operator: r.operator,
          value: r.value,
          dataType: r.dataType,
          mandatory: r.mandatory,
          description: r.description,
          ruleGroup: r.ruleGroup,
        })),
        benefits: s.benefits.map((b) => ({
          id: b.id,
          benefitType: b.benefitType,
          amount: b.amount ? Number(b.amount) : null,
          maxAmount: b.maxAmount ? Number(b.maxAmount) : null,
          currency: b.currency,
          frequency: b.frequency,
          duration: b.duration,
          description: b.description,
          isVariable: b.isVariable,
        })),
        requiredDocumentTypes: s.documents.map((d) => d.documentType),
      };
    });
  }
}

export const schemesService = new SchemesService();
