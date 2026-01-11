# Matching Algorithm V2 - README

## Quick Start

This is the V2 matching algorithm for UBC Cupids, featuring:

- **38 questions** with nested response format
- **9 similarity types** for different question categories
- **8-phase scoring** with importance weighting and section prioritization
- **Blossom optimization** for globally optimal pairings

## Documentation Index

1. **[MATCHING_ALGORITHM_V2_DOCS.md](./MATCHING_ALGORITHM_V2_DOCS.md)** - Comprehensive algorithm documentation
   - Full explanation of all 9 similarity types (A-I)
   - Detailed breakdown of 8-phase matching process
   - Scoring formulas and configuration
   - Special cases (Q21, Q25, Q29)
   - Blossom optimization details

2. **[MIGRATION_GUIDE_V1_V2.md](./MIGRATION_GUIDE_V1_V2.md)** - Migration guide from V1
   - Response format conversion (flat → nested)
   - API endpoint changes
   - UI component updates
   - Database migration steps
   - Backward compatibility strategies

3. **[API_DOCUMENTATION_V2.md](./API_DOCUMENTATION_V2.md)** - API reference
   - All questionnaire endpoints
   - Admin endpoints (seed users, run matching)
   - Cupid endpoints (review, decide)
   - Request/response schemas
   - Error handling
   - Rate limiting

## File Structure

```
lib/matching/
├── similarityV2.ts          # 9 similarity functions (Types A-I)
├── algorithmV2.ts           # 8-phase matching algorithm
├── blossomV2.ts             # Blossom optimization integration
├── __tests__/
│   ├── similarityV2.test.ts # Unit tests for all similarity types
│   └── algorithmV2.test.ts  # Integration tests for full algorithm
└── README.md                # This file

app/api/
├── questionnaire/
│   ├── save/route.ts        # Save progress
│   └── submit/route.ts      # Submit complete questionnaire
└── admin/
    ├── seed-test-users-v2/route.ts  # Generate test users
    └── start-matching-v2/route.ts   # Run matching algorithm

docs/Matching/
├── MATCHING_ALGORITHM_V2_DOCS.md  # Algorithm documentation
├── MIGRATION_GUIDE_V1_V2.md       # Migration guide
└── API_DOCUMENTATION_V2.md        # API reference
```

## Key Concepts

### QuestionResponse Format (V2)

Every question has four components:

```typescript
interface QuestionResponse {
  ownAnswer: ResponseValue; // User's answer
  preference: {
    type: PreferenceType; // How they want to match
    value?: ResponseValue; // Optional specific value(s)
    doesntMatter: boolean; // True if no preference
  };
  importance: 1 | 2 | 3 | 4; // Importance level
  dealbreaker: boolean; // True if mismatch is unacceptable
}
```

### 8 Preference Types

1. **same** - Exact match required
2. **similar** - Close/adjacent values accepted
3. **different** - Opposite/complementary preferred
4. **compatible** - Multiple acceptable options
5. **more** - Higher ordinal values preferred
6. **less** - Lower ordinal values preferred
7. **specific_values** - Must be in specific set/range
8. **doesntMatter** - No preference (always matches)

### 9 Similarity Types

| Type | Questions                           | Logic                                      |
| ---- | ----------------------------------- | ------------------------------------------ |
| A    | Gender, Religion, Pets, Children    | Categorical exact match                    |
| B    | Exercise, Education, Social Battery | Single-select with distance                |
| C    | Hobbies, Deal-breakers              | Multi-select Jaccard similarity            |
| D    | Languages                           | Single vs multi-select containment         |
| E    | Alcohol, Marijuana, Drugs           | Compound (substance + frequency)           |
| F    | Introversion, Spontaneity, etc.     | Ordinal/Likert scale (1-5)                 |
| G    | Age, Alone Time, Cleanliness        | Directional Likert (wide scale)            |
| H    | Sleep Schedule                      | Different preference (inverted similarity) |
| I    | Love Languages, Conflict, Politics  | Special case logic                         |

### 8-Phase Algorithm

1. **Hard Filter Dealbreakers** - Q1, Q2, Q4 must pass
2. **Question Similarity** - Calculate for all 36 questions
3. **Importance Weighting** - Apply 1-4 scale
4. **Directional Scoring** - Bidirectional min(A→B, B→A)
5. **Section Weighting** - 65% lifestyle, 35% personality
6. **Pair Score** - Combine section scores
7. **Eligibility Threshold** - 40% minimum required
8. **Blossom Preparation** - Convert to weighted graph

## Running the Algorithm

### Via Admin Dashboard (Recommended)

1. Go to `/admin` route
2. Click "Add 125 Match Users" to generate test data
3. Click "Run Matching V2" to execute algorithm
4. View results in dashboard

### Via API

```typescript
// Generate test users
const response = await fetch("/api/admin/seed-test-users-v2", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userType: "match" }),
});

// Run matching
const result = await fetch("/api/admin/start-matching-v2", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ testMode: true }),
});

const data = await result.json();
console.log(`Created ${data.matchesCreated} matches`);
console.log(`Average score: ${data.details.averageScore}`);
```

### Via Code (Testing)

