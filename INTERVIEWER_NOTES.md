# INTERVIEWER NOTES — do not share with candidate

## The problem statement to give

> "We have a single-referral endpoint working. Sales ops wants to upload up to
> 100 referrals at a time via a single API call. Add `POST /api/referrals/bulk`
> that accepts a JSON array of referrals, runs them through the same business
> rules as single referral, and returns per-row success/failure.
>
> You won't have time to finish. Walk me through your approach — what you'd
> read, what you'd prompt AI for, what decisions you'd make yourself."

Hand him the repo 24 hours before. Tell him to get it running and skim the code.
In the interview, he should be familiar with the layout.

## The three baked-in issues

These exist in the current code. A strong SDE2 spots at least one and ideally
all three. A weak one copies them into bulk upload without thinking.

### Issue 1: N+1 query in uniqueness check
**File:** `src/services/UniquenessService.ts`, `src/repositories/LeadRepository.ts`

`UniquenessService.assertUnique(phone)` and `LeadRepository.findByPhone(phone)`
both take a single phone. Fine for one referral. Catastrophic for bulk — 100
sequential DB roundtrips.

**Senior signal:** he adds `findByPhones(phones: string[])` returning a Set, or
uses `WHERE phone = ANY($1::text[])`, OR he asks "should I batch this?" before
coding. Bonus: he also dedupes *within the batch* before hitting the DB.

**Junior signal:** he loops `await assertUnique(row.phone)` over the array.
AI will happily generate this. Watch if he questions it.

### Issue 2: In-memory round-robin cursor
**File:** `src/services/AssignmentService.ts`

`cursor` is an instance field. Resets on server restart. Broken across multiple
server instances. Race condition under parallel requests.

**Senior signal:** he notices and either (a) stores assignment state in DB,
(b) uses `ORDER BY (SELECT COUNT(*) FROM leads WHERE assigned_tc_id = u.id)`
for least-loaded assignment, or (c) explicitly flags it: "this won't scale,
out of scope for now, I'd fix it separately."

**Junior signal:** doesn't notice, or notices and ignores.

### Issue 3: No transaction around the create flow
**File:** `src/services/ReferralService.ts`

Validate → check uniqueness → assign → insert. Each step is its own statement.
Two concurrent requests with the same phone can both pass the uniqueness check
before either inserts (TOCTOU race). For bulk this gets worse — within one
request you can have duplicates inserted if not careful.

**Senior signal:** wraps the batch in a single transaction, OR notes "the
uniqueness check has a race condition, ideally we'd use a unique constraint
and catch the error, but the schema doesn't have one — I'd raise that as a
follow-up." Some seniors will spot the missing DB unique constraint and
suggest adding it.

**Junior signal:** just copies the pattern without thinking about concurrency.

## Scoring rubric (5 points)

1. **Exploration before coding** (0-2): Did he read the existing code? Did he
   trace the single-referral flow before prompting AI?

2. **Prompt quality** (0-2): Does he give the AI codebase context (file paths,
   schema, existing patterns) or write generic prompts?

3. **Critical evaluation of AI output** (0-2): Does he read AI suggestions
   carefully? Catch hallucinations? Push back when something looks off?

4. **Spotting issues / asking the right questions** (0-2): Did he catch any of
   the three baked-in issues? Did he ask about transaction boundaries, error
   semantics, partial success, batch limits?

5. **Decomposition & decisions kept in his head** (0-2): Did he break the
   feature into chunks (validation → uniqueness → insert → response shape)?
   Did he keep architecture decisions out of the AI prompt and make them
   himself?

Total /10. SDE2 hire bar: 7+.

## Red flags (auto-disqualify)

- Pastes "build me bulk upload" into Cursor without reading code
- Accepts AI output without verification
- Can't explain *why* the AI's suggestion is correct
- Treats AI as a magic box
- No mention of testing, edge cases, or correctness verification
- Doesn't notice that AI invented a function/import that doesn't exist (you
  can plant this by suggesting he try a specific prompt and seeing if he
  catches the hallucination)

## Good follow-up questions during the interview

- "What happens if 50 of these 100 phones are duplicates? What does the
  response look like?"
- "If two API calls come in at the same time with the same phone, what
  happens?"
- "How would you verify this works correctly without running it 100 times
  manually?"
- "What if the requirements change to 10,000 rows instead of 100?"
- "Walk me through what your prompt to the AI was, and why."

## What "done" looks like (you don't expect this, but for calibration)

A complete solution would:
- Validate the array length (max 100)
- Validate each row with the same Zod schema (collect errors per row, don't
  throw on first failure)
- Dedupe phones within the batch
- Batch-fetch existing phones in one query (`WHERE phone = ANY($1)`)
- Compute valid rows = (passes validation) AND (phone not duplicate)
- Insert valid rows in a single transaction (or use `INSERT ... VALUES (...), (...), ...`)
- Return: `{ total: 100, succeeded: 73, failed: 27, results: [{row: 0, success: true, lead_id: 123}, {row: 1, success: false, error: {code, message}}, ...] }`
