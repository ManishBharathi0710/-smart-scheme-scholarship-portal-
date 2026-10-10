import { Request, Response, NextFunction } from 'express';
import { AssistantService, assistantService } from './assistant.service.js';
import { AssistantChatRequest } from './assistant.types.js';

export class AssistantController {
  constructor(private readonly service: AssistantService = assistantService) {}

  public chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const body = req.body as AssistantChatRequest;
      const result = await this.service.chat(userId, body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getConversations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = req.query['page'] ? Number(req.query['page']) : 1;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

      const result = await this.service.getUserConversations(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params as { conversationId: string };
      const result = await this.service.getConversation(userId, conversationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params as { conversationId: string };
      const result = await this.service.deleteConversation(userId, conversationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const assistantController = new AssistantController();
