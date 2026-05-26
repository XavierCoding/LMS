import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { LeadRepository } from './repositories/LeadRepository';
import { UniquenessService } from './services/UniquenessService';
import { AssignmentService } from './services/AssignmentService';
import { ReferralService } from './services/ReferralService';
import { createReferralRouter } from './routes/referrals';
import { createLeadsRouter } from './routes/leads';
import { AppError } from './errors';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));

// Dependency wiring
const leadRepo = new LeadRepository();
const uniquenessService = new UniquenessService(leadRepo);
const assignmentService = new AssignmentService();
const referralService = new ReferralService(leadRepo, uniquenessService, assignmentService);

// Routes
app.use('/api/referrals', createReferralRouter(referralService));
app.use('/api/leads', createLeadsRouter(leadRepo));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...((err as any).details && { details: (err as any).details }),
      },
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`LMS server listening on http://localhost:${PORT}`);
});
