import { Request, Response, NextFunction } from 'express';
import { ProfileService, profileService } from './profile.service.js';
import { HttpStatusCodes } from '../../types/api.js';
import { ConsentType } from '@prisma/client';

export class ProfileController {
  private readonly service: ProfileService;

  constructor(service: ProfileService = profileService) {
    this.service = service;
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.getProfile(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  updateFullProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateFullProfile(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  updatePersonal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updatePersonal(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Personal information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateLocation(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Location information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updateEducation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateEducation(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Education information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updateFinancial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateFinancial(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Financial information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updateSocial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateSocial(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Social eligibility information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updateOccupation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updateOccupation(userId, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Occupation information updated',
      });
    } catch (err) {
      next(err);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.updatePreferences(userId, req.body.categories);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
        message: 'Benefit preferences updated',
      });
    } catch (err) {
      next(err);
    }
  };

  getCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const completion = await this.service.calculateCompletion(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: completion,
      });
    } catch (err) {
      next(err);
    }
  };

  getConsents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const consents = await this.service.getConsents(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: consents,
      });
    } catch (err) {
      next(err);
    }
  };

  updateConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const consentType = req.params['type'] as ConsentType;
      const granted = Boolean(req.body.granted);
      const consent = await this.service.updateConsent(userId, consentType, granted);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: consent,
        message: 'Consent preference updated',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const profileController = new ProfileController();
