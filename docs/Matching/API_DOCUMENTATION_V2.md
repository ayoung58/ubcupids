# API Documentation - Questionnaire V2

## Overview

This document describes all API endpoints related to the V2 questionnaire and matching system.

---

## Table of Contents

1. [Questionnaire Endpoints](#questionnaire-endpoints)
2. [Admin Endpoints](#admin-endpoints)
3. [Matching Endpoints](#matching-endpoints)
4. [Response Schemas](#response-schemas)
5. [Error Handling](#error-handling)

---

## Questionnaire Endpoints

### Save Questionnaire Progress

**Endpoint:** `POST /api/questionnaire/save`

**Description:** Saves partial or complete questionnaire responses for a user.

**Authentication:** Required (session-based)

**Request Body:**

```json
{
  "responses": {
    "q1": {
      "ownAnswer": "man",
      "preference": {
        "type": "specific",
        "value": ["woman"],
        "doesntMatter": false
      },
      "importance": 4,
      "dealbreaker": true
    },
    "q2": {
      "ownAnswer": "straight",
      "preference": {
        "type": "specific",
        "value": ["straight", "bisexual"],
        "doesntMatter": false
      },
      "importance": 4,
      "dealbreaker": true
    }
  },
  "sectionProgress": {
    "section1": true,
    "section2": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Questionnaire saved successfully"
}
```

**Errors:**

- `401 Unauthorized` - User not logged in
- `400 Bad Request` - Invalid response format
- `500 Internal Server Error` - Database error

---

### Submit Questionnaire

**Endpoint:** `POST /api/questionnaire/submit`

**Description:** Submits complete questionnaire and marks user as ready for matching.

**Authentication:** Required

**Request Body:**

```json
{
  "responses": {
    "q1": {
      /* QuestionResponse */
    },
    "q2": {
      /* QuestionResponse */
    }
    // ... all 38 questions
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Questionnaire submitted successfully",
  "userId": "abc123"
}
```

**Validation:**

- All 38 questions must be present (Q1-Q38)
- Each response must have valid structure
- Importance must be 1-4
- Preference type must be valid enum

**Errors:**

- `400 Bad Request` - Missing required questions
- `400 Bad Request` - Invalid response structure

---

### Get User's Questionnaire

**Endpoint:** `GET /api/questionnaire`

**Description:** Retrieves saved questionnaire responses for the logged-in user.

**Authentication:** Required

**Query Parameters:** None

**Response:**

```json
{
  "responses": {
    "q1": {
      /* QuestionResponse */
    },
    "q2": {
      /* QuestionResponse */
    }
  },
  "sectionProgress": {
    "section1": true,
    "section2": true
  },
  "completedAt": "2026-01-10T12:34:56Z",
  "isComplete": true
}
```

**Errors:**

- `404 Not Found` - User has not started questionnaire

---

## Admin Endpoints

### Seed Test Users (V2)

**Endpoint:** `POST /api/admin/seed-test-users-v2`

**Description:** Generates 125 test users with realistic V2 questionnaire responses.

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "userType": "match" // or "cupid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Generated 125 test users",
  "users": [
    {
      "id": "user1",
      "email": "testmatch1@ubcupids.test",
      "role": "MATCH"
    }
  ]
}
```

**Generated Data:**

- Randomized V2 responses for all 38 questions
- Varied preference types (same, similar, specific, etc.)
- Realistic importance distributions (more 3s and 4s)
- Random dealbreaker flags (~20% of high-importance questions)
- Diverse demographics (gender, orientation, cultural backgrounds)

**Errors:**

- `403 Forbidden` - User is not admin
- `500 Internal Server Error` - Generation failed

---

### Start Matching Algorithm (V2)

**Endpoint:** `POST /api/admin/start-matching-v2`

**Description:** Runs the complete V2 matching algorithm with Blossom optimization.

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "testMode": true // or false for production
}
```

**Response:**

```json
{
  "success": true,
  "matchesCreated": 42,
  "eligiblePairs": 58,
  "filteredByDealbreaker": 120,
  "filteredByThreshold": 16,
  "unmatchedCandidates": 3,
  "unmatchedMatches": 2,
  "details": {
    "totalCandidates": 100,
    "totalMatches": 100,
    "averageScore": 0.67,
    "highestScore": 0.94,
    "lowestEligibleScore": 0.43,
    "executionTimeMs": 1523
  }
}
```

**Process:**

1. Fetch all unmatched candidates and matches
2. Run 8-phase matching algorithm
3. Execute Blossom optimization on eligible pairs
4. Create Match records in database
5. Update user statuses

**testMode:**

- `true`: Uses test users only, doesn't affect production data
- `false`: Uses real users, creates actual matches

**Errors:**

- `403 Forbidden` - User is not admin
- `500 Internal Server Error` - Algorithm execution failed

---

### Get Algorithm Stats

**Endpoint:** `GET /api/admin/matching/stats`

**Description:** Get statistics about the matching algorithm performance.

**Authentication:** Required (admin only)

**Response:**

```json
{
  "totalMatches": 420,
  "averageCompatibility": 0.72,
  "recentMatches": [
    {
      "candidateId": "abc",
      "matchId": "def",
      "score": 0.88,
      "createdAt": "2026-01-10T10:00:00Z"
    }
  ],
  "distributionByScore": {
    "0.4-0.5": 12,
    "0.5-0.6": 35,
    "0.6-0.7": 68,
    "0.7-0.8": 142,
    "0.8-0.9": 98,
    "0.9-1.0": 65
  }
}
```

---

## Matching Endpoints

### Get Cupid's Assigned Matches

**Endpoint:** `GET /api/cupid/assigned-matches`

**Description:** Retrieves all matches assigned to the logged-in cupid for review.

**Authentication:** Required (cupid role)

**Query Parameters:**

- `status` (optional): Filter by status ("pending", "selected", "rejected")
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**

```json
{
  "matches": [
    {
      "id": "match123",
      "candidate": {
        "id": "candidate1",
        "name": "John Doe",
        "age": 25,
        "responses": {
          /* V2 responses */
        },
        "profileHighlights": [
          { "question": "Hobbies", "answer": "Hiking, Reading, Cooking" }
        ]
      },
      "match": {
        "id": "match1",
        "name": "Jane Smith",
        "age": 24,
        "responses": {
          /* V2 responses */
        }
      },
      "compatibilityScore": 0.88,
      "algorithmScores": {
        "section1": 0.9,
        "section2": 0.85,
        "total": 0.88
      },
      "status": "pending",
      "assignedAt": "2026-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Cupid Decision (Accept)

**Endpoint:** `POST /api/cupid/decide`

**Description:** Cupid accepts a match pairing.

**Authentication:** Required (cupid role)

**Request Body:**

```json
{
  "matchPairId": "match123",
  "notes": "Great compatibility across lifestyle and values"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Match accepted",
  "matchPair": {
    "id": "match123",
    "status": "selected",
    "cupidNotes": "Great compatibility..."
  }
}
```

---

### Cupid Decision (Reject)

**Endpoint:** `POST /api/cupid/reject-match`

**Description:** Cupid rejects a match pairing.

**Authentication:** Required (cupid role)

**Request Body:**

```json
{
  "matchPairId": "match123",
  "reason": "Lifestyle incompatibility - conflicting career goals",
  "severity": "major" // or "minor"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Match rejected",
  "matchPair": {
    "id": "match123",
    "status": "rejected",
    "rejectionReason": "Lifestyle incompatibility..."
  }
}
```

---

### Reveal More Details

**Endpoint:** `POST /api/cupid/reveal-more`

**Description:** Unlock additional profile details for a match pair (if restricted initially).

**Authentication:** Required (cupid role)

**Request Body:**

```json
{
  "matchPairId": "match123",
  "section": "section2" // or "full"
}
```

**Response:**

```json
{
  "success": true,
  "revealedData": {
    "candidate": {
      /* Additional responses */
    },
    "match": {
      /* Additional responses */
    }
  }
}
```

---

## Response Schemas

### QuestionResponse Schema

```typescript
interface QuestionResponse {
  ownAnswer: ResponseValue;
  preference: {
    type:
      | "same"
      | "similar"
      | "different"
      | "compatible"
      | "more"
      | "less"
      | "specific_values"
      | "doesntMatter";
    value?: ResponseValue;
    doesntMatter: boolean;
  };
  importance: 1 | 2 | 3 | 4;
  dealbreaker: boolean;
}

type ResponseValue =
  | string
  | number
  | string[]
  | { substance: string; frequency: string | null } // Drug use
  | { show: string[]; receive: string[] } // Love languages
  | { min: number; max: number }; // Age range
```

### Preference Type Descriptions

| Type              | Usage                    | Example                              |
| ----------------- | ------------------------ | ------------------------------------ |
| `same`            | Exact match required     | "I want someone with same religion"  |
| `similar`         | Close/adjacent values    | "I want similar exercise habits"     |
| `different`       | Opposite/complementary   | "I want opposite sleep schedule"     |
| `compatible`      | Accepts multiple options | "I'm okay with A, B, or C"           |
| `more`            | Higher ordinal value     | "I want someone who exercises more"  |
| `less`            | Lower ordinal value      | "I want someone who drinks less"     |
| `specific_values` | Must be in set/range     | "Age must be 25-30"                  |
| `doesntMatter`    | No preference            | "Cultural background doesn't matter" |

### Importance Levels

| Level | Description         | Weight |
| ----- | ------------------- | ------ |
| 1     | Low importance      | 0.25×  |
| 2     | Moderate importance | 0.5×   |
| 3     | High importance     | 0.75×  |
| 4     | Critical importance | 1.0×   |

---

## Error Handling

### Standard Error Format

All endpoints return errors in this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "reason": "Specific validation error"
  }
}
```

### Common Error Codes

| Code                       | HTTP Status | Description                        |
| -------------------------- | ----------- | ---------------------------------- |
| `UNAUTHORIZED`             | 401         | User not authenticated             |
| `FORBIDDEN`                | 403         | User lacks required permissions    |
| `NOT_FOUND`                | 404         | Resource not found                 |
| `VALIDATION_ERROR`         | 400         | Invalid request data               |
| `MISSING_REQUIRED_FIELD`   | 400         | Required field missing             |
| `INVALID_RESPONSE_FORMAT`  | 400         | QuestionResponse structure invalid |
| `INCOMPLETE_QUESTIONNAIRE` | 400         | Not all 38 questions answered      |
| `DATABASE_ERROR`           | 500         | Database operation failed          |
| `ALGORITHM_ERROR`          | 500         | Matching algorithm failed          |

### Example Error Responses

**Missing Required Field:**

```json
{
  "error": "Missing required question",
  "code": "MISSING_REQUIRED_FIELD",
  "details": {
    "question": "q1",
    "reason": "Gender identity is required for matching"
  }
}
```

**Invalid Preference Type:**

```json
{
  "error": "Invalid preference type",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "responses.q7.preference.type",
    "provided": "exact",
    "expected": [
      "same",
      "similar",
      "different",
      "compatible",
      "more",
      "less",
      "specific_values",
      "doesntMatter"
    ]
  }
}
```

**Authentication Error:**

```json
{
  "error": "You must be logged in to access this resource",
  "code": "UNAUTHORIZED"
}
```

**Permission Error:**

```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN",
  "details": {
    "requiredRole": "ADMIN",
    "userRole": "MATCH"
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Questionnaire endpoints:** 100 requests per 15 minutes per user
- **Admin endpoints:** 50 requests per 15 minutes per admin
- **Cupid endpoints:** 200 requests per 15 minutes per cupid

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1673355600
```

**Rate Limit Exceeded:**

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

---

## Webhooks (Future)

**Planned webhook events:**

- `match.created` - New match pair created
- `match.decided` - Cupid made decision
- `questionnaire.completed` - User finished questionnaire

**Webhook payload format:**

```json
{
  "event": "match.created",
  "timestamp": "2026-01-10T12:34:56Z",
  "data": {
    "matchId": "match123",
    "candidateId": "candidate1",
    "matchUserId": "match1",
    "score": 0.88
  }
}
```

---

## Testing Endpoints

For testing purposes, the following additional endpoints are available:

### Reset Test Data

**Endpoint:** `POST /api/admin/reset-test-data`

**Description:** Deletes all test users and matches (emails ending in `.test`)

**Authentication:** Required (admin only, test mode only)

---

### Generate Specific Test Case

**Endpoint:** `POST /api/admin/generate-test-case`

**Description:** Create users with specific response patterns for testing edge cases.

**Request Body:**

```json
{
  "scenario": "high_dealbreakers", // or "all_doesnt_matter", "opposite_preferences", etc.
  "count": 10
}
```

---

## Best Practices

1. **Always validate responses client-side** before submitting
2. **Use incremental saves** to prevent data loss (save progress every 3-5 questions)
3. **Handle 401 errors** by redirecting to login
4. **Show loading states** during long operations (matching algorithm takes 1-3 seconds)
5. **Cache questionnaire config** to avoid repeated fetches
6. **Use optimistic updates** for better UX (show success before server confirms)

---

## SDKs & Examples

### JavaScript/TypeScript

```typescript
// Save questionnaire progress
async function saveProgress(responses: Responses) {
  const res = await fetch("/api/questionnaire/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

// Submit complete questionnaire
async function submitQuestionnaire(responses: Responses) {
  const res = await fetch("/api/questionnaire/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });

  if (!res.ok) throw new Error("Submission failed");
  return res.json();
}

// Admin: Seed test users
async function seedTestUsers(userType: "match" | "cupid") {
  const res = await fetch("/api/admin/seed-test-users-v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userType }),
  });

  return res.json();
}

// Admin: Run matching
async function runMatching(testMode: boolean) {
  const res = await fetch("/api/admin/start-matching-v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testMode }),
  });

  return res.json();
}
```

---

## Changelog

### V2 (Current)

- Added nested `QuestionResponse` structure
- Added 8 preference types
- Added dealbreaker support
- Added importance scale (1-4)
- Added section weighting to matching
- Added Blossom optimization endpoint
- Added cupid decision endpoints

### V1 (Deprecated)

- Flat response structure
- Simple importance (1-5)
- Basic matching algorithm
- No preference specification

---

## Support

For API questions or issues:

- Check inline code documentation in `app/api/` routes
- Review test files for usage examples
- Consult algorithm documentation for matching logic
- Contact development team for clarification
