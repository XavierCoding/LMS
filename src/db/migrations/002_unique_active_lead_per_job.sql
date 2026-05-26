-- Enforce uniqueness at DB level: one active (non-rejected) lead per phone+job.
-- This closes the race condition where two concurrent requests both pass the
-- app-layer assertUnique check before either has inserted.
--
-- REJECTED leads are excluded so re-referral to the same job is allowed after rejection.

-- up:
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_active_per_job
  ON leads(phone, job_id)
  WHERE status != 'REJECTED';

-- down:
-- DROP INDEX IF EXISTS idx_leads_unique_active_per_job;
