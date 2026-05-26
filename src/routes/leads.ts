import { Router, Request, Response, NextFunction } from 'express';
import { LeadRepository } from '../repositories/LeadRepository';

export function createLeadsRouter(leadRepo: LeadRepository): Router {
  const router = Router();

  /**
   * GET /api/leads?status=NEW&limit=50
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
      const leads = await leadRepo.list(status, limit);
      res.json({ count: leads.length, leads });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
