-- Users: Vahan Leaders (admin), Team Leaders, Team Members (TC)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'team_leader', 'tc')),
  team_leader_id INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs: open positions a lead can be referred to
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads: referred candidates
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  city VARCHAR(50) NOT NULL,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  status VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'CONTACTED', 'INTERESTED', 'REJECTED', 'CONVERTED')),
  assigned_tc_id INTEGER REFERENCES users(id),
  referred_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone uniqueness is enforced at application layer (see UniquenessService).
-- NOTE: No DB-level unique constraint on phone — this is intentional in the
-- current design because the same phone may be referred against different jobs
-- over time. Uniqueness rules live in business logic.

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_tc ON leads(assigned_tc_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
