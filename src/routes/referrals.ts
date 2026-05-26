import { Router, Request, Response, NextFunction } from 'express';
import { ReferralService } from '../services/ReferralService';

export function createReferralRouter(referralService: ReferralService): Router {
  const router = Router();

  /**
   * POST /api/referrals
   * Body: { name, phone, city, job_id }
   * Header: x-user-id (the user submitting the referral)
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referredBy = parseInt(req.header('x-user-id') || '0', 10);
      if (!referredBy) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'x-user-id header required' },
        });
      }

      const result = await referralService.createReferral(req.body, referredBy);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
