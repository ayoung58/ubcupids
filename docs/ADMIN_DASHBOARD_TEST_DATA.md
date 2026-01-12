# Admin Dashboard Test Data Generation Guide

## Overview

The admin dashboard provides an easy-to-use interface for generating test users with various questionnaire scenarios. This is useful for testing the matching algorithm, UI behavior, and different user interactions.

## Location

Navigate to: `/admin` (requires admin role)

## Test Data Card

The "🧪 Test Data" card (blue-themed) provides options for generating test users.

### Test User Credentials

- **Password for all test users**: `TestPassword123!`
- Email pattern: `testuser-match-{timestamp}-{number}@example.com` or `testuser-cupid-{timestamp}-{number}@example.com`

## Questionnaire Scenarios (Match Users Only)

Before clicking "Add 125 Match Users", select a scenario from the dropdown:

### 1. **Random** (Default)

- **Description**: Varied, realistic responses
- **Use Case**: General testing, realistic user pool simulation
- **Behavior**: Each user gets unique randomized questionnaire responses

### 2. **Perfect Match Pairs**

- **Description**: Highly compatible pairs for testing high scores
- **Use Case**: Testing successful matches, high compatibility scores, match reveal UI
- **Behavior**: Creates pairs of users with:
  - Same or very compatible answers
  - High importance ratings on matching questions
  - Designed to produce compatibility scores > 80%
- **Note**: Generates floor(125/2) = 62 pairs + 1 random user

### 3. **Dealbreaker Conflicts**

- **Description**: Pairs with Q8 alcohol conflicts (for testing rejections)
- **Use Case**: Testing rejection logic, dealbreaker handling, low scores
- **Behavior**: Creates pairs where:
  - One user drinks alcohol and rates Q8 as very important
  - The other user doesn't drink and also rates Q8 as very important
  - This creates an incompatible match that should be rejected
- **Note**: Generates floor(125/2) = 62 pairs + 1 random user

### 4. **Asymmetric Pairs**

- **Description**: One picky, one easy-going (for one-sided matches)
- **Use Case**: Testing scenarios where one person is highly selective but the other is not
- **Behavior**: Creates pairs where:
  - Person A: Different answers but LOW importance ratings (not picky)
  - Person B: Different answers but HIGH importance ratings (very picky)
  - Results in asymmetric compatibility scores
- **Note**: Generates floor(125/2) = 62 pairs + 1 random user

### 5. **Diverse Pool**

- **Description**: Maximum variety (for algorithm stress testing)
- **Use Case**: Testing algorithm performance with highly varied data
- **Behavior**: Creates users with:
  - Wide distribution across all answer options
  - Varied importance ratings
  - Different demographic characteristics
  - Ensures good coverage of the question/answer space

## Buttons

### Add 125 Match Users (Blue Button)

- Creates 125 test users with the `match` role
- Generates completed V2 questionnaires based on selected scenario
- Users are ready to participate in matching

### Add 125 Cupid Users (Purple Button)

- Creates 125 test users with the `cupid` role
- No questionnaire responses (cupids don't fill out questionnaires)
- Users are ready to review and assign matches

## Important Notes

1. **Cumulative**: Each button click adds 125 MORE users. Clicking twice = 250 users.
2. **Scenario applies to Match users only**: Cupid users don't have questionnaires
3. **Odd numbers**: Pair-based scenarios (perfect, dealbreaker, asymmetric) will generate one random user if count is odd
4. **Email uniqueness**: Uses timestamps to ensure unique emails across generations
5. **All verified**: Test users are auto-verified (no email verification needed)

## Success Messages

After generation, you'll see a message like:

- `Generated 125 test match users with completed questionnaires (perfect scenario)`
- `Generated 125 test cupid users`

The scenario type is included in the message for match users.

## Typical Workflows

### Testing Successful Matches

1. Select "Perfect Match Pairs" scenario
2. Click "Add 125 Match Users"
3. Run matching algorithm
4. View high compatibility scores and successful matches

### Testing Rejection Logic

1. Select "Dealbreaker Conflicts" scenario
2. Click "Add 125 Match Users"
3. Run matching algorithm
4. Verify users with dealbreaker conflicts are rejected

### Testing Diverse User Base

1. Select "Diverse Pool" scenario
2. Click "Add 125 Match Users" (repeat 2-3 times for 250-375 users)
3. Run matching algorithm
4. Analyze how algorithm handles variety

### Testing Cupid Assignment

1. Click "Add 125 Cupid Users"
2. Click "Add 125 Match Users" (any scenario)
3. Test cupid dashboard and assignment UI

## API Details

The UI calls: `POST /api/admin/generate-test-users`

Request body:

```json
{
  "count": 125,
  "userType": "match" | "cupid",
  "scenario": "random" | "perfect" | "dealbreaker" | "asymmetric" | "diverse"
}
```

Response:

```json
{
  "message": "Generated 125 test match users with completed questionnaires (perfect scenario)",
  "created": 125,
  "userType": "match",
  "scenario": "perfect"
}
```

## Cleanup

To remove all test users, use the "⚠️ Danger Zone" card's "Clear Test Users" button (requires confirmation).

## Related Documentation

- [Test Data Generator Code](../lib/questionnaire/v2/test-data-generator.ts)
- [CLI Test Data Script](../scripts/seed-test-data.ts)
- [Phase 10 Implementation](./Matching/PHASE_10_COMMIT.md)
