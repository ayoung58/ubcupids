# Matching Algorithm V2.3 - Changelog

**Date:** January 26-27, 2026  
**Version:** v2.3.0 → v2.3.1

---

## Overview

This document consolidates all bug fixes and improvements made to the matching algorithm during the v2.3 development cycle. All changes maintain backward compatibility with the algorithm specification and have comprehensive test coverage (247 tests passing).

---

## Bug Fixes

### Bug #1: Null Preferences Returning 0.5 Instead of 1.0

**Affected Questions:** Q5 (ethnicity), Q6 (religion), Q9a (drugs), Q13 (relationship intent), Q14 (field of study), Q21 (love languages)

**Issue:** When both users had "no preference" for multi-select questions, similarity was incorrectly calculated as 0.5 (neutral) instead of 1.0 (fully satisfied).

**Root Cause:** The code treated null preferences as "uncertain" rather than "happy with anything."

**Fix:** Changed `calculateTypeD_MultiSelect()` to return 1.0 when both users have null preferences:

```typescript
// BEFORE
if (aPreference.length === 0 && bPreference.length === 0) {
  return 0.5; // ❌ Wrong
}

// AFTER
if (aPreference.length === 0 && bPreference.length === 0) {
  return 1.0; // ✅ Correct
}
```

**Impact:** Users who selected "no preference" are now properly scored as fully flexible.

---

### Bug #2: Q26 "Whatever Feels Natural" Not Compatible with All Options

**Affected Questions:** Q26 (texting frequency)

**Issue:** The "whatever_feels_natural" option wasn't treated as universally compatible like "flexible" in Q29 (sleep schedule).

**Root Cause:** `calculateTypeC_CategoricalMulti()` didn't have special handling for this flexible option.

**Fix:** Added string preference support with ordinal distance calculation:

```typescript
// Q26 ordinal ordering
const q26Order: Record<string, number> = {
  minimal: 1,
  moderate: 2,
  frequent: 3,
  constant: 4,
  whatever_feels_natural: 5, // Treated as fully compatible
};

// For "similar" preference
const distance = Math.abs(aNum - bNum);
satisfaction = Math.max(0, 1 - distance / 3);
```

**Examples:**

- "minimal" vs "moderate" with "similar" → 0.667
- "minimal" vs "constant" with "similar" → 0.0
- Any option vs "whatever_feels_natural" → 1.0

**Impact:** Q26 now properly supports both ordinal distance scoring and the flexible option.

---

### Bug #3: Q32 "Similar" Preference Not Working

**Affected Questions:** Q32 (what makes you feel desired), potentially Q6, Q13, Q14

**Issue:** Multi-select questions with "similar" preference (as a string, not array) returned 0.0.

**Root Cause:** `calculateTypeD_MultiSelect()` only handled array preferences and null preferences, not string preferences like "same" or "similar."

**Fix:** Added asymmetric satisfaction calculation for string preferences:

```typescript
// User A's satisfaction: "Of B's selections, what % do I care about?"
if (aResponse.preference === "similar") {
  const overlapRatio = bSet.size > 0 ? intersection.size / bSet.size : 0;
  aSatisfied = overlapRatio;
}

// User B's satisfaction calculated similarly
// Final similarity = average of both satisfactions
```

**Why Asymmetric?** This correctly captures that users with broader interests can be fully satisfied by a subset, while users with narrower interests may be partially satisfied by a superset.

**Example:**

- User A: [flirting, physical, emotional, online, depends] (5 items)
- User B: [physical, emotional] (2 items)
- A's satisfaction: 2/2 = 1.0 (both of B's are in A's list)
- B's satisfaction: 2/5 = 0.4 (only 2 of A's are in B's list)
- Final similarity: (1.0 + 0.4) / 2 = **0.7** ✅

**Impact:** "Similar" preference now works correctly for multi-select questions.

---

### Bug #4: Hard Filters (Q1, Q2) Appearing in Scores

**Affected Questions:** Q1 (gender identity), Q2 (gender preference)

**Issue:** Hard filter questions were being scored in Phase 2 when they should only be used for filtering in Phase 1.

**Root Cause:** No early exit for hard filter questions in `calculateQuestionSimilarity()`.

**Fix:** Added explicit check at function start:

```typescript
export function calculateQuestionSimilarity(...): number {
  // Q1 and Q2 are HARD FILTERS - should NOT be scored
  if (questionId === "q1" || questionId === "q2") {
    return 0.0;
  }
  // ... rest of function
}
```

**Impact:** Hard filters no longer inflate or deflate compatibility scores.

---

### Bug #5: Likert Questions Routed to Wrong Type

**Affected Questions:** Q7, Q18, Q24, Q27, Q30, Q31, Q36

**Issue:** Seven Likert questions with "same-or-similar" preferences were routed to `"numeric"` type instead of `"same-similar-different"` type, causing incorrect handling of preferences.

**Root Cause:** Incorrect type mapping in `determineQuestionType()`.

**Fix:** Updated type map to route all LIKERT_SAME_SIMILAR questions correctly:

