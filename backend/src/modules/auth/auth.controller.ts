import { Request, Response, NextFunction } from 'express';
import { AuthService, authService } from './auth.service.js';
import { HttpStatusCodes } from '../../types/api.js';

export class AuthController {
  private readonly service: AuthService;

  constructor(service: AuthService = authService) {
    this.service = service;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: result,
        message: 'Account registered successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        message: 'Logged in successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken as string | undefined;
      await this.service.logout(refreshToken);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: null,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.refreshTokens(req.body.refreshToken);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        message: 'Tokens refreshed successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.service.getCurrentUser(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.service.changePassword(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: null,
        message: 'Password changed successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.forgotPassword(req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.resetPassword(req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: null,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
