import { LeadRepository } from '../repositories/LeadRepository';
import { DuplicateLeadError } from '../errors';

/**
 * Enforces phone-number uniqueness for referrals.
 *
 * Business rule: a phone number can only have one ACTIVE lead at a time.
 * If a lead with the same phone exists (in any status), the new referral is rejected.
 */
export class UniquenessService {
  constructor(private readonly leadRepo: LeadRepository) {}

  /**
   * Throws DuplicateLeadError if a lead with this phone already exists.
   */
  async assertUnique(phone: string): Promise<void> {
    const existing = await this.leadRepo.findByPhone(phone);
    if (existing) {
      throw new DuplicateLeadError(phone);
    }
  }
}
