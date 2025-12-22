# Candidate Selection System - Testing Guide

## Overview

This document outlines how to test the new candidate-based cupid matching system where:

- Each cupid is assigned ONE candidate
- System shows top 5 compatible matches for that candidate
- Cupid reviews questionnaires side-by-side and selects the best match
- Selection creates a bidirectional match

## System Architecture

### Database Schema

```prisma
model CupidAssignment {
  id                String   @id @default(cuid())
  cupidUserId       String   // Cupid making the selection
  candidateId       String   // The one person being matched
  potentialMatches  Json     // Array of { userId, score } - top 5 options
  selectedMatchId   String?  // Selected match from potential matches
  selectionReason   String?  // Optional reasoning
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### API Endpoints

#### 1. GET /api/cupid/dashboard

Returns cupid's assigned candidates and stats.

**Response:**

```json
{
  "cupidId": "user123",
  "cupidName": "John Doe",
  "totalAssigned": 3,
  "reviewed": 1,
  "pending": 2,
  "pendingAssignments": [
    {
      "assignmentId": "assignment123",
      "cupidUserId": "user123",
      "candidate": {
        "userId": "candidate1",
        "firstName": "Alice",
        "age": 21,
        "summary": "AI-generated profile summary",
        "keyTraits": ["adventurous", "thoughtful"],
        "lookingFor": "someone who values...",
        "highlights": ["Looking for: Serious relationship"]
      },
      "potentialMatches": [
        {
          "userId": "match1",
          "score": 85,
          "profile": {
            /* same structure as candidate */
          }
        }
        // ... 4 more matches
      ],
      "selectedMatchId": null,
      "selectionReason": null
    }
  ]
}
```

#### 2. GET /api/questionnaire/view?userId=xxx

Allows cupids to view questionnaire responses for assigned candidates/matches.

**Authorization:** Cupid must have an assignment containing this userId (either as candidate or potential match)

**Response:**

```json
{
  "responses": {
    "Q1": "Computer Science",
    "Q2": ["hiking", "reading"],
    "Q3": { "minAge": 20, "maxAge": 25 }
  },
  "importance": {
    "Q1": 5,
    "Q2": 3
  }
}
```

#### 3. POST /api/cupid/decide

Submit cupid's match selection.

**Request:**

```json
{
  "assignmentId": "assignment123",
  "selectedMatchId": "match1",
  "reason": "Optional reasoning for selection"
}
```

**Validation:**

- `selectedMatchId` must be in the assignment's `potentialMatches` array
- Assignment must not already have a selection

**Response:**

```json
{
  "success": true,
  "assignmentId": "assignment123",
  "selectedMatchId": "match1"
}
```

## Testing Workflow

### Prerequisites

1. Database with test users who have completed questionnaires
2. At least one approved cupid
3. Run assignment algorithm: `assignCandidatesToCupids(batchId, cupidIds)`

### Step 1: Verify Assignments Created

```sql
SELECT
  ca.id,
  ca."candidateId",
  u."firstName" as candidate_name,
  jsonb_array_length(ca."potentialMatches") as match_count,
  ca."selectedMatchId"
FROM "CupidAssignment" ca
JOIN "User" u ON ca."candidateId" = u.id
WHERE ca."cupidUserId" = 'YOUR_CUPID_ID'
ORDER BY ca."createdAt" DESC;
```

**Expected:**

- Each assignment has exactly 1 `candidateId`
- `potentialMatches` is JSON array with 5 objects: `[{userId, score}, ...]`
- `selectedMatchId` is NULL (pending)

### Step 2: Test Dashboard API

```bash
# Login as cupid first
curl http://localhost:3000/api/cupid/dashboard \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Verify:**

- `totalAssigned` matches database count
- `pending` = assignments where `selectedMatchId IS NULL`
- `reviewed` = assignments where `selectedMatchId IS NOT NULL`
- Each `pendingAssignments` has exactly 5 `potentialMatches`
- Profiles have AI-generated summaries

### Step 3: Test Questionnaire View API

```bash
# View candidate's questionnaire
curl "http://localhost:3000/api/questionnaire/view?userId=CANDIDATE_ID" \
  -H "Cookie: next-auth.session-token=YOUR_CUPID_SESSION"

# View potential match's questionnaire
curl "http://localhost:3000/api/questionnaire/view?userId=MATCH_ID" \
  -H "Cookie: next-auth.session-token=YOUR_CUPID_SESSION"
```

**Verify:**

- Returns decrypted `responses` object
- Returns `importance` object (or null if not set)
- Returns 403 if cupid doesn't have assignment for this user
- Returns 404 if user hasn't filled questionnaire

### Step 4: Test UI - Matching Portal

Navigate to `/cupid-dashboard/matching-portal`

**UI Features to Test:**

1. **Split-Screen Layout**
   - Left panel: Candidate questionnaire
   - Right panel: Current match questionnaire
   - Both scrollable independently

2. **Navigation**
   - Arrow buttons to browse through 5 potential matches
   - "Next Candidate" / "Previous Candidate" buttons work
   - Current position displayed (e.g., "Match 2 of 5")

3. **Questionnaire Display**
   - All sections render correctly
   - Sticky section headers
   - Questions show response + importance rating
   - Different question types format properly:
     - Single choice: text
     - Multi choice: comma-separated
     - Age range: "20 - 25 years old"
     - Text/textarea: full text

4. **Score Toggle**
   - "Show Scores" / "Hide Scores" button works
   - Scores hidden by default
   - Compatibility percentage displayed correctly

