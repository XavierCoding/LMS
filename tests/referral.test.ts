import { ReferralService } from '../src/services/ReferralService';
import { LeadRepository } from '../src/repositories/LeadRepository';
import { UniquenessService } from '../src/services/UniquenessService';
import { AssignmentService } from '../src/services/AssignmentService';
import { DuplicateLeadError, ValidationError, NotFoundError } from '../src/errors';

// NOTE: This test uses mocked repos. There are no integration tests against
// a real DB yet. The interview candidate is expected to add tests for their
// bulk upload feature in whatever style they prefer.

describe('ReferralService.createReferral', () => {
  let leadRepo: jest.Mocked<LeadRepository>;
  let uniquenessService: jest.Mocked<UniquenessService>;
  let assignmentService: jest.Mocked<AssignmentService>;
  let service: ReferralService;

  beforeEach(() => {
    leadRepo = {
      findByPhone: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      jobExists: jest.fn().mockResolvedValue(true),
    } as any;

    uniquenessService = {
      assertUnique: jest.fn().mockResolvedValue(undefined), // (phone, jobId)
    } as any;

    assignmentService = {
      nextTC: jest.fn().mockResolvedValue(4),
    } as any;

    service = new ReferralService(leadRepo, uniquenessService, assignmentService);
  });

  const validInput = {
    name: 'Test User',
    phone: '9876543299',
    city: 'Bengaluru',
    job_id: 1,
  };

  it('creates a referral with valid input', async () => {
    leadRepo.create.mockResolvedValue({ id: 100 } as any);
    const result = await service.createReferral(validInput, 1);
    expect(result.success).toBe(true);
    expect(leadRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '9876543299', assigned_tc_id: 4 })
    );
  });

  it('rejects invalid phone numbers', async () => {
    await expect(
      service.createReferral({ ...validInput, phone: '123' }, 1)
    ).rejects.toThrow(ValidationError);
  });

  it('rejects when job does not exist', async () => {
    leadRepo.jobExists.mockResolvedValue(false);
    await expect(service.createReferral(validInput, 1)).rejects.toThrow(NotFoundError);
  });

  it('rejects duplicate phone for the same job', async () => {
    uniquenessService.assertUnique.mockRejectedValue(new DuplicateLeadError('9876543299'));
    await expect(service.createReferral(validInput, 1)).rejects.toThrow(DuplicateLeadError);
  });

  it('passes uniqueness check for same phone with a different job', async () => {
    uniquenessService.assertUnique.mockResolvedValue(undefined);
    leadRepo.create.mockResolvedValue({ id: 101 } as any);
    const result = await service.createReferral({ ...validInput, job_id: 2 }, 1);
    expect(result.success).toBe(true);
    expect(uniquenessService.assertUnique).toHaveBeenCalledWith('9876543299', 2);
  });
});
