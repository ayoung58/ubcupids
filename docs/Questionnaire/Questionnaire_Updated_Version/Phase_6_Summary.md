# Phase 6: Banner & Migration Path - Implementation Summary

## Overview

Phase 6 implements a notification system to inform existing users about the updated V2 questionnaire, guiding them to complete it while allowing seamless navigation.

## Files Created

### 1. components/dashboard/QuestionnaireUpdateBanner.tsx (142 lines)

**Purpose**: Prominent banner component to notify users about questionnaire update

**Features**:

- Gradient pink/rose background for high visibility
- "Action Required" messaging
- Direct "Complete Now" CTA button linking to `/questionnaire`
- Dismissible (X button) but reappears on next session
- Responsive design with icon and clear messaging
- Hidden on questionnaire page itself

**Props**:

- `show?: boolean` - Controls visibility (tied to `user.needsQuestionnaireUpdate`)

**Behavior**:

- Shows prominently at top of dashboard
- Can be dismissed for current session (client-side state)
- Reappears on next login until user completes V2 questionnaire
- Automatically hidden after submission (when `needsQuestionnaireUpdate = false`)

## Files Modified

### 2. app/(dashboard)/layout.tsx

**Changes**:

- Added `needsQuestionnaireUpdate` to user profile query
- Passes flag to `DashboardLayoutClient` component

**Code**:

```typescript
select: {
  isCupid: true,
  isBeingMatched: true,
  profilePicture: true,
  needsQuestionnaireUpdate: true, // NEW
}

// Pass to client
needsQuestionnaireUpdate={profile?.needsQuestionnaireUpdate ?? false}
```

### 3. app/(dashboard)/DashboardLayoutClient.tsx

**Changes**:

- Added `needsQuestionnaireUpdate` prop to interface
- Imported `QuestionnaireUpdateBanner` component
- Conditionally renders banner below header, above main content
- Hidden on questionnaire page itself (no banner shown during questionnaire)

**Code**:

```tsx
{
  /* Questionnaire Update Banner */
}
{
  !isQuestionnairePage && needsQuestionnaireUpdate && (
    <QuestionnaireUpdateBanner show={needsQuestionnaireUpdate} />
  );
}
```

## How It Works

### User Flow

1. **Existing User Logs In**
   - `user.needsQuestionnaireUpdate = true` (set via migration or manually)
   - Dashboard layout fetches flag from database
   - Banner displays at top of dashboard

2. **User Clicks "Complete Now"**
   - Navigates to `/questionnaire`
   - Banner is hidden on questionnaire page
   - User completes questionnaire

3. **User Submits Questionnaire**
   - Submission API sets `user.needsQuestionnaireUpdate = false`
   - User returns to dashboard
   - Banner no longer appears

4. **New User Signs Up**
   - `user.needsQuestionnaireUpdate = false` by default
   - Never sees banner
   - Goes straight to questionnaire during onboarding

### Banner Display Logic

```
Show banner IF:
  - User is on dashboard (not questionnaire page)
  - AND user.needsQuestionnaireUpdate = true
  - AND banner not dismissed for current session

Hide banner IF:
  - User is on questionnaire page
  - OR user.needsQuestionnaireUpdate = false
  - OR user dismissed banner (reappears next session)
```

## Database Schema

**No migration needed** - `needsQuestionnaireUpdate` field already exists in User model:

```prisma
model User {
  // ...
  needsQuestionnaireUpdate Boolean @default(false)
  // ...
}
```

### Setting Flag for Existing Users

To notify all existing users about the V2 update, run:

```sql
-- Set flag for all users who haven't completed V2
UPDATE "User"
SET "needsQuestionnaireUpdate" = true
WHERE "id" NOT IN (
  SELECT "userId" FROM "QuestionnaireResponseV2"
  WHERE "isSubmitted" = true
);
```

Or via Prisma:

```typescript
await prisma.user.updateMany({
  where: {
    questionnaireResponseV2: {
      OR: [{ isSubmitted: false }, { isSubmitted: null }],
    },
  },
  data: {
    needsQuestionnaireUpdate: true,
  },
});
```

## Testing Checklist

### Test Group 9: Banner Display

- [ ] **Test 9.1: Banner Shows for Flagged User**
  - Set `user.needsQuestionnaireUpdate = true` in database
  - Log in and navigate to dashboard
  - Verify banner displays at top with gradient background
  - Verify "Complete Now" button is visible

- [ ] **Test 9.2: Banner Hidden for New Users**
  - Create new user account (or set `needsQuestionnaireUpdate = false`)
  - Log in and navigate to dashboard
  - Verify banner does NOT appear

- [ ] **Test 9.3: Banner Dismissal**
  - Log in with flagged user
  - Click X button to dismiss banner
  - Verify banner disappears immediately
  - Navigate to different dashboard page
  - Verify banner still hidden in same session