5. **Selection Mechanism**
   - "Select This Match" button on match panel
   - Selected match gets pink border/background
   - "Undo Selection" button appears
   - Can change selection to different match

6. **Confirmation**
   - "Confirm Selection" button disabled until match selected
   - Shows selected match's name when enabled
   - Optional reasoning textarea works
   - Loading state during submission

### Step 5: Test Selection Submission

Using the UI or API directly:

```bash
curl -X POST http://localhost:3000/api/cupid/decide \
  -H "Cookie: next-auth.session-token=YOUR_CUPID_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment123",
    "selectedMatchId": "match1",
    "reason": "Great compatibility on values and lifestyle"
  }'
```

**Verify:**

1. Assignment updated in database:

```sql
SELECT "selectedMatchId", "selectionReason", "updatedAt"
FROM "CupidAssignment"
WHERE id = 'assignment123';
```

2. Dashboard stats update:
   - `pending` decreases by 1
   - `reviewed` increases by 1
   - Assignment removed from `pendingAssignments`

3. UI updates without page refresh

### Step 6: Test Match Creation

After all cupids make selections, run:

```typescript
await createCupidSelectedMatches(batchId);
```

**Verify:**

```sql
SELECT
  m.id,
  u1."firstName" as user1_name,
  u2."firstName" as user2_name,
  m.score,
  m."matchedBy"
FROM "Match" m
JOIN "User" u1 ON m."user1Id" = u1.id
JOIN "User" u2 ON m."user2Id" = u2.id
WHERE m.batch = 'YOUR_BATCH'
  AND m."matchedBy" = 'cupid-selection'
ORDER BY m."createdAt" DESC;
```

**Expected:**

- Bidirectional matches created (if both A→B and B→A selected)
- `matchedBy` = 'cupid-selection'
- `score` from compatibility algorithm
- Both users can see match in dashboard

## Edge Cases to Test

### 1. Candidate with < 5 Compatible Matches

**Setup:** User with very restrictive preferences
**Expected:** Skipped during assignment (warning logged)

### 2. Multiple Cupids Assigned Same Candidate

**Setup:** More candidates than cupids
**Expected:** Round-robin distribution, same candidate can have multiple cupids

### 3. Cupid Assigned Multiple Candidates

**Setup:** More cupids than candidates  
**Expected:** Some cupids get 0 assignments, others get multiple
**UI:** Navigation between candidates works smoothly

### 4. Selection Validation Errors

**Test cases:**

- Select userId not in potentialMatches → 400 error
- Re-submit for completed assignment → 400 error
- Missing assignmentId → 400 error

### 5. Authorization Checks

**Test cases:**

- Non-cupid tries to access dashboard → 403
- Unapproved cupid tries to access → 403
- Cupid tries to view questionnaire for unassigned user → 403

### 6. Questionnaire Data Issues

**Test cases:**

- User hasn't completed questionnaire → Show "No data available"
- Importance ratings missing (old data) → Display without importance
- Response for deleted question → Skip gracefully

## Performance Considerations

### Assignment Algorithm

- **Time Complexity:** O(N × M) where N = candidates, M = cupids
- **Expected Runtime:** ~1-2 seconds for 100 candidates
- **Database Queries:** Batched profile fetches (1 query per 100 users)

### Dashboard Load

- **Queries:** 2 (cupid profile + assignments with profiles)
- **AI Summary Generation:** Cached in profile, regenerate only if stale
- **Expected Load Time:** < 1 second

### Questionnaire View

- **Queries:** 2 (authorization check + response fetch)
- **Decryption:** < 10ms per questionnaire
- **Caching:** Consider Redis for frequently accessed responses

## Troubleshooting

### Dashboard Shows "No Assignments"

1. Check cupid is approved: `SELECT approved FROM "CupidProfile" WHERE "userId" = 'XXX'`
2. Check assignments exist: `SELECT COUNT(*) FROM "CupidAssignment" WHERE "cupidUserId" = 'XXX'`
3. Check batch matches: Assignments created for specific batch

### Questionnaire Won't Load

1. Check network tab for 403/404 errors
2. Verify user has completed questionnaire
3. Check cupid has assignment for that user
4. Verify decryption keys in environment

### Selection Fails

1. Check `selectedMatchId` is in `potentialMatches` array
2. Verify assignment isn't already completed
3. Check cupid session is valid
4. Look for validation errors in API response

### UI Not Updating After Selection

1. Check `fetchDashboard()` called after submission
2. Verify state updates in React DevTools
3. Check for console errors
4. Ensure no network failures

## Success Metrics

✅ **Assignment Phase:**

- 95%+ of candidates get assigned (those with 5+ matches)
- Even distribution across cupids
- No duplicate assignments (same candidate to same cupid twice)

✅ **Review Phase:**

- All questionnaire data loads correctly
- < 2 second load time for questionnaires
- No authorization errors for valid assignments

✅ **Selection Phase:**

- 100% of submissions succeed (if valid)
- Dashboard updates immediately
- Correct stats tracking

✅ **Match Creation:**

- All bidirectional selections create matches
- No duplicate matches
- Correct `matchedBy` attribution

## Next Steps After Testing

1. **Monitor Logs:** Track selection patterns, review times
2. **Gather Feedback:** Survey cupids on UI/UX
3. **Analyze Data:** Selection reasoning, compatibility vs. cupid choice
4. **Optimize:** Identify bottlenecks, improve performance
5. **Iterate:** Refine algorithm based on match success rates

---

**Last Updated:** December 21, 2024  
**System Status:** ✅ Ready for Testing
