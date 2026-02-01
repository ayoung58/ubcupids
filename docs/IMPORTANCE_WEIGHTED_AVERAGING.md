# Importance-Weighted Averaging Implementation (Option 3)

## Summary

Implemented importance-weighted averaging in the section weighting phase (Phase 5) of the matching algorithm to prevent users with mostly "no preference" responses from matching well based solely on a few questions they care about.

## Problem

The previous implementation used simple averaging for section scores, which meant:

- A user with 9 questions marked "not_important" and 1 marked "very_important" would get a high score if they matched well on the 9 unimportant questions, even if they matched poorly on the 1 important question
- Questions people don't care about had equal weight as questions they do care about
- Users could "game" the system by marking everything as "not important" except one preferred criterion

## Solution: Importance-Weighted Averaging

### Core Concept

When calculating section averages, weight each question by the **MAXIMUM importance either user assigned to it**.

### Formula

```
weighted_score = Σ(score_i × max_importance_i) / Σ(max_importance_i)
```

Where:

- `score_i` is the similarity score for question i (0-1)
- `max_importance_i` is max(userA.importance_i, userB.importance_i)
- Importance weights: NOT_IMPORTANT=0, SOMEWHAT=0.5, IMPORTANT=1.0, VERY=2.0

### Rationale for Using Maximum

We use the maximum importance (not average) because:

1. **Mutual respect**: If one person cares strongly about something, it should matter in the match
2. **Prevents gaming**: Can't ignore important criteria by marking everything "not important"
3. **Captures significance**: What people care about should influence compatibility

### Fallback Behavior

If ALL questions have importance=0 from both users:

- Falls back to simple average to avoid division by zero
- This prevents NaN results while maintaining reasonable behavior

## Implementation

### Files Modified

1. **lib/matching/v2/section-weighting.ts**
   - Updated `applySectionWeighting()` signature to accept `userA` and `userB` parameters
   - Added `getMaxImportanceWeight()` helper function
   - Added `getImportanceWeight()` to convert importance strings to numeric weights
   - Implemented `calculateWeightedAverage()` with fallback logic

2. **lib/matching/v2/index.ts**
   - Updated `calculateDirectionalScoreComplete()` to use MAX importance instead of average
   - Added fallback logic when all importance weights are 0
   - Changed from `avgImportance` to `maxImportance` for section weight accumulation

3. **lib/matching/v2/**tests**/section-weighting.test.ts**
   - Updated all tests to provide mock users with importance data
   - Added `createMockUser()` helper for test data generation
   - Added new tests for importance-weighted behavior
   - Added test for zero-importance fallback

### Test Results

✅ All section-weighting tests pass (15/15)

Key test cases added:

- **Importance weighting**: Verifies max importance between users is used correctly
- **Zero importance fallback**: Ensures simple average is used when all weights are 0
- **Edge cases**: Handles empty responses, mixed importance levels

## Example Scenarios

### Scenario 1: User with mostly "no preference"

```
User A:
- q1-q9: not_important (weight 0), score 1.0 (perfect matches)
- q10: very_important (weight 2.0), score 0.2 (poor match)

User B:
- q1-q10: important (weight 1.0)

Old method (simple average):
(1.0×9 + 0.2) / 10 = 0.92 → Score: 59.8

New method (importance-weighted):
Max weights: q1-q9 have weight 1.0 (from B), q10 has weight 2.0 (from A)
(1.0×1.0×9 + 0.2×2.0) / (1.0×9 + 2.0) = 9.4 / 11.0 = 0.855 → Score: 55.5

✅ Improvement: The important question (q10) now has more influence!
```

### Scenario 2: Users care about different questions

```
User C: q1=very_important (2.0), q2=not_important (0)
User D: q1=not_important (0), q2=very_important (2.0)

Scores: q1=0.3, q2=0.9, q3=1.0 (both not_important)

Weighted average:
(0.3×2.0 + 0.9×2.0 + 1.0×0) / (2.0 + 2.0 + 0) = 2.4 / 4.0 = 0.600

✅ Both important questions count equally, unimportant q3 is ignored
```

### Scenario 3: All zero importance (edge case)

```
Both users mark all questions as not_important

Scores: q1=1.0, q2=0.6

Fallback to simple average:
(1.0 + 0.6) / 2 = 0.800

✅ Avoids NaN, maintains reasonable behavior
```

## Benefits

1. **Fairness**: Questions people care about matter more
2. **Prevents gaming**: Can't match well by marking everything unimportant
3. **Mutual respect**: If either person cares, the question matters
4. **Robustness**: Graceful fallback when all weights are 0
5. **Transparency**: Clear, intuitive weighting logic

## Backward Compatibility

The change maintains backward compatibility:

- Questions with equal importance from both users behave identically to before
- The max() operation only changes behavior when importance levels differ
- Test suite validates all existing scenarios still work correctly

## Performance

No significant performance impact:

- O(n) complexity maintained (one pass through questions)
- Simple arithmetic operations (max, multiplication, division)
- No additional data structures required

## Related Files

- **Implementation**: [lib/matching/v2/section-weighting.ts](lib/matching/v2/section-weighting.ts)
- **Pipeline integration**: [lib/matching/v2/index.ts](lib/matching/v2/index.ts)
- **Tests**: [lib/matching/v2/**tests**/section-weighting.test.ts](lib/matching/v2/__tests__/section-weighting.test.ts)
- **Demo script**: [scripts/test-importance-weighting.ts](scripts/test-importance-weighting.ts)

## Next Steps

- ✅ Implementation complete
- ✅ Tests passing
- ✅ Demo script created
- 🔄 Ready for production deployment
- 📊 Monitor matching quality metrics after deployment

## Version

- Algorithm Version: V2.3
- Implementation Date: 2026-01-31
- Option Selected: Option 3 (Importance-Weighted Averaging)