```typescript
// BEFORE
q7: "numeric",
q27: "numeric",
q30: "numeric",
// etc.

// AFTER
q7: "same-similar-different",
q27: "same-similar-different",
q30: "same-similar-different",
// etc.
```

**Impact:** These questions now properly:

- Handle null preferences as 1.0
- Use gradual scoring for "similar" preference
- Apply 0.8 threshold for "same" preference

---

### Bug #6: Scores Exceeding 100 (v2.3.1)

**Critical Bug Affecting All Scores**

**Issue:** Pair scores could exceed 100 when users marked multiple questions as "very important."

**Root Cause:** The code used **arithmetic mean** instead of **weighted average**:

```typescript
// WRONG: Arithmetic mean
const avgLifestyle = lifestyleScore / lifestyleCount;

// When: similarity=0.8, importance=2.0 → weighted=1.6
// Multiple questions: (1.6 + 1.8 + 1.4) / 3 = 1.6
// Score: 1.6 × 100 = 160 ❌
```

**Fix:** Changed to proper weighted average formula per algorithm spec:

```typescript
// CORRECT: Weighted average
const avgLifestyle = lifestyleScore / lifestyleWeightSum;

// Same example: (1.6 + 1.8 + 1.4) / (2.0 + 2.0 + 2.0) = 0.8
// Score: 0.8 × 100 = 80 ✅
```

**Mathematical Proof:**

```
weighted_avg = Σ(similarity × weight) / Σ(weight)

Upper bound: Σ(1.0 × weight) / Σ(weight) = 1.0
Lower bound: Σ(0.0 × weight) / Σ(weight) = 0.0

Therefore: weighted_avg ∈ [0, 1] ✓
```

**Impact:**

- Scores now guaranteed to stay in [0, 100] range
- Aligns with algorithm specification
- May slightly lower scores for users with many "very important" questions (this is correct behavior)

---

## Null Preference Philosophy (v2.3)

**Core Principle:** "No preference" = "I'm happy with anything" = satisfaction of 1.0

This applies consistently across **all** question types:

- Categorical single-select (Type B, C, D)
- Multi-select (Type D)
- Ordinal/Likert (Type F)
- Special cases (Love Languages, Conflict Resolution, etc.)

**Examples:**

- User A: ethnicity preference = null → 1.0 satisfaction with any ethnicity
- User B: political leaning preference = null → 1.0 satisfaction with any political view
- Both null preferences: (1.0 + 1.0) / 2 = 1.0 final similarity

**Rationale:** Null preference is an explicit user choice expressing flexibility, not uncertainty.

---

## Testing Summary

**Total Tests:** 247 passing (16 test suites)

**New Test Files:**

- `bug-fixes-v2.3.test.ts` - 10 tests for Q5, Q26, Q32 fixes
- `q26-and-hard-filters.test.ts` - 8 tests for Q26 string preferences and hard filter exclusion
- `likert-similar-preference.test.ts` - 9 tests for Likert similar preference gradual scoring

**Test Coverage:**

- ✅ Hard Filters (31 tests)
- ✅ Similarity Calculation (30 tests)
- ✅ Importance Weighting (12 tests)
- ✅ Directional Scoring (19 tests)
- ✅ Section Weighting (13 tests)
- ✅ Pair Score & Eligibility (20 tests)
- ✅ Blossom Matching (21 tests)
- ✅ Special Cases (19 tests)
- ✅ Integration (11 tests)

---

## Future Considerations

### Special Importance Questions (Proposed, Not Implemented)

Some questions (Q3, Q9a, Q9b, Q13, Q21) may warrant additional weight. Proposed Solution 1:

**Asymmetric Multiplier:**

```typescript
function getSpecialQuestionMultiplier(similarity: number): number {
  if (similarity >= 0.75) {
    return 2.0; // Amplify strong matches
  } else {
    return 1.0; // Standard weight for weak matches
  }
}
```

**Advantages:**

- ✅ Rewards strong alignment on critical questions
- ✅ Doesn't excessively penalize mismatches
- ✅ Tunable (adjust threshold and multiplier)

**Status:** Proposed for future implementation if data shows need for additional differentiation.

---

## Version History

- **v2.2** (January 25, 2026): Initial multi-select implementation
- **v2.3.0** (January 26, 2026): Fixed null preferences, Q26, Q32, hard filters, Likert routing
- **v2.3.1** (January 27, 2026): Fixed score cap bug (arithmetic mean → weighted average)

---

## Migration Notes

No database migration required. All changes are calculation-only and take effect immediately for new matching runs.

**User-Facing Changes:**

- Better matches for users who selected "no preference"
- "Whatever feels natural" for texting works correctly
- Q26 scores based on ordinal distance
- Hard filters don't appear in similarity scores
- Likert questions with preferences work correctly
- Scores properly capped at 100

---

## References

- **Algorithm Spec:** `docs/Questionnaire/Questionnaire_Updated_Version/Questionnaire_Version_2.2_Matching_Algo_Raw.md`
- **Implementation:** `lib/matching/v2/`
- **Tests:** `lib/matching/v2/__tests__/`
- **Config:** `lib/matching/v2/config.ts`
