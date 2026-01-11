# Questionnaire V2 Matching Algorithm Documentation

## Overview

The V2 matching algorithm is a sophisticated bidirectional matching system designed to pair users based on deep compatibility analysis across 38 questions. The system uses a multi-phase approach combining similarity scoring, importance weighting, and global optimization to produce high-quality matches.

## Table of Contents

1. [Algorithm Architecture](#algorithm-architecture)
2. [Question Response Format](#question-response-format)
3. [9 Similarity Types (A-I)](#9-similarity-types)
4. [8-Phase Matching Process](#8-phase-matching-process)
5. [Special Cases](#special-cases)
6. [Blossom Optimization](#blossom-optimization)
7. [Scoring Formulas](#scoring-formulas)
8. [Configuration](#configuration)

---

## Algorithm Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Hard Filter Dealbreakers (Q1, Q2, Q4)            │
│  - Gender identity compatibility                            │
│  - Sexual orientation compatibility                         │
│  - Relationship type compatibility                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Question-Level Similarity Calculation             │
│  - Calculate similarity for all 36 algorithm questions      │
│  - Use appropriate similarity function for each type        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Importance Weighting                              │
│  - Apply 1-4 importance scale to similarity scores          │
│  - Average A's and B's importance for each question         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Directional Scoring                               │
│  - Each similarity is already bidirectional (min of A→B, B→A)│
│  - Ensures mutual compatibility                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Section Weighting                                 │
│  - Section 1 (Lifestyle): 65% weight                        │
│  - Section 2 (Personality): 35% weight                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: Pair Score Construction                           │
│  - Total score = weighted sum of sections                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 7: Eligibility Threshold                             │
│  - Minimum 40% total score required                         │
│  - Filter out low-compatibility pairs                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 8: Blossom Optimization                              │
│  - Convert eligible pairs to weighted graph                 │
│  - Run maximum-weight perfect matching (Edmonds' Blossom)   │
│  - Return globally optimal pairings                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Question Response Format

### V2 Structure

Each question response in V2 contains four components:

```typescript
interface QuestionResponse {
  ownAnswer: ResponseValue; // User's own answer
  preference: {
    type: PreferenceType; // How they want to match
    value?: ResponseValue; // Optional specific value(s)
    doesntMatter: boolean; // True if they don't care about this question
  };
  importance: number; // 1-4 scale (1=low, 4=critical)
  dealbreaker: boolean; // True if mismatch is unacceptable
}
```

### Preference Types

| Type              | Description                          | Example                                        |
| ----------------- | ------------------------------------ | ---------------------------------------------- |
| `same`            | Looking for exact match              | "I want someone with the same religion"        |
| `similar`         | Looking for similar/adjacent values  | "I want someone with similar exercise habits"  |
| `different`       | Looking for complementary/opposite   | "I want someone with different sleep schedule" |
| `compatible`      | Accepting multiple values from a set | "I'm okay with Christian, Jewish, or Atheist"  |
| `more`            | Looking for higher values (ordinal)  | "I want someone who exercises more than me"    |
| `less`            | Looking for lower values (ordinal)   | "I want someone who drinks less than me"       |
| `specific_values` | Must have certain value(s)           | "I need someone aged 25-30"                    |
| `doesntMatter`    | No preference (always matches)       | "Cultural background doesn't matter to me"     |

### Example Response

```typescript
{
  q7: {
    ownAnswer: "3-4 times per week",
    preference: {
      type: "similar",
      doesntMatter: false
    },
    importance: 3,
    dealbreaker: false
  },
  q11: {
    ownAnswer: 25,
    preference: {
      type: "specific_values",
      value: { min: 23, max: 28 },
      doesntMatter: false
    },
    importance: 4,
    dealbreaker: true
  }
}
```

---

## 9 Similarity Types

### Type A: Categorical Exact Match

**Used for:** Gender (Q1), Sexual Orientation (Q3), Cultural Background (Q5), Religion (Q6), Pets (Q16), Children (Q19)

**Logic:**

- `same` preference: 1.0 if answers match, 0.0 otherwise
- `different` preference: 1.0 if answers differ, 0.0 otherwise
- `specific` preference: 1.0 if other's answer is in preference set, 0.0 otherwise
- `doesntMatter`: Always 1.0

**Example:**

```typescript
// Person A: "I'm atheist and want someone atheist or agnostic"
personA.q6 = {
  ownAnswer: "atheist",
  preference: { type: "specific", value: ["atheist", "agnostic"] },
};

// Person B: "I'm agnostic and don't care about religion"
personB.q6 = {
  ownAnswer: "agnostic",
  preference: { type: "doesntMatter", doesntMatter: true },
};

// Result: A→B = 1.0 (B is in A's set), B→A = 1.0 (doesn't matter), final = 1.0
```

### Type B: Single-Select Similarity

**Used for:** Exercise Frequency (Q7), Education (Q8), Social Battery (Q13), Work-Life Balance (Q15), Future Goals (Q17), Finances (Q18)

**Logic:**

- `similar`: Distance-based scoring on ordered options
- `compatible`: Set intersection (1.0 if overlap exists)
- Adjacent options get 0.67, 2 steps away get 0.33, etc.

**Example:**

```typescript
// Person A: Exercises "3-4 times per week", wants similar
personA.q7 = { ownAnswer: "3-4", preference: { type: "similar" } };

// Person B: Exercises "5+ times per week", wants similar
personB.q7 = { ownAnswer: "5+", preference: { type: "similar" } };

// Result: 1 step apart on scale → 0.67 similarity
```

### Type C: Multi-Select Jaccard Similarity

**Used for:** Hobbies (Q10), Deal-breakers (Q14)

**Logic:**

- Jaccard index: `|A ∩ B| / |A ∪ B|`
- `similar`: Use Jaccard directly
- `specific_values`: Check if other's set contains required values

**Example:**

```typescript
// Person A: [reading, hiking, cooking]
personA.q10 = {
  ownAnswer: ["reading", "hiking", "cooking"],
  preference: { type: "similar" },
};

// Person B: [hiking, gaming, cooking]
personB.q10 = {
  ownAnswer: ["hiking", "gaming", "cooking"],
  preference: { type: "similar" },
};

// Intersection: {hiking, cooking} = 2
// Union: {reading, hiking, cooking, gaming} = 4
// Result: 2/4 = 0.5
```

### Type D: Single vs Multi-Select Similarity

**Used for:** Languages (Q12)

**Logic:**

- Check if single value is contained in multi-select set
- `similar`: 1.0 if contained, 0.0 otherwise
- `specific_values`: Check for required languages

**Example:**

```typescript
// Person A: Speaks only English
personA.q12 = { ownAnswer: "english", preference: { type: "similar" } };

// Person B: Speaks [English, Spanish, Mandarin]
personB.q12 = {
  ownAnswer: ["english", "spanish", "mandarin"],
  preference: { type: "similar" },
};

// Result: "english" ∈ B's set → 1.0
```

### Type E: Compound Drug Use Similarity

**Used for:** Alcohol (Q9a), Marijuana (Q9b), Other Drugs (Q9c)

**Logic:**

- Two-part matching: substance type + frequency
- Substance match weighted 70%, frequency match 30%
- `less`/`more` preferences for frequency comparison
- `never` requires exact match

**Example:**

```typescript
// Person A: Drinks alcohol socially, wants similar
personA.q9a = {
  ownAnswer: { substance: "alcohol", frequency: "socially" },
  preference: { type: "similar" },
};

// Person B: Drinks alcohol regularly
personB.q9a = {
  ownAnswer: { substance: "alcohol", frequency: "regularly" },
  preference: { type: "similar" },
};

// Substance match: 0.7, frequency mismatch: 0.0 → avg = 0.35
```

### Type F: Ordinal/Likert Similarity

**Used for:** Introversion/Extraversion (Q22), Spontaneity (Q23), Emotional Expression (Q24), Texting (Q26), Physical Affection (Q27), Humor (Q28), Jealousy (Q30), Ambition (Q31)

**Logic:**

- Distance-based on scale (typically 1-5)
- Formula: `1 - (distance / (maxValue - 1))`
- `more`/`less` preferences: directional comparison
- `similar`: Distance-based as above

**Example:**

```typescript
// Person A: Introversion level 4/5, wants similar
personA.q22 = { ownAnswer: 4, preference: { type: "similar" }, importance: 3 };

// Person B: Introversion level 3/5, wants similar
personB.q22 = { ownAnswer: 3, preference: { type: "similar" }, importance: 3 };

// Distance: |4 - 3| = 1, scale: 5
// Result: 1 - (1 / 4) = 0.75
```

### Type G: Directional Likert Similarity

**Used for:** Age (Q11), Alone Time (Q20), Cleanliness (Q32), Routine (Q33), Risk-taking (Q34), Attention to Detail (Q35), Arguments (Q36)

**Logic:**

- Similar to Type F but with wider scale (e.g., 18-100 for age)
- `specific_values`: Range matching (min/max)
- `more`/`less`: Directional acceptance
- Age uses 10% tolerance for `similar`

**Example:**

```typescript
// Person A: Age 25, wants 23-28
personA.q11 = {
  ownAnswer: 25,
  preference: { type: "specific_values", value: { min: 23, max: 28 } },
  importance: 4,
  dealbreaker: true,
};

// Person B: Age 26, wants 24-30
personB.q11 = {
  ownAnswer: 26,
  preference: { type: "specific_values", value: { min: 24, max: 30 } },
};

// A→B: 26 ∈ [23, 28] → 1.0
// B→A: 25 ∈ [24, 30] → 1.0
// Result: min(1.0, 1.0) = 1.0
```

### Type H: Different Preference Similarity

**Used for:** Sleep Schedule (Q28 partial)

**Logic:**

- Inverted Jaccard: `1 - Jaccard(A, B)`
- Rewards dissimilarity when both want `different`
- Perfect match: completely non-overlapping sets

**Example:**

```typescript
// Person A: Morning person, wants opposite
personA.q28 = { ownAnswer: ["morning"], preference: { type: "different" } };

// Person B: Night owl, wants opposite
personB.q28 = { ownAnswer: ["night"], preference: { type: "different" } };

// Jaccard = 0 (no overlap), distance = 1.0 → perfect match
```

### Type I: Special Case Similarity

**Used for:** Love Languages (Q21), Conflict Resolution (Q25), Political Views (Q29)

#### Q21: Love Languages (Bidirectional)

- Matches "show" with "receive" bidirectionally
- Person A shows what Person B wants to receive
- Person B shows what Person A wants to receive
- Average of both directions

```typescript
// Person A: Shows words, receives touch
personA.q21 = {
  ownAnswer: { show: ["words_of_affirmation"], receive: ["physical_touch"] },
};

// Person B: Shows touch, receives words
personB.q21 = {
  ownAnswer: { show: ["physical_touch"], receive: ["words_of_affirmation"] },
};

// A→B: A shows "words" ∩ B receives "words" → 1.0
// B→A: B shows "touch" ∩ A receives "touch" → 1.0
// Result: (1.0 + 1.0) / 2 = 1.0 (perfect complementary match)
```

#### Q25: Conflict Resolution (Compatibility Matrix)

- Pre-defined compatibility scores for style pairings
- Direct + Direct = 1.0 (best)
- Avoid + Direct = 0.3 (poor)
- Compromise + \* = 0.7-0.8 (good)

```typescript
// Compatibility matrix example:
const matrix = {
  direct_communication: {
    direct_communication: 1.0,
    compromise: 0.8,
    avoid_confrontation: 0.3,
    time_to_cool_down: 0.6,
  },
  // ... more combinations
};
```

#### Q29: Political Views (Wildcard)

- "flexible" wildcard matches anyone with 1.0
- Otherwise uses categorical matching (Type A)

```typescript
// Person A: Flexible politically
personA.q29 = { ownAnswer: "flexible" };

// Person B: Any political view
personB.q29 = { ownAnswer: "conservative" };

// Result: 1.0 (wildcard always matches)
```

---

## 8-Phase Matching Process

### Phase 1: Dealbreaker Hard Filters

**Purpose:** Eliminate fundamentally incompatible pairs early

**Hard Filters (Q1, Q2, Q4):**

- **Q1 (Gender Identity):** Both must accept each other's gender
- **Q2 (Sexual Orientation):** Must be mutually compatible ("anyone" is wildcard)
- **Q4 (Relationship Type):** Must want same relationship type

**Logic:**

- If ANY hard filter fails → pair is rejected
- Rejection reason is logged for transparency
- Does NOT use importance weights (binary pass/fail)

**Example:**

```typescript
// Candidate wants women only
candidate.q1 = {
  ownAnswer: "man",
  preference: { type: "specific", value: ["woman"] },
  dealbreaker: true,
};

// Match is a man
match.q1 = { ownAnswer: "man" };

// Result: REJECTED (hard filter Q1 failure)
```

### Phase 2: Question-Level Similarity

**Purpose:** Calculate raw similarity for each question

**Process:**

1. For each of 36 algorithm questions (Q1-Q36):
   - Determine question type (A-I)
   - Call appropriate similarity function
   - Get bidirectional score (0.0-1.0)
2. Store in `questionScores` array

**Note:** Q37-Q38 (free response) are NOT included in algorithm

### Phase 3: Importance Weighting

**Purpose:** Amplify scores for high-importance questions

**Formula:**

```
avgImportance = (personA.importance + personB.importance) / 2
weightedScore = similarity * (avgImportance / 4)
```

**Importance Scale:**

- 1 = Low importance (0.25× weight)
- 2 = Moderate importance (0.5× weight)
- 3 = High importance (0.75× weight)
- 4 = Critical importance (1.0× weight)

**Example:**

```typescript
// Q6 religion: similarity = 0.6
// Person A importance: 4 (critical)
// Person B importance: 2 (moderate)
// Avg importance: (4 + 2) / 2 = 3

weightedScore = 0.6 * (3 / 4) = 0.45
```

### Phase 4: Directional Scoring

**Purpose:** Ensure mutual compatibility

**Implementation:**

- Already handled in similarity functions via `min(A→B, B→A)`
- No additional processing needed in this phase

**Rationale:**

- Prevents one-sided matches
- Both parties must be satisfied with the pairing

### Phase 5: Section Weighting

**Purpose:** Prioritize lifestyle compatibility over personality traits

**Section Breakdown:**

- **Section 1 (Q1-Q20):** Lifestyle / Surface Compatibility (65%)
  - Includes: Gender, orientation, religion, exercise, hobbies, age, etc.
- **Section 2 (Q21-Q36):** Personality / Interaction Style (35%)
  - Includes: Love languages, communication, conflict, political views, etc.

**Formula:**

```
section1Score = sum(weighted scores for Q1-Q20) / 20
section2Score = sum(weighted scores for Q21-Q36) / 16

totalScore = (section1Score * 0.65) + (section2Score * 0.35)
```

**Rationale:**

- Lifestyle factors (religion, children, location) are harder to compromise on
- Personality compatibility is important but more adaptable
- 65/35 split reflects real-world relationship success factors

### Phase 6: Pair Score Construction

**Purpose:** Combine section scores into final compatibility score

**Output:**

```typescript
interface PairScore {
  userA: string;
  userB: string;
  questionScores: QuestionScore[]; // All 36 question details
  section1Score: number; // 0.0-1.0
  section2Score: number; // 0.0-1.0
  totalScore: number; // 0.0-1.0 (weighted combination)
  isEligible: boolean; // totalScore >= 0.4
}
```

### Phase 7: Eligibility Threshold

**Purpose:** Filter out low-quality matches

**Threshold:** 40% (0.4 total score minimum)

**Logic:**

- If `totalScore >= 0.4` → `isEligible = true`
- If `totalScore < 0.4` → `isEligible = false`
- Only eligible pairs proceed to Blossom

**Rationale:**

- Below 40% compatibility indicates poor match quality
- Prevents "settling" when better options exist
- Allows some users to remain unmatched rather than poorly matched

### Phase 8: Blossom Preparation

**Purpose:** Convert eligible pairs to weighted graph format

**Process:**

1. Filter to only eligible pairs (`isEligible === true`)
2. Scale scores to integer weights: `weight = Math.round(totalScore * 1000)`
3. Create edge for each pair: `{ from: userA, to: userB, weight }`

**Output:**

```typescript
interface BlossomEdge {
  from: string; // User ID
  to: string; // User ID
  weight: number; // 0-1000 (scaled from 0.0-1.0)
}
```

**Note:** Blossom algorithm runs externally using these edges

---

## Blossom Optimization

### What is Blossom?

The **Edmonds' Blossom algorithm** is a polynomial-time algorithm for finding maximum-weight perfect matchings in general graphs. It's used in the final phase to create globally optimal pairings.

### Why Blossom?

**Problem:** Greedy matching (pair highest scores first) is suboptimal.

**Example:**

```
Scores:
A-B: 0.9
A-C: 0.7
B-C: 0.8

Greedy: Pair A-B (0.9), leave C unmatched
Blossom: Pair A-C (0.7) + pair B with someone else → better global outcome
```

### Implementation

We use the `edmonds-blossom` npm package:

```typescript
import Blossom from "edmonds-blossom";

// Prepare edges
const edges: [string, string, number][] = eligiblePairs.map((pair) => [
  pair.userA,
  pair.userB,
  Math.round(pair.totalScore * 1000),
]);

// Run Blossom
const matching = Blossom(edges);

// Extract matched pairs
const finalPairs = matching
  .filter((partner) => partner !== -1)
  .map((partner, idx) => ({
    candidate: candidates[idx],
    match: matches[partner],
  }));
```

### Fallback Logic

If a user cannot be matched (no eligible pairs or odd number of users):

- User is marked as "unmatched"
- Can be re-entered in future matching rounds
- Cupids may manually create match if appropriate

---

## Scoring Formulas

### Question Score

```
rawSimilarity = similarityFunction(personA, personB, questionId)
avgImportance = (personA.importance + personB.importance) / 2
weightedScore = rawSimilarity * (avgImportance / 4)
```

### Section Score

```
section1Questions = Q1-Q20 (20 questions)
section2Questions = Q21-Q36 (16 questions)

section1Score = Σ(weightedScores for Q1-Q20) / 20
section2Score = Σ(weightedScores for Q21-Q36) / 16
```

### Total Score

```
totalScore = (section1Score * 0.65) + (section2Score * 0.35)
```

### Eligibility

```
isEligible = totalScore >= 0.4
```

### Blossom Weight

```
blossomWeight = Math.round(totalScore * 1000)
```

---

## Configuration

### Adjustable Parameters

Located in `algorithmV2.ts`:

```typescript
const SECTION_1_WEIGHT = 0.65; // Lifestyle weight
const SECTION_2_WEIGHT = 0.35; // Personality weight
const ELIGIBILITY_THRESHOLD = 0.4; // Minimum total score (40%)
```

### Section Definitions

```typescript
const SECTION_1_QUESTIONS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
  "q17",
  "q18",
  "q19",
  "q20",
];

const SECTION_2_QUESTIONS = [
  "q21",
  "q22",
  "q23",
  "q24",
  "q25",
  "q26",
  "q27",
  "q28",
  "q29",
  "q30",
  "q31",
  "q32",
  "q33",
  "q34",
  "q35",
  "q36",
];
```

### Question Type Mapping

Defined in `calculateSimilarity()` function in `similarityV2.ts`:

```typescript
const typeMap: Record<string, SimilarityType> = {
  q1: "A", // Categorical
  q2: "A", // Categorical (with wildcard)
  q3: "A", // Categorical
  // ... etc for all 36 questions
  q21: "I", // Special (love languages)
  q25: "I", // Special (conflict matrix)
  q29: "I", // Special (political wildcard)
};
```

---

## Performance Characteristics

### Time Complexity

- **Dealbreaker filtering:** O(n \* m) where n = candidates, m = matches
- **Similarity calculation:** O(n _ m _ q) where q = 36 questions
- **Blossom algorithm:** O(n³) worst case, O(n² log n) typical
- **Overall:** O(n _ m _ q + n³) ≈ O(n³) for large datasets

### Space Complexity

- **Pair scores:** O(n \* m) storage
- **Blossom edges:** O(eligible pairs) ≈ O(n \* m) worst case
- **Overall:** O(n \* m)

### Optimizations

1. **Early rejection:** Dealbreaker filter eliminates ~60-80% of pairs before scoring
2. **Eligibility filter:** Removes low-quality pairs before Blossom (saves O(n³) cost)
3. **Bidirectional calculation:** Single pass computes both A→B and B→A
4. **Integer weights:** Blossom uses integers (faster than floats)

---

## Testing

See `__tests__/similarityV2.test.ts` and `__tests__/algorithmV2.test.ts` for comprehensive test suite covering:

- All 9 similarity types
- Edge cases (wildcards, dealbreakers, special cases)
- Full algorithm pipeline
- Eligibility filtering
- Blossom preparation

Run tests:

```bash
npm test
```

---

## Future Enhancements

### Potential Improvements

1. **Machine Learning Integration:**
   - Train weights from historical cupid decisions
   - Predict optimal section weights per user demographic
   - Personalized importance scaling

2. **Dynamic Thresholds:**
   - Adjust eligibility threshold based on pool size
   - Lower threshold when fewer matches available

3. **Multi-Round Matching:**
   - Run multiple Blossom iterations with different constraints
   - Allow partial preferences in subsequent rounds

4. **Feedback Loop:**
   - Track match success rates
   - Fine-tune similarity functions based on outcomes

5. **Geographic Optimization:**
   - Add location-based bonus/penalty
   - Balance compatibility vs. distance

---

## References

- **Edmonds' Blossom Algorithm:** Edmonds, J. (1965). "Paths, trees, and flowers"
- **Jaccard Index:** Jaccard, P. (1912). "The distribution of the flora in the alpine zone"
- **Maximum Weight Matching:** Galil, Z. (1986). "Efficient algorithms for finding maximum matching in graphs"

---

## Support

For questions or issues with the matching algorithm:

- Review test files for usage examples
- Check `similarityV2.ts` inline documentation
- Consult `algorithmV2.ts` phase comments
- See migration guide for V1→V2 transition details
