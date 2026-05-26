import { LeadRepository } from '../repositories/LeadRepository';
import { DuplicateLeadError } from '../errors';

/**
 * Enforces phone-number uniqueness for referrals.
 *
 * Business rule: a phone can only have one active lead per job at a time.
 * Re-referral to the same job is allowed once the previous lead is REJECTED.
 * Re-referral to a different job is always allowed.
 */
export class UniquenessService {
  constructor(private readonly leadRepo: LeadRepository) {}

  /**
   * Throws DuplicateLeadError if an active (non-rejected) lead already exists
   * for this phone + job combination.
   */
  async assertUnique(phone: string, jobId: number): Promise<void> {
    const existing = await this.leadRepo.findActiveByPhoneAndJob(phone, jobId);
    if (existing) {
      throw new DuplicateLeadError(phone);
    }
  }
}
