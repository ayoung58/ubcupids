# API Routes Testing Guide

## Created API Endpoints

### 1. GET /api/questionnaire
**Purpose:** Fetch user's current questionnaire responses

**Authentication:** Required (session-based)

**Thunder Client input**

Method: GET
URL: http://localhost:3000/api/questionnaire
Headers:
  Cookie: next-auth.session-token=YOUR_SESSION_TOKEN_HERE

**Response:**
```json
{
  "responses": {
    "q0.1": "man",
    "q1": "pizza",
    "q2": "sleep-noon"
  },
  "importance": {
    "q1": "very-important"
  },
  "isSubmitted": false,
  "submittedAt": null
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not logged in)
- `500` - Server error

---

### 2. POST /api/questionnaire/save
**Purpose:** Save questionnaire as draft (allows future editing)

**Authentication:** Required (session-based)

**Request Body:**
```json
{
  "responses": {
    "q0.1": "woman",
    "q1": "sushi",
    "q2": ["men", "women"]
  },
  "importance": {
    "q1": "dealbreaker"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Draft saved successfully"
}
```

**Status Codes:**
- `200` - Draft saved
- `400` - Invalid request data (Zod validation failed)
- `401` - Unauthorized
- `403` - Questionnaire already submitted (cannot edit)
- `500` - Server error

---

### 3. POST /api/questionnaire/submit
**Purpose:** Submit questionnaire as final (locks responses)

**Authentication:** Required (session-based)

**Request Body:**
```json
{
  "responses": {
    "q0.1": "man",
    "q1": "pizza",
    ...all 60 questions...
  },
  "importance": {
    "q1": "very-important",
    "q56": "dealbreaker"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questionnaire submitted successfully"
}
```

**Status Codes:**
- `200` - Successfully submitted
- `400` - Validation failed (missing required questions) or already submitted
- `401` - Unauthorized
- `500` - Server error

**Validation Errors:**
```json
{
  "error": "Please answer all required questions",
  "details": [
    "\"What's your gender identity?\" is required",
    "\"It's 2am and you're hungry. You're ordering:\" is required"
  ]
}
```

---

## Testing with Thunder Client / Postman

### Setup
1. **Login first** to get session cookie
2. **Copy session cookie** from browser DevTools
3. **Set cookie** in API testing tool

### Test Sequence

#### Test 1: Fetch Empty Questionnaire
```http
GET http://localhost:3000/api/questionnaire
Cookie: next-auth.session-token=<your-session-token>
```

**Expected:** Empty responses object

#### Test 2: Save Draft
```http
POST http://localhost:3000/api/questionnaire/save
Cookie: next-auth.session-token=<your-session-token>
Content-Type: application/json

{
  "responses": {
    "q0.1": "man",
    "q1": "pizza"
  }
}
```

**Expected:** `{ "success": true, "message": "Draft saved successfully" }`

#### Test 3: Fetch Draft
```http
GET http://localhost:3000/api/questionnaire
Cookie: next-auth.session-token=<your-session-token>
```

**Expected:** Responses object with q0.1 and q1

#### Test 4: Update Draft
```http
POST http://localhost:3000/api/questionnaire/save
Cookie: next-auth.session-token=<your-session-token>
Content-Type: application/json

{
  "responses": {
    "q0.1": "man",
    "q1": "sushi",
    "q2": "early-active"
  }
}
```

**Expected:** Draft updated (upsert behavior)

#### Test 5: Submit Incomplete (Should Fail)
```http
POST http://localhost:3000/api/questionnaire/submit
Cookie: next-auth.session-token=<your-session-token>
Content-Type: application/json

{
  "responses": {
    "q0.1": "man",
    "q1": "pizza"
  }
}
```

**Expected:** `400` error with validation details

#### Test 6: Submit Complete
```http
POST http://localhost:3000/api/questionnaire/submit
Cookie: next-auth.session-token=<your-session-token>
Content-Type: application/json

{
  "responses": {
    ...all 60 questions answered...
  }
}
```

**Expected:** `{ "success": true }`

#### Test 7: Try to Edit After Submit (Should Fail)
```http
POST http://localhost:3000/api/questionnaire/save
Cookie: next-auth.session-token=<your-session-token>
Content-Type: application/json

{
  "responses": {
    "q0.1": "woman"
  }
}
```

**Expected:** `403` error - "Questionnaire already submitted and cannot be edited"

---

## Database Verification

### Check Saved Responses
```sql
SELECT 
  u.email,
  qr.responses,
  qr.importance,
  qr."isSubmitted",
  qr."submittedAt",
  qr."createdAt",
  qr."updatedAt"
FROM "QuestionnaireResponse" qr
JOIN "User" u ON u.id = qr."userId"
WHERE u.email = 'your-test-email@ubc.ca';
```

### Check All Submitted Questionnaires
```sql
SELECT 
  COUNT(*) as total_submitted
FROM "QuestionnaireResponse"
WHERE "isSubmitted" = true;
```

---

## Error Handling

All endpoints handle:
- ✅ Authentication errors (401)
- ✅ Authorization errors (403 for locked questionnaires)
- ✅ Validation errors (400 with details)
- ✅ Server errors (500)
- ✅ Zod validation errors (400 with schema issues)

---

## Notes

- **Type Assertions:** The `as any` casts are necessary for Prisma's JSON field compatibility
- **Upsert Behavior:** Save endpoint creates new record or updates existing
- **Lock Mechanism:** Once `isSubmitted = true`, no edits allowed
- **Validation:** Submit endpoint validates all required questions before saving
- **Importance Optional:** Users can omit the importance field entirely
