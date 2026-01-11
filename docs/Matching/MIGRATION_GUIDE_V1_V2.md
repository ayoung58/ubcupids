# Migration Guide: V1 → V2 Questionnaire System

## Overview

This guide covers the migration from the original questionnaire system (V1) to the enhanced V2 system with nested response structure, preference types, and improved matching algorithm.

## Table of Contents

1. [Key Changes](#key-changes)
2. [Response Format Migration](#response-format-migration)
3. [API Changes](#api-changes)
4. [UI Component Updates](#ui-component-updates)
5. [Database Schema](#database-schema)
6. [Matching Algorithm Changes](#matching-algorithm-changes)
7. [Cupid Dashboard Updates](#cupid-dashboard-updates)
8. [Migration Steps](#migration-steps)
9. [Backward Compatibility](#backward-compatibility)
10. [Testing Strategy](#testing-strategy)

---

## Key Changes

### V1 System

- Flat response structure: `{ q1: "answer", q2: 3, ... }`
- Simple importance scale (1-5)
- Basic similarity scoring
- No preference specification
- No dealbreaker flags

### V2 System

- Nested response structure with `ownAnswer`, `preference`, `importance`, `dealbreaker`
- 8 preference types (same, similar, different, compatible, more, less, specific_values, doesntMatter)
- 9 specialized similarity functions (Types A-I)
- 8-phase matching algorithm with section weighting
- Blossom optimization for global matching
- Importance scale 1-4 (simplified)
- Explicit dealbreaker support

---

## Response Format Migration

### V1 Format

```typescript
// Old responses structure
type ResponsesV1 = {
  q1: string;
  q2: string;
  q3: string;
  q4: number;
  q5: string[];
  // ... etc
};

// Example
const responsesV1 = {
  q1: "man",
  q2: "straight",
  q3: "asian",
  q4: 3, // importance 1-5
  q5: ["reading", "hiking"],
};
```

### V2 Format

```typescript
// New responses structure
type ResponsesV2 = {
  [key: string]: QuestionResponse;
};

interface QuestionResponse {
  ownAnswer: ResponseValue;
  preference: {
    type: PreferenceType;
    value?: ResponseValue;
    doesntMatter: boolean;
  };
  importance: number; // 1-4
  dealbreaker: boolean;
}

// Example
const responsesV2 = {
  q1: {
    ownAnswer: "man",
    preference: {
      type: "specific",
      value: ["woman"],
      doesntMatter: false,
    },
    importance: 4,
    dealbreaker: true,
  },
  q2: {
    ownAnswer: "straight",
    preference: {
      type: "specific",
      value: ["straight", "bisexual"],
      doesntMatter: false,
    },
    importance: 4,
    dealbreaker: true,
  },
  q3: {
    ownAnswer: "asian",
    preference: {
      type: "doesntMatter",
      doesntMatter: true,
    },
    importance: 1,
    dealbreaker: false,
  },
  q5: {
    ownAnswer: ["reading", "hiking"],
    preference: {
      type: "similar",
      doesntMatter: false,
    },
    importance: 3,
    dealbreaker: false,
  },
};
```

### Conversion Script

```typescript
/**
 * Convert V1 responses to V2 format
 * Note: This is a BEST GUESS conversion - manual review recommended
 */
function convertV1ToV2(responsesV1: ResponsesV1): ResponsesV2 {
  const responsesV2: ResponsesV2 = {};

  for (const [questionId, answer] of Object.entries(responsesV1)) {
    // Skip if undefined
    if (answer === undefined || answer === null) continue;

    // Default V2 structure
    responsesV2[questionId] = {
      ownAnswer: answer,
      preference: {
        type: "similar", // Default to "similar" preference
        doesntMatter: false,
      },
      importance: 2, // Default to moderate importance
      dealbreaker: false,
    };

    // Special cases based on question type
    switch (questionId) {
      case "q1": // Gender
      case "q2": // Orientation
      case "q4": // Relationship type
        // These are typically "specific" preferences
        responsesV2[questionId].preference.type = "specific";
        responsesV2[questionId].importance = 4;
        responsesV2[questionId].dealbreaker = true;
        break;

      case "q3": // Sexual orientation
      case "q5": // Cultural background
      case "q6": // Religion
        // Often "same" or "doesntMatter"
        responsesV2[questionId].preference.type = "same";
        responsesV2[questionId].importance = 3;
        break;

      case "q11": // Age
        // Create default age range (±3 years)
        const age = answer as number;
        responsesV2[questionId].preference = {
          type: "specific_values",
          value: { min: age - 3, max: age + 3 },
          doesntMatter: false,
        };
        responsesV2[questionId].importance = 4;
        responsesV2[questionId].dealbreaker = true;
        break;

      case "q9": // Drug use
        // Convert to compound structure if needed
        if (typeof answer === "string") {
          responsesV2[questionId].ownAnswer = {
            substance: answer,
            frequency: null,
          };
        }
        break;

      case "q21": // Love languages
        // Convert to show/receive structure
        if (Array.isArray(answer)) {
          responsesV2[questionId].ownAnswer = {
            show: answer,
            receive: answer, // Assume same for both
          };
        }
        break;
    }
  }

  return responsesV2;
}
```

---

## API Changes

### Save Questionnaire Endpoint

#### V1: `/api/questionnaire/save`

```typescript
// Request body (V1)
{
  responses: {
    q1: "man",
    q2: "straight",
    q3: 3
  },
  sectionProgress: {
    section1: true,
    section2: false
  }
}
```

#### V2: `/api/questionnaire/save` (Same endpoint, new format)

```typescript
// Request body (V2)
{
  responses: {
    q1: {
      ownAnswer: "man",
      preference: { type: "specific", value: ["woman"], doesntMatter: false },
      importance: 4,
      dealbreaker: true
    },
    q2: {
      ownAnswer: "straight",
      preference: { type: "specific", value: ["straight", "bisexual"], doesntMatter: false },
      importance: 4,
      dealbreaker: true
    },
    q3: {
      ownAnswer: 3,
      preference: { type: "similar", doesntMatter: false },
      importance: 3,
      dealbreaker: false
    }
  },
  sectionProgress: {
    section1: true,
    section2: false
  }
}
```

**Validation:** The API now validates the nested structure:

```typescript
const QuestionResponseSchema = z.object({
  ownAnswer: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.record(z.any()),
  ]),
  preference: z.object({
    type: z.enum([
      "same",
      "similar",
      "different",
      "compatible",
      "more",
      "less",
      "specific_values",
      "doesntMatter",
    ]),
    value: z.any().optional(),
    doesntMatter: z.boolean(),
  }),
  importance: z.number().min(1).max(4),
  dealbreaker: z.boolean(),
});
```

### Matching Algorithm Endpoint

#### V1: `/api/admin/matching/run-algorithm`

```typescript
// Request
POST / api / admin / matching / run - algorithm;
{
  testMode: true;
}

// Response
{
  matches: [
    {
      candidateId: "abc123",
      matchId: "def456",
      score: 0.85,
    },
  ];
}
```

#### V2: `/api/admin/start-matching-v2`

```typescript
// Request
POST /api/admin/start-matching-v2
{
  testMode: true
}

// Response
{
  success: true,
  matchesCreated: 42,
  eligiblePairs: 58,
  filteredByDealbreaker: 120,
  filteredByThreshold: 16,
  unmatchedCandidates: 3,
  unmatchedMatches: 2,
  details: {
    totalCandidates: 100,
    totalMatches: 100,
    averageScore: 0.67,
    highestScore: 0.94,
    lowestEligibleScore: 0.43
  }
}
```

### Test User Generation

#### V1: `/api/admin/generate-test-users`

```typescript
POST /api/admin/generate-test-users
{
  count: 125,
  userType: "match"
}
```

#### V2: `/api/admin/seed-test-users-v2`

```typescript
POST / api / admin / seed - test - users - v2;
{
  userType: "match"; // or "cupid"
}

// Always generates 125 users with full V2 responses
```

---

## UI Component Updates

### Questionnaire Components

#### V1 Components (Deprecated)

- `QuestionnaireForm.tsx` → Basic form with simple inputs
- `SectionRenderer.tsx` → Flat question display
- `QuestionRenderer.tsx` → Single answer field
- Importance slider (1-5 scale)

#### V2 Components (Current)

- `QuestionnaireFormV2.tsx` → Enhanced form with split-screen
- `SectionRendererV2.tsx` → Nested response handling
- `QuestionRendererV2.tsx` → Two-column layout (answer | preference)
- `PreferenceSelector.tsx` → 8 preference types
- `ImportanceSelectorV2.tsx` → 1-4 scale with descriptions
- `DealBreakerToggle.tsx` → Dealbreaker flag
- `DoesntMatterButton.tsx` → Quick "doesn't matter" toggle
- `DealBreakerConfirmDialog.tsx` → Confirmation for dealbreakers

### Migration Example

```typescript
// V1 Component
function QuestionV1({ questionId, value, onChange }) {
  return (
    <div>
      <label>Your answer:</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// V2 Component
function QuestionV2({ questionId, response, onChange }) {
  const handleOwnAnswerChange = (answer) => {
    onChange({
      ...response,
      ownAnswer: answer
    });
  };

  const handlePreferenceChange = (preference) => {
    onChange({
      ...response,
      preference: preference
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left column: Own answer */}
      <div>
        <label>Your answer:</label>
        <input
          value={response.ownAnswer}
          onChange={(e) => handleOwnAnswerChange(e.target.value)}
        />
      </div>

      {/* Right column: Preference */}
      <div>
        <label>Your preference:</label>
        <PreferenceSelector
          value={response.preference}
          onChange={handlePreferenceChange}
          questionType={getQuestionType(questionId)}
        />
        <ImportanceSelectorV2
          value={response.importance}
          onChange={(imp) => onChange({ ...response, importance: imp })}
        />
        <DealBreakerToggle
          checked={response.dealbreaker}
          onChange={(db) => onChange({ ...response, dealbreaker: db })}
        />
      </div>
    </div>
  );
}
```

---

## Database Schema

### V1 Schema

```prisma
model QuestionnaireResponse {
  id        String   @id @default(cuid())
  userId    String   @unique
  responses Json     // Flat: { q1: "answer", q2: 3, ... }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

### V2 Schema (Same structure, different JSON format)

```prisma
model QuestionnaireResponse {
  id        String   @id @default(cuid())
  userId    String   @unique
  responses Json     // Nested: { q1: { ownAnswer, preference, importance, dealbreaker }, ... }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

**Migration:** No schema change needed! The `responses` field is already JSON, so V2 just uses a different JSON structure.

**Data Migration:**

```typescript
// Migrate existing user responses
async function migrateResponsesToV2() {
  const allResponses = await prisma.questionnaireResponse.findMany();

  for (const record of allResponses) {
    const v1Responses = record.responses as ResponsesV1;
    const v2Responses = convertV1ToV2(v1Responses);

    await prisma.questionnaireResponse.update({
      where: { id: record.id },
      data: { responses: v2Responses },
    });
  }

  console.log(`Migrated ${allResponses.length} responses to V2 format`);
}
```

---

## Matching Algorithm Changes

### V1 Algorithm

- Simple similarity scoring (flat responses)
- Single importance value per user
- No dealbreaker support
- No section weighting
- Greedy matching (highest score first)

### V2 Algorithm

- 9 specialized similarity types
- Bidirectional scoring (A→B and B→A)
- Importance weighting (averaged between users)
- Dealbreaker hard filters (Q1, Q2, Q4)
- Section weighting (65% lifestyle, 35% personality)
- Eligibility threshold (40% minimum)
- Blossom global optimization

### Scoring Comparison

```typescript
// V1 Score Calculation
function calculateScoreV1(personA, personB) {
  let totalScore = 0;
  for (const questionId of questions) {
    const similarity = compareTo(personA[questionId], personB[questionId]);
    const importance =
      (personA.importance[questionId] + personB.importance[questionId]) / 2;
    totalScore += similarity * importance;
  }
  return totalScore / questions.length;
}

// V2 Score Calculation
function calculateScoreV2(personA, personB) {
  // Phase 1: Hard filters
  if (!passesHardFilters(personA, personB)) return null;

  // Phase 2-5: Question scoring with importance
  const questionScores = questions.map((qid) => {
    const similarity = calculateSimilarity(personA[qid], personB[qid], qid);
    const avgImportance =
      (personA[qid].importance + personB[qid].importance) / 2;
    return similarity * (avgImportance / 4);
  });

  // Phase 6: Section weighting
  const section1 = average(questionScores.slice(0, 20));
  const section2 = average(questionScores.slice(20, 36));
  const totalScore = section1 * 0.65 + section2 * 0.35;

  // Phase 7: Eligibility
  return totalScore >= 0.4 ? totalScore : null;
}
```

---

## Cupid Dashboard Updates

### V1 Display

```typescript
// V1: Simple answer display
function QuestionDisplay({ question, answer }) {
  return (
    <div>
      <strong>{question.text}</strong>
      <p>{formatAnswer(answer)}</p>
    </div>
  );
}
```

### V2 Display

```typescript
// V2: Nested response display with preferences
function QuestionDisplay({ question, response }) {
  const isV2 = "ownAnswer" in response;

  if (!isV2) {
    // V1 fallback
    return <div>{formatAnswer(response)}</div>;
  }

  return (
    <div className="space-y-2">
      {/* Own answer */}
      <div>
        <strong>Answer:</strong> {formatAnswer(response.ownAnswer)}
      </div>

      {/* Preference */}
      <div className="pl-4 border-l-2 border-blue-400">
        <strong>Preference:</strong> {formatPreference(response.preference)}
        <div className="flex gap-2 mt-1">
          <ImportanceBadge level={response.importance} />
          {response.dealbreaker && <DealBreakerBadge />}
        </div>
      </div>
    </div>
  );
}
```

### Key Changes

1. **Preference Display:** Cupids now see what each person is looking for
2. **Importance Badges:** Color-coded badges (purple=4, blue=3, slate=2, gray=1)
3. **Dealbreaker Warnings:** Red badges with ⚠️ for dealbreakers
4. **Visual Hierarchy:** Nested indentation shows preference under answer
5. **Free Response Visibility:** Q37-Q38 shown to cupids (not in algorithm)

---

## Migration Steps

### Step 1: Update Dependencies

```bash
npm install edmonds-blossom
```

### Step 2: Deploy V2 Code (Backward Compatible)

1. Deploy all V2 components (QuestionRendererV2, etc.)
2. Keep V1 components as fallback
3. Add V2 API routes alongside V1
4. Update admin dashboard to use V2 endpoints

### Step 3: Migrate Existing User Data

```bash
# Run migration script
npm run migrate-to-v2
```

```typescript
// scripts/migrate-to-v2.ts
import { PrismaClient } from "@prisma/client";
import { convertV1ToV2 } from "../lib/utils/migration";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.questionnaireResponse.findMany();

  for (const user of users) {
    const responses = user.responses as any;

    // Check if already V2 format
    const firstKey = Object.keys(responses)[0];
    if (responses[firstKey]?.ownAnswer !== undefined) {
      console.log(`User ${user.userId} already V2 format`);
      continue;
    }

    // Convert to V2
    const v2Responses = convertV1ToV2(responses);

    await prisma.questionnaireResponse.update({
      where: { id: user.id },
      data: { responses: v2Responses },
    });

    console.log(`Migrated user ${user.userId} to V2`);
  }

  console.log("Migration complete!");
}

main();
```

### Step 4: Switch Default to V2

1. Update questionnaire routes to use V2 by default
2. Admin dashboard uses V2 endpoints
3. Cupid dashboard displays V2 format

### Step 5: Deprecate V1 (Optional)

After confirming V2 stability:

1. Remove V1 components from codebase
2. Remove V1 API routes
3. Update documentation to V2 only

---

## Backward Compatibility

### V1 Response Detection

```typescript
function isV1Format(responses: any): boolean {
  // V1: Direct values
  // V2: Nested objects with ownAnswer
  const firstQuestion = responses[Object.keys(responses)[0]];
  return typeof firstQuestion !== "object" || !("ownAnswer" in firstQuestion);
}
```

### Dual-Format Support

```typescript
function getAnswer(response: any): any {
  if (typeof response !== "object") return response; // V1
  if ("ownAnswer" in response) return response.ownAnswer; // V2
  return response; // Unknown format
}

function getImportance(response: any, defaultValue = 2): number {
  if (typeof response !== "object") return defaultValue; // V1
  if ("importance" in response) return response.importance; // V2
  return defaultValue;
}
```

### Gradual Migration

Users can be migrated incrementally:

- **New users:** Always V2 format from signup
- **Existing users:** Convert on next questionnaire edit
- **Legacy users:** Convert via batch migration script

---

## Testing Strategy

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test similarityV2.test.ts
npm test algorithmV2.test.ts
```

### Integration Tests

1. **Test V1 → V2 conversion:**
   - Create V1 response
   - Convert to V2
   - Verify all fields present
   - Verify defaults are reasonable

2. **Test matching algorithm:**
   - Generate test users
   - Run matching
   - Verify dealbreakers respected
   - Verify eligibility threshold enforced
   - Verify Blossom produces valid pairings

3. **Test cupid dashboard:**
   - Load V1 and V2 responses
   - Verify both display correctly
   - Verify preference display accurate

### Manual Testing Checklist

- [ ] New user completes V2 questionnaire
- [ ] Existing V1 user edits responses (auto-converts to V2)
- [ ] Admin generates V2 test users
- [ ] Admin runs V2 matching algorithm
- [ ] Cupids review matches with V2 display
- [ ] Verify dealbreakers prevent pairings
- [ ] Verify "doesn't matter" boosts compatibility
- [ ] Verify importance weights affect scores

---

## Troubleshooting

### Common Issues

**Issue:** V1 responses not displaying on cupid dashboard

**Solution:** Add V1 fallback detection in display component:

```typescript
const isV2 = response && typeof response === "object" && "ownAnswer" in response;
if (!isV2) return <V1Display response={response} />;
```

---

**Issue:** Matching algorithm returns no pairs

**Solution:** Check eligibility threshold (may be too strict):

```typescript
// Temporarily lower threshold for debugging
const ELIGIBILITY_THRESHOLD = 0.3; // Was 0.4
```

---

**Issue:** Migration script fails on invalid responses

**Solution:** Add error handling and logging:

```typescript
try {
  const v2 = convertV1ToV2(v1Responses);
  await prisma.update({ data: { responses: v2 } });
} catch (error) {
  console.error(`Failed to migrate user ${userId}:`, error);
  // Skip this user and continue
}
```

---

## Rollback Plan

If V2 causes critical issues:

### Step 1: Revert Code Deploy

```bash
git revert <v2-commit-hash>
git push
```

### Step 2: Revert Database (if needed)

```bash
# Restore from backup
npm run restore-database-backup
```

### Step 3: Switch Admin Dashboard Back to V1

Update `AdminDashboardClient.tsx`:

```typescript
// Change back to V1 endpoints
const response = await fetch("/api/admin/generate-test-users"); // Not seed-test-users-v2
```

---

## Support & Resources

- **Algorithm Docs:** `docs/Matching/MATCHING_ALGORITHM_V2_DOCS.md`
- **Test Files:** `lib/matching/__tests__/*.test.ts`
- **Example Responses:** Check `seed-test-users-v2` route
- **Component Examples:** See `QuestionRendererV2.tsx`

For questions or issues, review the comprehensive tests and documentation files for detailed implementation examples.
