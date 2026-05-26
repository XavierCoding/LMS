# LMS — Lead Management System

Internal recruitment ops tool. Vahan Leaders, Team Leaders, and Telecallers (TCs)
use this to manage referred candidates through the hiring funnel.

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL
- Zod for validation
- Jest for tests

## Setup

You'll need Node 18+ and a local PostgreSQL instance running.

```bash
# 1. Install dependencies
npm install

# 2. Create a database
createdb lms

# 3. Copy env file and adjust DATABASE_URL if needed
cp .env.example .env

# 4. Run migrations
npm run migrate

# 5. Seed sample data (8 users, 6 jobs, 50 leads)
npm run seed

# 6. Start the dev server
npm run dev
```

Server runs on `http://localhost:3000`.

## Existing functionality

### POST `/api/referrals`

Creates a single referral. Goes through validation, job verification, phone
uniqueness check, TC assignment, and insertion.

```bash
curl -X POST http://localhost:3000/api/referrals \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "name": "Ramesh Kumar",
    "phone": "9999988888",
    "city": "Bengaluru",
    "job_id": 1
  }'
```

### GET `/api/leads?status=NEW&limit=50`

Lists leads, optionally filtered by status.

## Project layout

```
src/
├── routes/         HTTP layer
├── services/       Business logic (Referral, Uniqueness, Assignment)
├── repositories/   DB access
├── validators/     Zod schemas
├── db/             Migrations, seed, pg client
└── errors.ts       Typed error classes
```

The single-referral flow is the canonical reference for how a referral is created.
Start there.

## Roles

The system has three roles (stored on `users.role`):
- `admin` — Vahan Leader (top tier)
- `team_leader` — manages a group of TCs
- `tc` — telecaller (bottom tier, the people actually calling leads)
