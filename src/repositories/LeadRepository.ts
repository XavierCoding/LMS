import { query } from '../db/client';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  city: string;
  job_id: number;
  status: string;
  assigned_tc_id: number | null;
  referred_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  city: string;
  job_id: number;
  assigned_tc_id: number;
  referred_by: number;
}

export class LeadRepository {
  /**
   * Find a lead by phone number.
   * Used by UniquenessService to check for duplicates before inserting.
   */
  async findByPhone(phone: string): Promise<Lead | null> {
    const rows = await query<Lead>(
      `SELECT * FROM leads WHERE phone = $1 LIMIT 1`,
      [phone]
    );
    return rows[0] || null;
  }

  /**
   * Insert a new lead.
   */
  async create(input: CreateLeadInput): Promise<Lead> {
    const rows = await query<Lead>(
      `INSERT INTO leads (name, phone, city, job_id, assigned_tc_id, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.name, input.phone, input.city, input.job_id, input.assigned_tc_id, input.referred_by]
    );
    return rows[0];
  }

  /**
   * List leads, optionally filtered by status.
   */
  async list(status?: string, limit: number = 100): Promise<Lead[]> {
    if (status) {
      return query<Lead>(
        `SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
        [status, limit]
      );
    }
    return query<Lead>(
      `SELECT * FROM leads ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
  }

  /**
   * Verify a job_id exists and is active.
   */
  async jobExists(jobId: number): Promise<boolean> {
    const rows = await query<{ id: number }>(
      `SELECT id FROM jobs WHERE id = $1 AND is_active = true`,
      [jobId]
    );
    return rows.length > 0;
  }
}
