# Phase 6 Quick Testing Guide

## Quick Test (5 minutes)

### Setup

1. Start dev server: `npm run dev`
2. Open browser to: `http://localhost:3000`

### Test 1: Set Flag and View Banner

**Option A: Via Database (Recommended)**

```sql
-- In your database client
UPDATE "User"
SET "needsQuestionnaireUpdate" = true
WHERE "email" = 'your-test-email@example.com';
```

**Option B: Via Prisma Studio**

1. Run: `npx prisma studio`
2. Open User table
3. Find your user
4. Set `needsQuestionnaireUpdate` to `true`
5. Save

### Test 2: Verify Banner Appears

1. Log in to your account
2. Navigate to `/dashboard`
3. ✅ **Expected**: Pink/rose gradient banner at top
4. ✅ **Expected**: Text reads "Action Required: Complete Updated Questionnaire"
5. ✅ **Expected**: "Complete Now" button visible

### Test 3: Click "Complete Now"

1. Click the "Complete Now" button
2. ✅ **Expected**: Navigate to `/questionnaire`
3. ✅ **Expected**: Banner does NOT appear on questionnaire page

### Test 4: Dismiss Banner

1. Return to `/dashboard`
2. Click the X button on banner
3. ✅ **Expected**: Banner disappears immediately
4. Navigate to `/profile` or another dashboard page
5. ✅ **Expected**: Banner still hidden in same session

### Test 5: Verify Banner Reappears

1. Log out
2. Log back in
3. Navigate to `/dashboard`
4. ✅ **Expected**: Banner reappears (dismissal was session-only)

### Test 6: Complete Questionnaire and Verify Banner Hides

1. Complete all questions (100%)
2. Submit questionnaire
3. Navigate back to `/dashboard`
4. ✅ **Expected**: Banner is gone permanently
5. Check database: `needsQuestionnaireUpdate` should be `false`

### Test 7: New User (No Banner)

**Option A**: Set flag to false

```sql
UPDATE "User"
SET "needsQuestionnaireUpdate" = false
WHERE "email" = 'your-test-email@example.com';
```

1. Refresh dashboard
2. ✅ **Expected**: No banner appears

## Visual Checklist

When banner is visible, it should have:

- [ ] Pink/rose gradient background
- [ ] White text
- [ ] Info icon (circle with 'i')
- [ ] Bold heading: "Action Required: Complete Updated Questionnaire"
- [ ] Subtext about improved match quality
- [ ] White "Complete Now" button with arrow
- [ ] X dismiss button on right

## Common Issues

**Issue**: Banner doesn't appear

- Check: `needsQuestionnaireUpdate` is `true` in database
- Check: Not on `/questionnaire` page (banner hidden there)
- Check: User is logged in
- Check: Dev server restarted after code changes

**Issue**: Banner still shows after submission

- Check: Submission API completed successfully
- Check: Database shows `needsQuestionnaireUpdate = false`
- Try: Hard refresh (Ctrl+Shift+R)

**Issue**: TypeScript errors

- Run: `npx tsc --noEmit`
- Check: All imports resolved correctly

## Database Queries for Testing

```sql
-- Check user's flag status
SELECT "id", "email", "needsQuestionnaireUpdate"
FROM "User"
WHERE "email" = 'your-email@example.com';

-- Set flag to true (show banner)
UPDATE "User"
SET "needsQuestionnaireUpdate" = true
WHERE "email" = 'your-email@example.com';

-- Set flag to false (hide banner)
UPDATE "User"
SET "needsQuestionnaireUpdate" = false
WHERE "email" = 'your-email@example.com';

-- Check if user has submitted V2
SELECT u."email", qv2."isSubmitted", qv2."submittedAt"
FROM "User" u
LEFT JOIN "QuestionnaireResponseV2" qv2 ON u."id" = qv2."userId"
WHERE u."email" = 'your-email@example.com';
```

## Success Criteria

✅ Phase 6 is complete when:

1. Banner shows for users with `needsQuestionnaireUpdate = true`
2. Banner hides for users with `needsQuestionnaireUpdate = false`
3. Banner not shown on questionnaire page
4. "Complete Now" button navigates to `/questionnaire`
5. Dismiss button hides banner for session
6. Banner reappears after re-login (if flag still true)
7. Banner permanently disappears after V2 submission
8. TypeScript compilation passes (0 errors)

Once all tests pass, Phase 6 is ready to commit!
