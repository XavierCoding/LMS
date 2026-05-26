import { query } from '../db/client';

/**
 * Assigns incoming leads to TCs using a round-robin strategy.
 *
 * Each call returns the next TC in rotation, cycling through the active TC list.
 */
export class AssignmentService {
  private cursor = 0;
  private tcIdsCache: number[] | null = null;

  private async getActiveTCIds(): Promise<number[]> {
    if (this.tcIdsCache) return this.tcIdsCache;
    const rows = await query<{ id: number }>(
      `SELECT id FROM users WHERE role = 'tc' AND is_active = true ORDER BY id`
    );
    this.tcIdsCache = rows.map((r) => r.id);
    return this.tcIdsCache;
  }

  /**
   * Returns the next TC user_id in round-robin order.
   */
  async nextTC(): Promise<number> {
    const tcIds = await this.getActiveTCIds();
    if (tcIds.length === 0) {
      throw new Error('No active TCs available for assignment');
    }
    const tcId = tcIds[this.cursor % tcIds.length];
    this.cursor++;
    return tcId;
  }
}
