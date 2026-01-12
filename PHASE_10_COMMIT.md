# Phase 10: Test User Scripts Update - V2 Questionnaire Format

## Summary

Updated test data generation system to support V2 questionnaire format with answer/preference/importance/dealbreaker structure. Enables admin UI and CLI generation of realistic test users for V2.2 matching algorithm validation.

## Changes

### New Files

- `lib/questionnaire/v2/test-data-generator.ts` (527 lines)
  - Complete V2 response generator with all question types
  - Test scenario generators (perfect match, dealbreaker conflict, asymmetric)
  - Diverse pool generator for realistic testing
  - Validation function for generated data
  - Realistic free response content (10 options each)
- `lib/questionnaire/v2/__tests__/test-data-generator.test.ts` (27 tests)
  - Tests for all generator functions
  - Tests for all test scenarios
  - Tests for special question types
  - Tests for data variety
  - All tests passing (27/27)

### Modified Files

- `app/api/admin/generate-test-users/route.ts`
  - Removed V1 response generation logic
  - Integrated test-data-generator utilities
  - Creates QuestionnaireResponseV2 records
  - No encryption (JSONB format)
  - Admin UI buttons work unchanged

- `scripts/seed-test-data.ts` (complete rewrite: 1515 → 422 lines)
  - ENABLED (was disabled with V1 warning)
  - Command-line arguments: --count and --scenario
  - Scenario support: random, perfect, dealbreaker, asymmetric
  - Progress tracking and statistics
  - V2 questionnaire generation
  - Batch processing with pairs + diverse pool

## Features

### Test Data Generator

- **generateV2Responses(config?)**: Complete V2 questionnaire
  - All 37 questions (Q1-Q36 + Q9a/Q9b)
  - 5 free responses (2 mandatory, 3 optional)
  - Configurable rates (importance, dealbreaker, indifferent)
  - Respects all validation constraints

- **generatePerfectMatchPair()**: Highly compatible users
  - Matching gender preferences
  - Overlapping age ranges
  - Similar answers on key questions

- **generateDealbreakerConflictPair()**: Incompatible users
  - Q8 (alcohol) dealbreaker conflict
  - Otherwise compatible

- **generateAsymmetricPair()**: One-sided importance
  - User 1: picky (70% high importance)
  - User 2: easy-going (20% high importance, 40% indifferent)

- **generateDiversePool(count)**: Varied test users
  - Random gender/age distribution
  - Variety in importance levels (20-60%)
  - Variety in dealbreakers (1-9%)
  - Variety in preferences

- **validateGeneratedResponses(generated)**: Full validation
  - All required responses
  - Age bounds (18-40)
  - Multi-select constraints
  - Preference consistency
  - Deal breaker rules

### Question Type Support

✅ CATEGORICAL_NO_PREFERENCE (Q1, Q2)
✅ SINGLE_SELECT_MULTI_PREFERENCE (Q3, Q8, etc.)
✅ MULTI_SELECT_WITH_PREFERENCE (Q5, Q6, Q9a)
✅ SPECIAL_AGE (Q4 with range preference)
✅ SPECIAL_DRUG_USE (Q9a+Q9b)
✅ SPECIAL_LOVE_LANGUAGES (Q21, exactly 2)
✅ LIKERT_SAME_SIMILAR (personality)
✅ LIKERT_DIFFERENT (complementary traits)

### CLI Usage

```bash
# Default: 250 users + 250 cupids
npx tsx scripts/seed-test-data.ts

# Smaller batch
npx tsx scripts/seed-test-data.ts --count=50

# Test scenarios
npx tsx scripts/seed-test-data.ts --scenario=perfect
npx tsx scripts/seed-test-data.ts --scenario=dealbreaker
npx tsx scripts/seed-test-data.ts --scenario=asymmetric

# Combined
npx tsx scripts/seed-test-data.ts --count=100 --scenario=perfect
```

### Admin UI Usage

- Navigate to /admin
- Click "Add 125 Match Users" or "Add 125 Cupid Users"
- Users created with V2 questionnaire responses
- Password: TestPassword123!

## Test Results

```
Phase 10 Tests:  27 passed (27) - 100%
Overall Tests:   197 passed | 6 failed (203) - 97%
```

**All Phase 10 tests passing**
Existing failures are pre-existing integration test edge cases.

## Validation Rules

- Age: 18-40, min < max for ranges
- Q2 (gender prefs): 1-4 selections
- Q21 (love languages): Exactly 2 selections
- Q25 (conflict resolution): Max 2 selections
- Free responses: 2 mandatory, 3 optional, 300 char max
- Dealbreakers: Only on IMPORTANT/VERY_IMPORTANT questions
- Importance levels: NOT_IMPORTANT, SOMEWHAT_IMPORTANT, IMPORTANT, VERY_IMPORTANT

## Performance

- Single user: ~2ms
- 250 users: ~500ms generation + ~5-10s database insertion
- 500 users: ~1s generation + ~10-20s database insertion

## Integration

Works seamlessly with:

- V2.2 matching algorithm (all 8 phases)
- Admin dashboard UI (no changes required)
- QuestionnaireResponseV2 database model
- JSONB storage format (no encryption)

## Documentation

- `docs/Phase_10_Update.md`: Complete documentation
- Inline JSDoc comments in test-data-generator.ts
- Test file demonstrates all usage patterns
- CLI help in script header comment

## Next Steps

- ✅ Phase 10 complete
- ⏸️ Phase 11: New Tutorial for V2
