import { LeadRepository, Lead } from '../repositories/LeadRepository';
import { UniquenessService } from './UniquenessService';
import { AssignmentService } from './AssignmentService';
import { referralSchema, ReferralInput } from '../validators/referralSchema';
import { ValidationError, NotFoundError } from '../errors';

export interface CreateReferralResult {
  success: true;
  lead: Lead;
}

/**
 * Handles the end-to-end flow of creating a single referral:
 *   1. Validate input
 *   2. Verify job exists
 *   3. Check phone uniqueness
 *   4. Assign to a TC (round-robin)
 *   5. Insert the lead
 *
 * This service is the canonical reference for how a referral is created.
 * Any new entry point (e.g. bulk upload) should go through the same business rules.
 */
export class ReferralService {
  constructor(
    private readonly leadRepo: LeadRepository,
    private readonly uniquenessService: UniquenessService,
    private readonly assignmentService: AssignmentService
  ) {}

  async createReferral(
    rawInput: unknown,
    referredBy: number
  ): Promise<CreateReferralResult> {
    // 1. Validate
    const parsed = referralSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ValidationError('Invalid referral input', parsed.error.flatten());
    }
    const input: ReferralInput = parsed.data;

    // 2. Verify job exists
    const jobExists = await this.leadRepo.jobExists(input.job_id);
    if (!jobExists) {
      throw new NotFoundError(`Job with id ${input.job_id}`);
    }

    // 3. Uniqueness check — scoped to phone + job so same phone can be referred to other jobs
    await this.uniquenessService.assertUnique(input.phone, input.job_id);

    // 4. Assign TC
    const assignedTcId = await this.assignmentService.nextTC();

    // 5. Insert
    const lead = await this.leadRepo.create({
      name: input.name,
      phone: input.phone,
      city: input.city,
      job_id: input.job_id,
      assigned_tc_id: assignedTcId,
      referred_by: referredBy,
    });

    return { success: true, lead };
  }
}
