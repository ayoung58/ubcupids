# Phase 5.1: Submission Implementation - Summary

## What Was Added

Phase 5 was updated to include **questionnaire submission and read-only mode**, which were identified as missing critical features.

### New Files Created

1. **app/api/questionnaire/v2/submit/route.ts** (96 lines)
   - POST endpoint for submitting the questionnaire
   - Validates all responses before submission
   - Sets `isSubmitted = true` and `submittedAt` timestamp
   - Updates `user.needsQuestionnaireUpdate = false`
   - Prevents re-submission if already submitted

### Modified Files

2. **components/questionnaire/v2/QuestionnaireV2.tsx**
   - Added submission state tracking (`isSubmitted`, `isSubmitting`, `submitError`)
   - Loads submission status from API on mount
   - Added `handleSubmit()` function to submit questionnaire
   - Modified `handleNext()` to trigger submission at 100% completion
   - Modified `updateResponse()` to prevent editing when submitted
   - Added read-only banner (green success message)
   - Wrapped content area with `opacity-70 pointer-events-none` when submitted
   - Hides autosave indicator when submitted
   - Changed "Next →" button to "Submit Questionnaire" at final step when 100% complete
   - Shows "Submitting..." state during submission

3. **docs/Questionnaire/Questionnaire_Updated_Version/Questionnaire_revamp_plan.md**
   - Updated Phase 5 description to include submission features
   - Added submission testing checkpoints

### Existing Files (Already Supported Submission)

4. **prisma/schema.prisma** (QuestionnaireResponseV2 model)
   - Already had `isSubmitted` Boolean field
   - Already had `submittedAt` DateTime field
   - No changes needed

5. **app/api/questionnaire/v2/load/route.ts**
   - Already returns `isSubmitted` and `submittedAt` in response
   - No changes needed

## How It Works

### Submission Flow

1. **User completes questionnaire** (100% progress)
2. **Submit button appears** at final step (replaces "Complete")
3. **User clicks "Submit Questionnaire"**
4. **Frontend validation** checks completion
5. **API validation** re-checks all responses server-side
6. **Database update**:
   - Sets `isSubmitted = true`
   - Sets `submittedAt = now()`
   - Sets `user.needsQuestionnaireUpdate = false`
7. **UI updates**:
   - Shows green success banner
   - Disables all inputs
   - Hides autosave indicator
   - Allows viewing but not editing

### Read-Only Mode

When `isSubmitted = true`:

- **Green banner** displays at top: "Questionnaire Submitted - You are viewing your responses in read-only mode"
- **All inputs disabled** via `pointer-events-none` and `opacity-70` CSS
- **Autosave disabled** (indicator hidden)
- **Navigation still works** (can view different pages)
- **Submit button hidden** (already submitted)
- **updateResponse() blocked** (returns early if submitted)

## Testing Checklist

### Test Group 7: Submission

- [ ] **Test 7.1: Submit Button Appearance**
  - Start fresh questionnaire
  - Complete all 39 questions (Q1-Q36 + 2 mandatory free responses)
  - Navigate to final step (Free Response page)
  - Verify button changes from "Complete" to "Submit Questionnaire"

- [ ] **Test 7.2: Submission Success**
  - Click "Submit Questionnaire" button
  - Verify button shows "Submitting..." during request
  - Verify success alert appears
  - Verify green banner appears at top
  - Verify all inputs become disabled (can't click/type)
  - Verify autosave indicator disappears

- [ ] **Test 7.3: Read-Only Navigation**
  - After submission, navigate between questions using prev/next buttons
  - Verify all previous responses are visible
  - Verify no inputs can be modified
  - Verify progress bar still shows 100%

- [ ] **Test 7.4: Page Refresh After Submission**
  - Refresh page after submitting
  - Verify green banner still appears
  - Verify responses still visible
  - Verify inputs still disabled
  - Verify no submit button (already submitted)

- [ ] **Test 7.5: Prevent Re-Submission**
  - After submission, try to submit again via API (use browser DevTools)
  - Verify API returns 400 error: "Questionnaire already submitted"

- [ ] **Test 7.6: Incomplete Submission Prevention**
  - Start fresh questionnaire
  - Complete only 50% of questions
  - Navigate to final step
  - Verify "Complete" button is disabled (not "Submit Questionnaire")
  - Complete all questions
  - Verify button changes to "Submit Questionnaire" and becomes enabled

- [ ] **Test 7.7: Validation Before Submission**
  - Complete questionnaire but leave Q4 age range as invalid (minAge > maxAge)
  - Try to submit
  - Verify API returns validation error
  - Verify error message displays to user

- [ ] **Test 7.8: User Flag Update**
  - After submission, check user's `needsQuestionnaireUpdate` flag (via dashboard or API)
  - Verify it's set to `false` (if it was `true` before)

### Test Group 8: Autosave Disabled When Submitted

- [ ] **Test 8.1: No Autosave After Submission**
  - Submit questionnaire
  - Try to modify input (should be blocked by CSS)
  - Verify no autosave request is sent (check Network tab)
  - Verify autosave indicator is hidden

- [ ] **Test 8.2: Returning User Sees Read-Only**
  - Submit questionnaire
  - Log out and log back in
  - Navigate to /questionnaire
  - Verify loads in read-only mode immediately
  - Verify green banner appears on load

## Deployment Notes

### Database Schema

No migration needed - `isSubmitted` and `submittedAt` fields already exist in `QuestionnaireResponseV2` model.

### API Endpoints

New endpoint: `POST /api/questionnaire/v2/submit`

- Requires authentication (NextAuth session)
- Returns 400 if already submitted or validation fails
- Returns 200 with success message on successful submission

### Frontend Changes

- QuestionnaireV2.tsx now handles submission state
- Read-only mode implemented via CSS (no need to modify input components)
- Autosave hook respects submission state

## Commit Message

```
feat(questionnaire-v2): add submission and read-only mode (Phase 5.1)

Implements critical questionnaire submission functionality:

Backend:
- Add POST /api/questionnaire/v2/submit endpoint
- Validate all responses before locking questionnaire
- Set isSubmitted=true and submittedAt timestamp
- Update user.needsQuestionnaireUpdate=false on submission

Frontend:
- Show "Submit Questionnaire" button at 100% completion
- Display green success banner when submitted
- Disable all inputs in read-only mode (CSS + state)
- Hide autosave indicator after submission
- Allow navigation to view responses
- Prevent editing after submission
- Show submission loading state

This completes Phase 5 of the V2 questionnaire revamp.
Users can now submit their completed questionnaire, which locks
it from further editing while still allowing them to view their
responses.

Closes: Phase 5 (fully complete)
Next: Phase 6 (banner & migration path)
```

## File Summary

**New Files:** 1

- app/api/questionnaire/v2/submit/route.ts

**Modified Files:** 2

- components/questionnaire/v2/QuestionnaireV2.tsx
- docs/Questionnaire/Questionnaire_Updated_Version/Questionnaire_revamp_plan.md

**Total Lines Changed:** ~120 lines added

## Next Steps

After testing and committing Phase 5.1, proceed with **Phase 6: Banner & Migration Path**:

- Create QuestionnaireUpdateBanner component
- Show banner on dashboard for users with `needsQuestionnaireUpdate = true`
- Link directly to /questionnaire
- Dismiss behavior (reappears until V2 completed)
