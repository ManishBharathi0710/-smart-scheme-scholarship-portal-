import { prisma } from '../../database/prisma.js';
import { ConversationRole, AssistantContextType, Prisma } from '@prisma/client';

export interface CreateConversationData {
  userId: string;
  title: string;
  contextType?: AssistantContextType;
  contextId?: string;
  language?: string;
}

export interface CreateMessageData {
  conversationId: string;
  role: ConversationRole;
  content: string;
  intent?: string;
  sources?: unknown;
  actions?: unknown;
  metadata?: unknown;
}

export interface RecordUsageData {
  userId: string;
  conversationId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status: string;
}

export class AssistantRepository {
  public async createConversation(data: CreateConversationData) {
    return prisma.conversation.create({
      data: {
        userId: data.userId,
        title: data.title,
        contextType: data.contextType || AssistantContextType.GENERAL,
        contextId: data.contextId,
        language: data.language || 'en',
      },
    });
  }

  public async findConversationById(id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  public async findUserConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.conversation.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
    ]);

    return { items, total };
  }

  public async softDeleteConversation(id: string, userId: string) {
    return prisma.conversation.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  public async createMessage(data: CreateMessageData) {
    return prisma.conversationMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        intent: data.intent,
        sources: data.sources ? (data.sources as Prisma.InputJsonValue) : Prisma.JsonNull,
        actions: data.actions ? (data.actions as Prisma.InputJsonValue) : Prisma.JsonNull,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  public async findConversationMessages(conversationId: string, limit = 20) {
    return prisma.conversationMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  public async touchConversation(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  public async recordUsage(data: RecordUsageData) {
    return prisma.aiUsage.create({
      data: {
        userId: data.userId,
        conversationId: data.conversationId,
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        durationMs: data.durationMs,
        status: data.status,
      },
    });
  }
}

export const assistantRepository = new AssistantRepository();
