# UBCupids Matching System - Comprehensive Testing Guide

This guide provides step-by-step instructions for testing the matching system end-to-end.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Status](#database-status)
3. [Phase 1: Run the Matching Algorithm](#phase-1-run-the-matching-algorithm)
4. [Phase 2: Assign Cupid Pairs](#phase-2-assign-cupid-pairs)
5. [Phase 3: Test Cupid Dashboard](#phase-3-test-cupid-dashboard)
6. [Phase 4: Cupid Decision Making](#phase-4-cupid-decision-making)
7. [Phase 5: Match Reveal](#phase-5-match-reveal)
8. [Phase 6: User Match Display](#phase-6-user-match-display)
9. [Edge Cases to Verify](#edge-cases-to-verify)
10. [Expected Results](#expected-results)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Environment Variables Required

Ensure these are set in your `.env` file:

```env
DATABASE_URL=your_neon_postgres_url
ENCRYPTION_KEY=your_64_char_hex_key
NEXTAUTH_SECRET=your_nextauth_secret
HUGGINGFACE_API_KEY=your_hf_api_key      # For text embeddings AND profile summaries (both FREE!)
```

**Note:** Only HuggingFace API key is needed - it's completely FREE! Get yours at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### Start the Development Server

```bash
npm run dev
```

Server should be running at `http://localhost:3000`

---

## Database Status

### Verify Test Data

Run the stats check to confirm data is seeded:

```bash
npx tsx scripts/check-db-stats.ts
```

**Expected Output:**

```
📊 Database Statistics:
  Total Users: 500
  Users Being Matched: 250
  Cupids: 250
  Approved Cupids: 250
  Questionnaire Responses: 250
  Submitted Responses: 250
```

### Test User Credentials

All test users have the same password:

- **Password:** `TestPassword123!`
- **Email format:** `firstname.lastnameN@student.ubc.ca`

Example users:

- `james.smith0@student.ubc.ca` (user being matched)
- `mary.johnson50@student.ubc.ca` (user being matched)
- `john.brown1000@student.ubc.ca` (cupid)

---

## Phase 1: Run the Matching Algorithm

### Trigger via API

Using cURL, Postman, or your browser's dev tools:

```bash
# POST request to trigger matching
curl -X POST http://localhost:3000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{"action": "run_matching", "batchNumber": 1}'
```

**Note:** In production, this endpoint requires admin authentication. For testing, you may need to temporarily disable auth or create an admin session.

### Alternative: Direct Script Execution

```bash
npx tsx -e "
import { runMatchingAlgorithm } from './lib/matching/algorithm';
runMatchingAlgorithm(1).then(r => console.log(r));
"
```

### What to Expect

- **Duration:** 30-60 seconds for 250 users (depending on API rate limits)
- **Success Response:**

```json
{
  "success": true,
  "matchesCreated": 375, // ~250 * 1.5 average matches per user
  "scoresCalculated": 62500 // 250 * 250 pairs (minus self-pairs)
}
```

### Verify in Database

```sql
-- Check compatibility scores
SELECT COUNT(*) FROM "CompatibilityScore";

-- Check Match records (should be 0 - they're created after cupid decisions)
SELECT COUNT(*) FROM "Match";
```

---

## Phase 2: Assign Cupid Pairs

### Trigger Assignment

```bash
curl -X POST http://localhost:3000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{"action": "assign_cupids", "batchNumber": 1}'
```

### What to Expect

- Each compatible pair is assigned to an available cupid
- Cupids receive 3-5 pairs each (configurable)
- Assignment balances workload across cupids

**Success Response:**

```json
{
  "success": true,
  "pairsAssigned": 375,
  "cupidsUtilized": 100
}
```

### Verify in Database

```sql
-- Check cupid assignments
SELECT
  cupid."cupidDisplayName",
  COUNT(*) as pairs_assigned
FROM "CupidAssignment" ca
JOIN "User" cupid ON ca."cupidId" = cupid.id
GROUP BY cupid.id
ORDER BY pairs_assigned DESC
LIMIT 10;
```

---

## Phase 3: Test Cupid Dashboard

### Login as a Cupid

1. Navigate to `http://localhost:3000/login`
2. Login with a cupid account:
   - Email: `james.smith1000@student.ubc.ca`
   - Password: `TestPassword123!`

3. Navigate to Cupid Dashboard: `http://localhost:3000/cupid-dashboard`

### What to Verify

#### Dashboard Overview

- [ ] Shows "Matching Portal" link
- [ ] Displays stats: assigned pairs, pending decisions, approved/rejected counts
- [ ] Leaderboard shows other cupids' activity

#### Matching Portal (`/cupid-dashboard/matching-portal`)

- [ ] Lists all assigned pairs for this cupid
- [ ] Each pair shows User A vs User B
- [ ] Split-screen comparison view works
- [ ] Profile summaries are displayed (AI-generated)
- [ ] Compatibility score percentage shown

### API Endpoint Check

```bash
# Get cupid dashboard data (requires auth)
curl http://localhost:3000/api/cupid/dashboard \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response:**

```json
{
  "stats": {
    "totalAssigned": 5,
    "pending": 5,
    "approved": 0,
    "rejected": 0
  },
  "pairs": [
    {
      "id": "assignment_id",
      "user1Summary": "AI-generated summary...",
      "user2Summary": "AI-generated summary...",
      "compatibilityScore": 0.82,
      "status": "pending"
    }
  ]
}
```

---

## Phase 4: Cupid Decision Making

### Make Decisions in UI

1. In the Matching Portal, click on a pair
2. Review both profiles in split-screen view
3. Click "Approve Match" or "Reject Match"
4. Add optional notes

### API Decision Endpoint

```bash
curl -X POST http://localhost:3000/api/cupid/decide \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "assignmentId": "clxxxxxx",
    "decision": "approve",
    "notes": "Great compatibility on communication styles"
  }'
```

### What to Verify

- [ ] Decision updates pair status to "approved" or "rejected"
- [ ] Cupid stats update (pending decreases, approved/rejected increases)
- [ ] Cannot make decision on already-decided pair
- [ ] Notes are saved with the decision

### Verify in Database

```sql
-- Check decisions
SELECT
  status,
  COUNT(*) as count
FROM "CupidAssignment"
GROUP BY status;

-- Check cupid notes
SELECT
  "cupidNotes",
  status
FROM "CupidAssignment"
WHERE "cupidNotes" IS NOT NULL
LIMIT 5;
```

---

## Phase 5: Match Reveal

### Trigger Reveal

```bash
curl -X POST http://localhost:3000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{"action": "reveal_matches", "batchNumber": 1}'
```

### What Happens

1. All approved cupid assignments become Match records
2. `revealedAt` timestamp is set
3. Users can now see their matches

**Success Response:**

```json
{
  "success": true,
  "matchesRevealed": 280,
  "usersNotified": 450
}
```

### Verify in Database

```sql
-- Check revealed matches
SELECT COUNT(*) as revealed_matches
FROM "Match"
WHERE "revealedAt" IS NOT NULL;

-- Check match distribution
SELECT
  u."firstName",
  COUNT(*) as match_count
FROM "Match" m
JOIN "User" u ON m."userId" = u.id
GROUP BY u.id
HAVING COUNT(*) > 1
LIMIT 10;
```

---

## Phase 6: User Match Display

### Login as a Matched User

1. Navigate to `http://localhost:3000/login`
2. Login with a regular user:
   - Email: `james.smith0@student.ubc.ca`
   - Password: `TestPassword123!`

3. Navigate to Matches page: `http://localhost:3000/matches`

### What to Verify

#### Matches Page

- [ ] Shows list of matched users
- [ ] Displays match's display name
- [ ] Shows compatibility score (if algorithm match)
- [ ] Shows match type badge (algorithm/cupid-sent/cupid-received)
- [ ] Profile pictures display correctly (or placeholder)
- [ ] "View Profile" or similar CTA works

#### Match Details

- [ ] Can view match's basic info
- [ ] Open-ended responses visible (q61, q62, q63)
- [ ] Match's question (q63) displayed as conversation starter
- [ ] Contact/message functionality available

### API Endpoint Check

```bash
curl http://localhost:3000/api/matches \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response:**

```json
{
  "matches": [
    {
      "id": "match_id",
      "matchedUser": {
        "id": "user_id",
        "displayName": "Sarah",
        "major": "Computer Science",
        "interests": "hiking, reading, cooking"
      },
      "matchType": "algorithm",
      "compatibilityScore": 0.85,
      "revealedAt": "2025-02-01T00:00:00.000Z"
    }
  ]
}
```

---

## Edge Cases to Verify

### Gender Filter Logic

Test that incompatible users don't match:

```bash
npx tsx -e "
import { canMatch } from './lib/matching/filters';
import { decryptJSON } from './lib/encryption';

// Man seeking women should NOT match woman seeking women
const result = canMatch(
  { q1: 'man', q3: ['women'] },
  { q1: 'woman', q3: ['women'] }
);
console.log('Should be false:', result);
"
```

### Importance Weighting

Questions marked as "Very Important" (5) should have 1.5x weight in scoring.

### Bidirectional Matching

Verify both users in a match have reciprocal Match records:

```sql
SELECT
  m1."userId" as user1,
  m1."matchedUserId" as user2,
  m2."userId" as user2_reciprocal,
  m2."matchedUserId" as user1_reciprocal
FROM "Match" m1
JOIN "Match" m2 ON m1."userId" = m2."matchedUserId" AND m1."matchedUserId" = m2."userId"
LIMIT 5;
```

### No Self-Matching

```sql
SELECT COUNT(*) as self_matches
FROM "Match"
WHERE "userId" = "matchedUserId";
-- Should be 0
```

### Duplicate Prevention

```sql
SELECT "userId", "matchedUserId", "batchNumber", COUNT(*)
FROM "Match"
GROUP BY "userId", "matchedUserId", "batchNumber"
HAVING COUNT(*) > 1;
-- Should return no rows
```

---

## Expected Results

### After Running Full Pipeline

| Metric               | Expected Range                 |
| -------------------- | ------------------------------ |
| Compatibility Scores | ~62,250 (250×249)              |
| Cupid Assignments    | 200-400 pairs                  |
| Approved Matches     | 150-300 (75-80% approval rate) |
| Average Matches/User | 1-3                            |
| Users with 0 Matches | 10-30 (edge cases)             |

### Compatibility Score Distribution

Most scores should follow a normal distribution:

- 0.3-0.5: Low compatibility (rare matches)
- 0.5-0.7: Moderate compatibility (some matches)
- 0.7-0.9: High compatibility (likely matches)
- 0.9+: Excellent compatibility (top matches)

### Section Weight Verification

Section 3 (What I'm Looking For) should contribute most to scores:

- Section 1: 15%
- Section 2: 30%
- Section 3: 45%
- Section 5: 10%

---

## Troubleshooting

### Common Issues

#### "No questionnaire responses found"

- Verify `QuestionnaireResponse.isSubmitted = true`
- Check encryption is working: `ENCRYPTION_KEY` is set

#### "AI summaries not generating"

- Verify `HUGGINGFACE_API_KEY` is valid
- Check rate limits haven't been exceeded (free tier allows ~1000 requests/hour)
- HuggingFace models may need to "warm up" on first use (can take 20-30 seconds)
- Summaries are cached - regenerate with `generateProfileSummary(userId, true)`
- If model is loading, the system will automatically retry after 20 seconds

#### "Text embeddings failing"

- Verify `HUGGINGFACE_API_KEY` is valid
- HuggingFace has rate limits - may need to wait
- Check network connectivity

#### "No cupids available for assignment"

- Verify cupids have `CupidProfile.approved = true`
- Check cupids haven't reached max assignments

#### "Matches not showing for user"

- Verify `Match.revealedAt` is not null
- Check user has `isBeingMatched = true`
- Verify Match records exist for both directions

### Reset and Re-run

To completely reset and re-test:

```bash
# Clear all matching data (keeps users)
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function reset() {
  await p.match.deleteMany({});
  await p.cupidAssignment.deleteMany({});
  await p.compatibilityScore.deleteMany({});
  await p.textEmbedding.deleteMany({});
  await p.cupidProfileSummary.deleteMany({});
  console.log('Reset complete');
  await p.\$disconnect();
}
reset();
"

# Re-run matching pipeline
curl -X POST http://localhost:3000/api/matches/generate -d '{"action": "run_matching", "batchNumber": 1}'
curl -X POST http://localhost:3000/api/matches/generate -d '{"action": "assign_cupids", "batchNumber": 1}'
# ... make cupid decisions ...
curl -X POST http://localhost:3000/api/matches/generate -d '{"action": "reveal_matches", "batchNumber": 1}'
```

### Logging

Enable verbose logging in matching functions:

```typescript
// In lib/matching/config.ts
export const MATCHING_CONFIG = {
  // ...
  DEBUG: true, // Enable debug logging
};
```

---

## Quick Test Checklist

- [ ] Seeding script ran successfully (250 users, 250 cupids)
- [ ] `run_matching` completed without errors
- [ ] Compatibility scores exist in database
- [ ] `assign_cupids` distributed pairs to cupids
- [ ] Cupid can login and see assigned pairs
- [ ] Cupid can make approve/reject decisions
- [ ] `reveal_matches` created Match records
- [ ] User can login and see their matches
- [ ] Match details display correctly
- [ ] No self-matches or duplicates exist

---

## Test Data Cleanup

When done testing, run the seeding script again to reset:

```bash
npx tsx scripts/seed-test-data.ts
```

This will:

1. Clear all matching data
2. Delete test users
3. Re-create fresh test data

---

## Next Steps

1. **Manual Testing**: Walk through UI as both cupid and user
2. **Load Testing**: Increase to 1000+ users for performance testing
3. **Integration Testing**: Add automated tests for API endpoints
4. **Production Prep**: Enable proper authentication on admin endpoints
