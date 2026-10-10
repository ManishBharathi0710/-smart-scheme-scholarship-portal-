import {
  PrismaClient,
  UserDocument,
  DocumentExtraction,
  DocumentAuditLog,
  DocumentAuditAction,
  Prisma,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../database/prisma.js';
import { DocumentListQuery } from './documents.types.js';

export class DocumentsRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient = defaultPrisma) {
    this.prisma = prisma;
  }

  async createDocument(data: Prisma.UserDocumentCreateInput): Promise<UserDocument> {
    return this.prisma.userDocument.create({ data });
  }

  async findDocumentById(
    id: string,
  ): Promise<(UserDocument & { extractions: DocumentExtraction[] }) | null> {
    return this.prisma.userDocument.findUnique({
      where: { id },
      include: {
        extractions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findUserDocuments(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{ items: (UserDocument & { extractions: DocumentExtraction[] })[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      documentType,
      documentCategory,
      documentStatus,
      ocrStatus,
      verificationStatus,
      onlyCurrent = true,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserDocumentWhereInput = {
      userId,
      deletedAt: null, // Exclude soft-deleted
      ...(onlyCurrent ? { isCurrent: true } : {}),
      ...(documentType ? { documentType } : {}),
      ...(documentCategory ? { documentCategory } : {}),
      ...(documentStatus ? { documentStatus } : {}),
      ...(ocrStatus ? { ocrStatus } : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.userDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          extractions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.userDocument.count({ where }),
    ]);

    return { items, total };
  }

  async findDuplicateByChecksum(userId: string, checksum: string): Promise<UserDocument | null> {
    return this.prisma.userDocument.findFirst({
      where: {
        userId,
        checksum,
        deletedAt: null,
      },
    });
  }

  async findCurrentByGroupId(documentGroupId: string): Promise<UserDocument | null> {
    return this.prisma.userDocument.findFirst({
      where: {
        documentGroupId,
        isCurrent: true,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
    });
  }

  async updateDocument(id: string, data: Prisma.UserDocumentUpdateInput): Promise<UserDocument> {
    return this.prisma.userDocument.update({
      where: { id },
      data,
    });
  }

  async demoteCurrentVersions(documentGroupId: string): Promise<void> {
    await this.prisma.userDocument.updateMany({
      where: { documentGroupId, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  async softDeleteDocument(id: string, deletedBy: string): Promise<UserDocument> {
    return this.prisma.userDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        isCurrent: false,
      },
    });
  }

  async createExtraction(data: Prisma.DocumentExtractionCreateInput): Promise<DocumentExtraction> {
    return this.prisma.documentExtraction.create({ data });
  }

  async findExtractionById(id: string): Promise<DocumentExtraction | null> {
    return this.prisma.documentExtraction.findUnique({
      where: { id },
    });
  }

  async findLatestExtractionForDocument(documentId: string): Promise<DocumentExtraction | null> {
    return this.prisma.documentExtraction.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateExtraction(
    id: string,
    data: Prisma.DocumentExtractionUpdateInput,
  ): Promise<DocumentExtraction> {
    return this.prisma.documentExtraction.update({
      where: { id },
      data,
    });
  }

  async createAuditLog(
    userId: string,
    action: DocumentAuditAction,
    documentId?: string,
    metadata?: Prisma.InputJsonValue,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DocumentAuditLog> {
    return this.prisma.documentAuditLog.create({
      data: {
        userId,
        action,
        documentId,
        metadata: metadata || Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Fetch scheme and its required documents defined in Module 3
   */
  async findSchemeWithRequirements(schemeId: string) {
    return this.prisma.scheme.findUnique({
      where: { id: schemeId },
      include: {
        documents: true,
      },
    });
  }

  /**
   * Find all active non-expired user documents matching given document types
   */
  async findUserDocumentsForTypes(userId: string, types: string[]): Promise<UserDocument[]> {
    return this.prisma.userDocument.findMany({
      where: {
        userId,
        deletedAt: null,
        isCurrent: true,
        documentType: { in: types },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const documentsRepository = new DocumentsRepository();
