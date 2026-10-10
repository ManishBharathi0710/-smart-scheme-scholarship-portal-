import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  fullProfileUpdateSchema,
  updatePersonalSchema,
  updateLocationSchema,
  updateEducationSchema,
  updateFinancialSchema,
  updateSocialSchema,
  updateOccupationSchema,
  updatePreferencesSchema,
} from './profile.schemas.js';

export const profileRouter = Router();

// All profile endpoints strictly require authentication
profileRouter.use(authenticate);

profileRouter.get('/', profileController.getProfile);
profileRouter.put(
  '/',
  validateRequest({ body: fullProfileUpdateSchema }),
  profileController.updateFullProfile,
);
profileRouter.get('/completion', profileController.getCompletion);

profileRouter.patch(
  '/personal',
  validateRequest({ body: updatePersonalSchema }),
  profileController.updatePersonal,
);

profileRouter.patch(
  '/location',
  validateRequest({ body: updateLocationSchema }),
  profileController.updateLocation,
);

profileRouter.patch(
  '/education',
  validateRequest({ body: updateEducationSchema }),
  profileController.updateEducation,
);

profileRouter.patch(
  '/financial',
  validateRequest({ body: updateFinancialSchema }),
  profileController.updateFinancial,
);

profileRouter.patch(
  '/social',
  validateRequest({ body: updateSocialSchema }),
  profileController.updateSocial,
);

profileRouter.patch(
  '/occupation',
  validateRequest({ body: updateOccupationSchema }),
  profileController.updateOccupation,
);

profileRouter.patch(
  '/preferences',
  validateRequest({ body: updatePreferencesSchema }),
  profileController.updatePreferences,
);

// Consents Router
export const consentRouter = Router();
consentRouter.use(authenticate);
consentRouter.get('/', profileController.getConsents);
consentRouter.patch('/:type', profileController.updateConsent);