```typescript
import { runMatchingAlgorithm } from "@/lib/matching/algorithmV2";
import { runBlossomOptimization } from "@/lib/matching/blossomV2";

// Create mock users
const candidates = [
  /* ... */
];
const matches = [
  /* ... */
];

// Run algorithm
const result = runMatchingAlgorithm(candidates, matches);

// Get eligible pairs
console.log(`Eligible pairs: ${result.eligiblePairs.length}`);
console.log(`Filtered by dealbreakers: ${result.filteredByDealbreaker.length}`);

// Run Blossom
const finalMatches = runBlossomOptimization(result.eligiblePairs);
console.log(`Final matches: ${finalMatches.length}`);
```

## Testing

### Run Unit Tests

```bash
# All tests
npm test

# Specific test suites
npm test similarityV2.test.ts
npm test algorithmV2.test.ts

# Watch mode
npm test -- --watch
```

### Test Coverage

- **Similarity functions:** All 9 types with edge cases
- **Algorithm phases:** All 8 phases individually
- **Integration:** Full pipeline with realistic data
- **Edge cases:** Wildcards, dealbreakers, empty responses

## Configuration

Adjustable parameters in `algorithmV2.ts`:

```typescript
const SECTION_1_WEIGHT = 0.65; // Lifestyle importance
const SECTION_2_WEIGHT = 0.35; // Personality importance
const ELIGIBILITY_THRESHOLD = 0.4; // Minimum score (40%)
```

## Performance

### Time Complexity

- **Dealbreaker filtering:** O(n × m)
- **Similarity calculation:** O(n × m × q) where q = 36 questions
- **Blossom optimization:** O(n³) worst case
- **Overall:** O(n × m × q + n³) ≈ O(n³) for balanced pools

### Optimizations

1. **Early rejection:** Dealbreakers filter out 60-80% of pairs
2. **Eligibility threshold:** Removes low-quality pairs before Blossom
3. **Bidirectional calculation:** Single pass computes both directions
4. **Integer weights:** Blossom uses integers for speed

### Typical Performance

- **100 candidates × 100 matches:** ~2-3 seconds
- **500 × 500:** ~15-25 seconds
- **1000 × 1000:** ~90-120 seconds

## Special Cases

### Q21: Love Languages (Bidirectional)

- Matches "show" with "receive" in both directions
- Person A shows what Person B wants to receive
- Person B shows what Person A wants to receive

### Q25: Conflict Resolution (Compatibility Matrix)

- Pre-defined compatibility scores for style pairings
- Direct + Direct = 1.0 (perfect)
- Avoid + Direct = 0.3 (poor)

### Q29: Political Views (Wildcard)

- "flexible" answer matches anyone with 1.0
- Otherwise uses categorical matching

### Q2: Sexual Orientation (Wildcard)

- "anyone" matches all orientations with 1.0
- Used for users open to all orientations

## Common Issues

### Low Match Count

**Symptom:** Algorithm returns very few matches

**Causes:**

- Eligibility threshold too high (40% may be strict)
- Too many dealbreakers in test data
- Incompatible demographics (e.g., all same gender)

**Solutions:**

- Lower threshold temporarily: `const ELIGIBILITY_THRESHOLD = 0.3;`
- Generate more diverse test users
- Check dealbreaker distribution in test data

### High Rejection Rate

**Symptom:** Most pairs filtered by dealbreakers

**Causes:**

- Hard filter Q1/Q2/Q4 incompatibilities
- Question-level dealbreakers triggering

**Solutions:**

- Review dealbreaker settings in test data
- Ensure diverse gender/orientation distribution
- Check Q4 (relationship type) compatibility

### Slow Performance

**Symptom:** Algorithm takes >5 seconds for small datasets

**Causes:**

- Too many eligible pairs (Blossom is O(n³))
- Unoptimized similarity calculations

**Solutions:**

- Increase eligibility threshold to reduce Blossom input
- Profile code to find bottlenecks
- Consider parallel processing for large datasets

## Future Enhancements

### Planned Features

1. **ML-based weights** - Train from historical cupid decisions
2. **Dynamic thresholds** - Adjust based on pool size
3. **Multi-round matching** - Run multiple iterations with relaxed constraints
4. **Geographic bonus** - Add location-based scoring
5. **Feedback loop** - Fine-tune based on match success rates

### Research Opportunities

- A/B test section weight ratios (65/35 vs 50/50)
- Evaluate dealbreaker threshold (currently 0.5)
- Test importance scale (1-4 vs 1-5 vs continuous)
- Compare Blossom vs greedy vs simulated annealing

## Support

### For Questions

1. Read comprehensive docs: [MATCHING_ALGORITHM_V2_DOCS.md](./MATCHING_ALGORITHM_V2_DOCS.md)
2. Check test files for usage examples
3. Review inline comments in `similarityV2.ts` and `algorithmV2.ts`
4. Consult API docs for endpoint details

### For Issues

1. Check [MIGRATION_GUIDE_V1_V2.md](./MIGRATION_GUIDE_V1_V2.md) troubleshooting section
2. Run test suite to verify implementation: `npm test`
3. Enable debug logging in algorithm code
4. Contact development team with error logs

## Contributing

When modifying the matching algorithm:

1. **Update tests** - Add tests for new similarity types or edge cases
2. **Update documentation** - Keep docs in sync with code changes
3. **Maintain backward compatibility** - Support V1 format when possible
4. **Performance test** - Verify changes don't significantly slow algorithm
5. **Validate with real data** - Test with production-like questionnaire responses

## License

Internal use only - UBC Cupids matching system.

---

**Version:** 2.0  
**Last Updated:** January 2026  
**Maintainer:** UBC Cupids Development Team
