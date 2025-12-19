# Matching Implementation Clarifications

**Date:** December 18, 2025  
**Status:** Final - Ready for Implementation

## Overview

This document clarifies the final specifications for the matching system implementation based on the Matching_Plan.md and questionnaire-config.json.

---

## 1. Questionnaire Structure

### Section Breakdown (from questionnaire-config.json)

- **Section 0** (section-0): Basic Info & Matching Criteria - Q1-Q3 (3 questions)
- **Section 1** (section-1): Icebreakers / Personality - Q4-Q13 (10 questions)
- **Section 2** (section-2): What I'm Like - Q14-Q32 (19 questions)
- **Section 3** (section-3): What I'm Looking For - Q33-Q59 (27 questions)
- **Section 5** (section-5): Open-Ended Text - Q60-Q63 (4 questions)

**Total:** 63 questions (Q1-Q63)

### Section Weighting for Compatibility Scoring

Following the plan's guidance that Section 0 is a hard filter (not scored):

| Section                          | Questions | Weight | Notes                                                              |
| -------------------------------- | --------- | ------ | ------------------------------------------------------------------ |
| Section 1 (Icebreakers)          | Q4-Q13    | 15%    | Effectively all of the 15% weight since Section 0 is hard-filtered |
| Section 2 (What I'm Like)        | Q14-Q32   | 30%    | Personality compatibility                                          |
| Section 3 (What I'm Looking For) | Q33-Q59   | 45%    | Most important—explicit preferences                                |
| Section 5 (Open-Ended Text)      | Q60-Q63   | 10%    | Qualitative insights                                               |

**Implementation Note:** Do NOT merge sections in code. Keep them separate and apply weights during final scoring calculation.

---

## 2. Hard Filters (Section 0 - Not Scored)

### Q1: Gender Identity

- Options: man, woman, non-binary, self-describe (with text input)
- **Hard Filter Rule:** Both people must be in each other's Q3 preferences

### Q2: Sexual/Romantic Orientation

- Options: heterosexual, gay-lesbian, bisexual, pansexual, asexual, questioning, self-describe
- **Not used in matching logic** (informational only)

### Q3: Open to Being Matched With (Multi-select)

- Options: men, women, non-binary, anyone
- **Hard Filter Rule:** Bidirectional check
  - Person A's gender (Q1) must be in Person B's Q3 selections
  - Person B's gender (Q1) must be in Person A's Q3 selections
  - If either person selects "anyone", it satisfies THEIR side only (not bidirectional)

**Example:**

- Person A: gender=man, Q3=[women, non-binary]
- Person B: gender=woman, Q3=[anyone]
- **Result:** ✅ PASS (B's gender is in A's Q3, A's gender is automatically accepted by B's "anyone")

- Person A: gender=man, Q3=[anyone]
- Person B: gender=woman, Q3=[women]
- **Result:** ❌ FAIL (A's gender "man" is NOT in B's Q3 which only has "women")

### Q34: Age Range (Hard Filter)

Located in Section 3, but treated as hard filter:

- Both people's ages must fall within each other's acceptable ranges
- Bidirectional check required

---

## 3. Asymmetric Question Pairs

These pairs compare "What I'm Like" (Section 2) with "What I'm Looking For" (Section 3):

| What I'm Like (Section 2)               | What I'm Looking For (Section 3)                | Comparison Type                         |
| --------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| Q14: My energy level                    | Q33: Looking for energy level                   | Ordinal (3 options)                     |
| Q23: How I handle conflict              | Q40: Want someone who handles conflict by       | Single-choice with "similar" option     |
| Q26: My relationship with alcohol       | Q46: Want someone whose alcohol relationship is | Single-choice with "similar" option     |
| Q30: Love languages I RECEIVE (ranking) | Q41: Love languages I GIVE (ranking)            | Bidirectional ranking comparison        |
| Q32: How I support others               | Q37: How I want to be supported                 | Single-choice with "match-style" option |

### Scoring Logic for Asymmetric Pairs

For each pair:

1. Calculate Person A's satisfaction: Does Person B's trait (Section 2) match Person A's preference (Section 3)?
2. Calculate Person B's satisfaction: Does Person A's trait (Section 2) match Person B's preference (Section 3)?
3. Average the two satisfaction scores

---

## 4. "Similar to Mine" Reference Questions

Questions with "similar" option that reference other questions:

| Question                          | References                   | Type          |
| --------------------------------- | ---------------------------- | ------------- |
| Q33: Energy level preference      | Q14: My energy level         | Ordinal       |
| Q40: Conflict handling preference | Q23: How I handle conflict   | Single-choice |
| Q46: Alcohol preference           | Q26: My alcohol relationship | Single-choice |

**Scoring Logic:**
When Person A selects "similar to mine" for Q33:

1. Look up Person A's answer to Q14
2. Compare that value to Person B's actual Q14 answer
3. Use ordinal/exact-match scoring as appropriate

---

## 5. Importance Ratings

### Coverage

Per the questionnaire config agreement text:

> "You can rank importance for personality and preference questions (basic info and open-ended questions don't have importance ratings)"

**Questions WITH Importance Ratings:**

- Section 1 (Q4-Q13): Icebreakers/Personality ✅
- Section 2 (Q14-Q32): What I'm Like ✅
- Section 3 (Q33-Q59): What I'm Looking For ✅

**Questions WITHOUT Importance Ratings:**

- Section 0 (Q1-Q3): Basic Info ❌ (hard filters)
- Section 5 (Q60-Q63): Open-Ended Text ❌ (AI-scored)

### Importance Levels

| Level | Label               | Multiplier | Effect                    |
| ----- | ------------------- | ---------- | ------------------------- |
| 0     | Not important       | 0.0        | No penalty for mismatch   |
| 1     | Somewhat important  | 0.5        | Half penalty for mismatch |
| 2     | Important (default) | 1.0        | Standard penalty          |
| 3     | Very important      | 1.5        | 50% more penalty          |
| 4     | Dealbreaker         | N/A        | Hard filter (skip pair)   |

### Formula

```
mismatch_penalty = 100% - base_score
adjusted_penalty = mismatch_penalty × importance_multiplier
final_score = 100% - adjusted_penalty
```

**Apply bidirectionally:** Each person's importance affects their own satisfaction score, then average.

---

## 6. Question Type Scoring Rules

### Ordinal Questions (Distance-Based)

Questions with ordered options (e.g., High → Moderate → Low):

**Formula:**

```
distance = |index_A - index_B|
max_distance = num_options - 1
base_score = (1 - distance/max_distance) × 100%
```

**Ordinal Questions Identified:**

- Q14: Energy level (3 options: high, moderate, low-key)
- Q15: Work-life balance (4 options)
- Q18: Social battery (5 options)
- Q20: Money habits (4 options)
- Q26: Alcohol (5 options)
- Q33: Energy preference (3 core + similar/doesn't matter)

### Ranking Questions (Love Languages)

- **Q30:** Love languages I receive (rank top 3)
- **Q41:** Love languages I give (rank top 3)

**Bidirectional Scoring:**

```
A_gives (Q41) ∩ B_receives (Q30) → overlap_A_to_B (0-3)
B_gives (Q41) ∩ A_receives (Q30) → overlap_B_to_A (0-3)
score_A_to_B = (overlap_A_to_B / 3) × 100%
score_B_to_A = (overlap_B_to_A / 3) × 100%
base_score = (score_A_to_B + score_B_to_A) / 2
```

### Single-Choice Questions (Exact Match)

Default: 100% if match, 0% if different

**Special handling for "doesn't matter" options:**

- If Person A selects "doesn't matter" → Person A's score = 100% (regardless of Person B's answer)
- Still calculate Person B's score normally (unless they also selected "doesn't matter")

### Text Questions (AI Similarity)

- Q60-Q63: Open-ended text
- Q1, Q2, Q10, Q51, Q57: Self-describe options

**Scoring:** Use sentence embedding cosine similarity (0-100%)

---

## 7. AI Model Selection

### For MVP (Batches 1 & 2)

**Text Similarity:**

- **Choice:** Sentence-BERT (sentence-transformers/all-MiniLM-L6-v2)
- **Reason:** Free, self-hosted, fast (<100ms per comparison)
- **Fallback:** OpenAI text-embedding-3-small if quality issues arise (cost: ~$0.005 for 500 users)

**Cupid Profile Summaries:**

- **Choice:** Include for MVP using GPT-3.5-turbo or Claude Haiku
- **Format:** 3-4 sentence summary covering personality, lifestyle, preferences, and dealbreakers
- **Cost:** ~$0.50 for 500 users (acceptable for MVP)

### Implementation

1. Pre-compute text embeddings during questionnaire submission
2. Store in `TextEmbedding` table
3. Calculate cosine similarity during matching run
4. Generate cupid summaries during cupid assignment (batch operation)

---

## 8. Database Schema Updates

### New Models Required

#### CompatibilityScore

```prisma
model CompatibilityScore {
  id String @id @default(cuid())
  userAId String
  userBId String
  scoreAtoB Float // 0-100 (A's perspective)
  scoreBtoA Float // 0-100 (B's perspective)
  averageScore Float // (scoreAtoB + scoreBtoA) / 2
  breakdown Json // {section0: 0, section1: 85, section2: 78, ...}
  batchNumber Int
  rank Int? // Rank for userA (1-10 for top 10 matches)
  createdAt DateTime @default(now())

  @@unique([userAId, userBId, batchNumber])
  @@index([userAId, batchNumber])
  @@index([averageScore])
}
```

**Note:** Store top 10 matches per person with rank attribute for debugging.

#### Match (Modified)

```prisma
model Match {
  id String @id @default(cuid())
  userId String // Person receiving the match
  matchedUserId String // Person they're matched with

  matchType String // 'algorithm' | 'cupid_sent' | 'cupid_received'
  cupidId String? // If cupid match, ID of cupid who made it

  compatibilityScore Float? // Only for algorithm matches
  batchNumber Int // 1 or 2
  revealedAt DateTime?

  createdAt DateTime @default(now())

  @@unique([userId, matchedUserId, batchNumber, matchType])
  @@index([userId, batchNumber])
  @@index([matchedUserId, batchNumber])
}
```

**Migration:** Change `cupidType` → `matchType` with new values.

#### CupidAssignment

```prisma
model CupidAssignment {
  id String @id @default(cuid())
  cupidId String // User who is the cupid
  personId String // User they're reviewing
  batchNumber Int

  selectedMatchId String? // User ID cupid selected (null if picked no one)
  hasSubmitted Boolean @default(false)
  submittedAt DateTime?

  createdAt DateTime @default(now())

  @@unique([cupidId, personId, batchNumber])
  @@index([cupidId, batchNumber])
  @@index([personId, batchNumber])
}
```

#### TextEmbedding

```prisma
model TextEmbedding {
  id String @id @default(cuid())
  userId String
  questionId String // "q60", "q61", "q1_self_describe", etc.
  text String @db.Text
  embedding Json // [0.12, -0.34, ...] (384-dim vector for MiniLM)
  createdAt DateTime @default(now())

  @@unique([userId, questionId])
  @@index([userId])
}
```

#### CupidProfileSummary (New - for AI summaries)

```prisma
model CupidProfileSummary {
  id String @id @default(cuid())
  userId String @unique
  summary String @db.Text // AI-generated 3-4 sentence summary
  batchNumber Int
  createdAt DateTime @default(now())

  @@index([userId, batchNumber])
}
```

---

## 9. Cupid Dashboard Specifications

### Assignment Logic

- **Method:** Random assignment (one cupid per person)
- **Ratio:** If 500 people + 50 cupids → 10 people per cupid
- **Overflow Handling:**
  - More cupids than people → Some cupids get no assignments
  - More people than cupids → Some people get no cupid
- **Future Enhancement:** Allow cupids to "claim" specific people (both excluded from random assignment)

### Cupid Interface Layout

**Split-Screen Comparison View:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Person #1's Profile]     |     [Candidate 1 of 5]         │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  Q4: Ideal Saturday        |  Q4: Ideal Saturday           │
│  • Sleeping until noon     |  • Up at 7am for a run        │
│                            |                                │
│  Q14: Energy Level         |  Q14: Energy Level            │
│  • Moderate                |  • High                        │
│                            |                                │
│  [... all questions ...]   |  [... all questions ...]      │
│                            |                                │
│                            |  [← Prev] [Next →]             │
│                            |  [Show Scores? ⚠️]             │
│                            |                                │
│  ────────────────────────────────────────────────────────  │
│         [Pick This Match]  [Request 5 More]  [Pick No One] │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Left panel: Assigned person's responses (fixed)
- Right panel: Current candidate's responses (changes with arrows)
- Synchronized scrolling for easy comparison
- Navigation arrows to cycle through candidates
- Toggle button for compatibility scores (with warning dialog)
- Actions: Pick this match, request more candidates (5-10), or pick no one

### Anonymization

Cupids see:

- ✅ Age, major, year
- ✅ All questionnaire responses
- ✅ AI-generated summary
- ❌ Names (first/last/display)
- ❌ Photos (MVP has no pictures anyway)
- ❌ Compatibility scores (default hidden, toggle to show)

---

## 10. Matching Trigger & Reveal System

### Trigger Mechanism (MVP)

**Admin Interface:** Not implemented yet (deferred)

**Manual Trigger:**
Create a backend configuration variable that can be changed to start matching:

```typescript
// lib/matching/config.ts
export const MATCHING_CONFIG = {
  BATCH_1_RUN_MATCHING: false, // Set to true to trigger Batch 1 matching
  BATCH_2_RUN_MATCHING: false, // Set to true to trigger Batch 2 matching
  TEST_MODE_REVEAL: false, // Set to true to bypass date-based reveal
  BATCH_1_REVEAL_DATE: new Date("2026-02-01T00:00:00Z"),
  BATCH_2_REVEAL_DATE: new Date("2026-02-07T00:00:00Z"),
};
```

**Usage:**

1. Admin manually changes `BATCH_1_RUN_MATCHING: true` in code
2. Matching algorithm runs (triggered by cron, API endpoint, or server restart)
3. Results stored in database with `revealedAt: null`
4. Matches revealed only after reveal date (or if `TEST_MODE_REVEAL: true`)

### Reveal Logic

```typescript
function canSeeMatches(batchNumber: number): boolean {
  if (MATCHING_CONFIG.TEST_MODE_REVEAL) return true;

  const revealDate =
    batchNumber === 1
      ? MATCHING_CONFIG.BATCH_1_REVEAL_DATE
      : MATCHING_CONFIG.BATCH_2_REVEAL_DATE;

  return new Date() >= revealDate;
}
```

**Cupid Restrictions:**

- Cupids cannot see who their assigned person is matched with until reveal
- Cupids can see their own selections (what they submitted)
- Cupids cannot see other cupids' selections

---

## 11. Match Display (User Experience)

### After Reveal

Users see matches in their dashboard with:

- ✅ Match type (algorithm, your cupid, their cupid, or combined)
- ✅ Match's display name (or first name if no display name)
- ✅ Match's email (for contact)
- ✅ Match's profile fields they chose to show:
  - Bio (if `showBioToMatches: true`)
  - Profile picture (if `showProfilePicToMatches: true`)
  - Interests (if `showInterestsToMatches: true`)
  - Major, year, age (always shown)
- ❌ Compatibility score (never shown to users)

### Special Badges

- 🎯 Algorithm + Your Cupid picked the same person
- 💝 Reinforced match (same person across batches via algorithm + cupid)

**No messaging system:** Users contact matches via displayed email.

**No acceptance mechanism:** Matches are informational. Users can reach out or not.

---

## 12. Performance & Caching Strategy

### Compatibility Score Calculation

For 500 users:

- Total pairs: 500 × 499 / 2 = 124,750 pairs
- With hard filters: ~30,000-50,000 valid pairs (estimate)

**Recommended Strategy:**

1. **Pre-compute text embeddings:** During questionnaire submission (immediate)
2. **Calculate compatibility on-demand:** During matching run only (not cached between batches)
3. **Store top 10 per user:** After matching completes, store ranked compatibility scores for debugging
4. **No persistent caching:** Recalculate fresh for Batch 2 (allows for algorithm improvements)

**Rationale:**

- Fresh calculation ensures accuracy and allows iterating on algorithm
- Matching runs are infrequent (2 times total), so computation cost is acceptable
- Storage of top 10 provides debugging without excessive database bloat
- Text embeddings ARE cached (don't change between batches)

### Expected Performance

- Text embedding generation: 500 users × 7 text fields × 50ms = ~3 minutes (one-time per user)
- Compatibility matrix: 50,000 pairs × 2ms = 100 seconds = ~2 minutes
- Greedy pairing algorithm: <5 seconds
- **Total matching time:** ~5-7 minutes (acceptable for offline batch job)

---

## 13. Implementation Phases

### Phase 1: Database Migration

- [ ] Update Prisma schema with new models
- [ ] Create migration scripts
- [ ] Test migration on development database

### Phase 0: Questionnaire Config Updates ✅ COMPLETED

- [x] Added `hasImportance` property to Question interface
- [x] Added `hasImportance: true/false` to all 63 questions in config
- [x] Updated QuestionRenderer to use `question.hasImportance`
- [x] Verified: 55 questions with importance, 8 without

### Phase 2: Scoring Engine

- [ ] Implement question-type scoring functions
- [ ] Implement importance weighting
- [ ] Implement section weighting
- [ ] Unit tests for scoring logic

### Phase 3: AI Integration

- [ ] Set up Sentence-BERT model (or OpenAI API)
- [ ] Text embedding generation pipeline
- [ ] Profile summary generation
- [ ] Store embeddings in database

### Phase 4: Matching Algorithm

- [ ] Hard filter implementation
- [ ] Compatibility score calculation
- [ ] Greedy pairing algorithm
- [ ] Batch exclusion logic (Batch 1 pairs excluded from Batch 2)

### Phase 5: Cupid System

- [ ] Random assignment algorithm
- [ ] Cupid dashboard UI (split-screen view)
- [ ] Cupid selection workflow
- [ ] Match record creation from cupid choices

### Phase 6: Match Reveal & Display

- [ ] Reveal date logic
- [ ] Test mode toggle
- [ ] User match dashboard
- [ ] Match display with profile visibility settings

### Phase 7: Testing & Validation

- [ ] Create test profiles (20-50 fake users)
- [ ] Run end-to-end matching simulation
- [ ] Validate scoring accuracy
- [ ] Validate cupid workflow
- [ ] Load testing (500 users)

---

## 14. Open Questions (Awaiting Clarification)

**None remaining.** All clarifications have been addressed.

---

## Next Steps

Ready for implementation! Next prompt should be for:

1. Database schema migration
2. Implementation guide creation
3. Begin Phase 1 development