- [ ] **Test 9.4: Banner Reappears After Re-login**
  - Dismiss banner (Test 9.3)
  - Log out
  - Log back in
  - Verify banner reappears (session-based dismissal only)

- [ ] **Test 9.5: Banner Links to Questionnaire**
  - Click "Complete Now" button
  - Verify navigates to `/questionnaire`
  - Verify banner does NOT appear on questionnaire page

- [ ] **Test 9.6: Banner Hidden After Submission**
  - Complete and submit V2 questionnaire
  - Return to dashboard
  - Verify banner no longer appears
  - Verify `user.needsQuestionnaireUpdate = false` in database

- [ ] **Test 9.7: Banner Not Shown on Questionnaire Page**
  - Set `needsQuestionnaireUpdate = true`
  - Navigate directly to `/questionnaire`
  - Verify banner does NOT appear (no double navigation)

- [ ] **Test 9.8: Responsive Design**
  - View banner on mobile (narrow viewport)
  - Verify text wraps properly
  - Verify button remains accessible
  - Verify dismiss X button still visible

### Test Group 10: Integration

- [ ] **Test 10.1: Dashboard Layout Integration**
  - Verify banner appears below header
  - Verify banner above main content
  - Verify no layout shift or overlap

- [ ] **Test 10.2: Multiple Dashboard Pages**
  - Navigate to `/dashboard`
  - Navigate to `/profile`
  - Navigate to `/matches`
  - Verify banner shows consistently on all pages (if flagged)

## Migration Strategy

### For Existing Production Users

**Option 1: Flag All Existing Users (Recommended)**

- Set `needsQuestionnaireUpdate = true` for all users who haven't completed V2
- They see banner immediately on next login
- Allows gradual migration

**Option 2: Phased Rollout**

- Set flag for small batch of users
- Monitor completion rate and feedback
- Gradually roll out to all users

**Option 3: Email Notification + Flag**

- Send email announcement about V2 questionnaire
- Set flag for all users
- Banner reinforces email message

### SQL Script for Migration

```sql
-- Check current state
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN "needsQuestionnaireUpdate" = true THEN 1 END) as flagged_users,
  COUNT(CASE WHEN qv2."isSubmitted" = true THEN 1 END) as completed_v2
FROM "User" u
LEFT JOIN "QuestionnaireResponseV2" qv2 ON u."id" = qv2."userId";

-- Flag users who need to complete V2
UPDATE "User"
SET "needsQuestionnaireUpdate" = true
WHERE "id" NOT IN (
  SELECT "userId"
  FROM "QuestionnaireResponseV2"
  WHERE "isSubmitted" = true
);
```

## TypeScript Compilation

✅ **PASSED** (0 errors)

All files compile successfully with no type errors.

## Commit Message

```
feat(questionnaire-v2): add banner to notify users of V2 update (Phase 6)

Implements notification system for existing users:

Components:
- Add QuestionnaireUpdateBanner component (gradient design, dismissible)
- Integrate banner into dashboard layout
- Show banner when user.needsQuestionnaireUpdate = true
- Hide banner on questionnaire page
- Session-based dismissal (reappears next login)

Layout Changes:
- Fetch needsQuestionnaireUpdate flag in dashboard layout
- Pass flag to DashboardLayoutClient
- Conditionally render banner below header

User Experience:
- Prominent "Action Required" messaging
- Direct "Complete Now" CTA linking to /questionnaire
- Banner hidden after V2 submission
- No banner for new users (default false)

Phase 6 complete. Users will now be notified about the updated
questionnaire and guided to complete it.

Next: Phase 7 (cleanup - remove tutorial, disable admin config)
```

## Summary

✅ **Phase 6 Complete**

**Created:**

- QuestionnaireUpdateBanner component (142 lines)

**Modified:**

- app/(dashboard)/layout.tsx (fetch flag, pass to client)
- app/(dashboard)/DashboardLayoutClient.tsx (render banner)

**Lines Changed:** ~160 lines total

**Features Implemented:**

- ✅ Prominent gradient banner
- ✅ Conditional rendering based on user flag
- ✅ Direct link to questionnaire
- ✅ Session-based dismissal
- ✅ Hidden on questionnaire page
- ✅ Hidden after V2 submission
- ✅ Responsive design

**Testing Required:**

- Manual testing of banner display logic (8 tests)
- Integration testing with dashboard pages (2 tests)

## Next Steps

**Phase 7: Cleanup - Remove Old Features**

Tasks:

1. Remove/disable tutorial component
2. Disable admin question configuration (keep page, show placeholder)
3. Update cupid dashboard to view V2 data (read-only)
4. Disable test user generation script

Ready to proceed with Phase 7?
