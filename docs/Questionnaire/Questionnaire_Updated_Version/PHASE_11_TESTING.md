# Phase 11: Tutorial V2 - Testing Guide

## Overview

Phase 11 implements an interactive tutorial system for the V2 questionnaire, guiding new users through the split-screen format, importance scales, dealbreakers, and other key features.

## Changes Made

### 1. New TutorialV2 Component

**File**: `components/tutorial/TutorialV2.tsx`

- Interactive overlay tutorial system
- 8 tutorial steps covering all major features
- Spotlight effect on target elements
- Positioned tooltips with arrows
- Progress dots and navigation
- Persists completion state via API

### 2. Updated QuestionnaireV2 Component

**File**: `components/questionnaire/v2/QuestionnaireV2.tsx`

- Added `tutorialCompleted` prop
- Imported and integrated TutorialV2 component
- Defined 8 tutorial steps with specific targets
- Tutorial shows on step 1 (Q3) for better UX
- Added data attributes for tutorial targeting

### 3. Updated Questionnaire Page

**File**: `app/(dashboard)/questionnaire/page.tsx`

- Fetches `questionnaireTutorialCompleted` from user record
- Passes tutorial completion status to QuestionnaireV2

### 4. Added Data Attributes for Tutorial Targeting

**Files Modified**:

- `components/questionnaire/v2/QuestionCard.tsx` - Added `data-tutorial="question-card"`, `data-tutorial="left-side"`, `data-tutorial="right-side"`
- `components/questionnaire/v2/ImportanceScale.tsx` - Added `data-tutorial="importance-scale"` and `data-tutorial="dealbreaker-button"`
- `components/questionnaire/v2/DoesntMatterButton.tsx` - Added `data-tutorial="doesnt-matter"`
- `components/questionnaire/v2/SaveStatusIndicator.tsx` - Added `data-tutorial="save-indicator"`
- `components/questionnaire/v2/QuestionnaireV2.tsx` - Added `data-tutorial="navigation"` to nav buttons

## Tutorial Steps

1. **Welcome** - Introduction to split-screen format
2. **Left Side** - Explains "About You" section
3. **Right Side** - Explains "Your Preferences" section
4. **Importance Scale** - How to rate importance
5. **Dealbreaker Button** - Warning about sparing use
6. **Doesn't Matter Option** - How to exclude questions
7. **Auto-Save Feature** - Automatic progress saving
8. **Navigation** - How to move through questions

## Testing Instructions

### Test 1: First-Time User Experience

1. Create a new test user or reset tutorial completion:

   ```sql
   UPDATE "User" SET "questionnaireTutorialCompleted" = false WHERE email = 'your-test-email@example.com';
   ```

2. Log in as the test user
3. Navigate to `/questionnaire`
4. **Expected**: Tutorial should appear when you reach step 1 (Q3)
5. **Verify**:
   - ✅ Tutorial overlay appears with spotlight effect
   - ✅ First step points to the question card
   - ✅ Tooltip has pink theme matching questionnaire design
   - ✅ Progress dots show 8 steps

### Test 2: Tutorial Navigation

1. With tutorial active, click "Next" button
2. **Verify**:
   - ✅ Tutorial advances to next step
   - ✅ Spotlight moves to new target element
   - ✅ Tooltip repositions correctly
   - ✅ "Back" button becomes enabled after first step
   - ✅ Progress dots update

3. Click "Back" button
4. **Verify**:
   - ✅ Returns to previous step
   - ✅ Spotlight and tooltip update correctly

5. Navigate through all 8 steps
6. On final step, click "Finish"
7. **Verify**:
   - ✅ Tutorial disappears
   - ✅ Can interact with questionnaire normally

### Test 3: Tutorial Skip

1. Reset tutorial completion for test user
2. Navigate to questionnaire
3. When tutorial appears, click "Skip Tutorial"
4. **Verify**:
   - ✅ Tutorial immediately closes
   - ✅ Can interact with questionnaire
   - ✅ Tutorial doesn't reappear on page refresh

### Test 4: Tutorial Completion Persistence

1. Complete tutorial by clicking through all steps
2. Refresh the page
3. **Verify**:
   - ✅ Tutorial does NOT appear again
   - ✅ User can use questionnaire normally

4. Check database:
   ```sql
   SELECT "questionnaireTutorialCompleted" FROM "User" WHERE email = 'your-test-email@example.com';
   ```
5. **Verify**:
   - ✅ Value is `true`

### Test 5: Tutorial Element Targeting

For each tutorial step, verify the spotlight and tooltip correctly target:

**Step 1 (Welcome)**:

- ✅ Highlights entire question card

**Step 2 (Left Side)**:

- ✅ Highlights "About You" section on left
- ✅ Tooltip positioned to the right

**Step 3 (Right Side)**:

- ✅ Highlights "Your Preferences" section on right
- ✅ Tooltip positioned to the left

**Step 4 (Importance Scale)**:

- ✅ Highlights importance radio buttons
- ✅ Tooltip positioned above

**Step 5 (Dealbreaker)**:

- ✅ Highlights dealbreaker button
- ✅ Tooltip positioned above
- ✅ Warning message visible in tutorial content

**Step 6 (Doesn't Matter)**:

- ✅ Highlights "Doesn't matter" button
- ✅ Tooltip positioned above

**Step 7 (Auto-Save)**:

- ✅ Highlights save status indicator in header
- ✅ Tooltip positioned below

**Step 8 (Navigation)**:

- ✅ Highlights navigation buttons at bottom
- ✅ Tooltip positioned above

### Test 6: Responsive Behavior

1. Open questionnaire with tutorial on desktop (>1024px)
2. **Verify**:
   - ✅ Tooltips position correctly
   - ✅ Spotlight highlights proper areas
   - ✅ No overlap issues

3. Resize window to tablet (768-1024px)
4. **Verify**:
   - ✅ Tutorial still functions
   - ✅ Tooltips stay within viewport

5. Resize to mobile (<768px)
6. **Verify**:
   - ✅ Tutorial tooltips are still readable
   - ✅ Navigation buttons accessible
   - ✅ Can still skip or complete tutorial

### Test 7: Tutorial with Submitted Questionnaire

1. Complete and submit questionnaire
2. Return to view questionnaire
3. **Verify**:
   - ✅ Tutorial does NOT appear (read-only mode)
   - ✅ No tutorial overlay in read-only view

### Test 8: Close Button (X)

1. Reset tutorial completion
2. Start tutorial
3. Click the X button in top-right of tooltip
4. **Verify**:
   - ✅ Tutorial closes (same as Skip)
   - ✅ Marked as completed
   - ✅ Doesn't reappear on refresh

### Test 9: Integration with Existing Features

1. Start tutorial but don't skip
2. Try to:
   - Answer a question
   - Click importance scale
   - Click navigation buttons
3. **Verify**:
   - ✅ Can still interact with questionnaire elements
   - ✅ Tutorial stays visible
   - ✅ No JavaScript errors

### Test 10: API Completion Endpoint

1. Monitor network tab
2. Complete or skip tutorial
3. **Verify**:
   - ✅ POST request to `/api/tutorial/complete`
   - ✅ Request body includes `{ tutorialId: "questionnaire-v2" }`
   - ✅ Response is 200 OK
   - ✅ Database updated correctly

## Edge Cases to Test

### Edge Case 1: Tutorial on Q1/Q2 (No Split Screen)

1. Navigate to step 0 (Q1+Q2)
2. **Verify**:
   - ✅ Tutorial does NOT show (by design, shows at step 1)
   - ✅ No errors in console

### Edge Case 2: Rapid Navigation During Tutorial

1. Start tutorial
2. Rapidly click Next multiple times
3. **Verify**:
   - ✅ Tutorial steps advance correctly
   - ✅ No animation glitches
   - ✅ Spotlight updates smoothly

### Edge Case 3: Tutorial During Autosave

1. Start tutorial
2. Answer some questions while tutorial is active
3. Wait for autosave to trigger
4. **Verify**:
   - ✅ Autosave works normally
   - ✅ Tutorial doesn't interfere
   - ✅ Save indicator updates correctly

### Edge Case 4: Tutorial with Missing Target Elements

1. Comment out a target element temporarily (e.g., importance scale)
2. Navigate to that tutorial step
3. **Verify**:
   - ✅ Tutorial doesn't crash
   - ✅ Tooltip still displays (may position at default location)
   - ✅ Can still navigate through tutorial

## Known Limitations

1. Tutorial shows at step 1 (Q3) rather than Q1/Q2, because Q1/Q2 don't have the full split-screen layout
2. Tutorial requires JavaScript enabled (progressive enhancement consideration for future)
3. Very small screens (<375px) may have tooltip positioning challenges

## Success Criteria

All tests pass with:

- ✅ Tutorial guides users through first question
- ✅ Tutorial can be skipped
- ✅ Tutorial doesn't reappear after completion
- ✅ All 8 steps function correctly
- ✅ Spotlight and tooltips target correct elements
- ✅ Tutorial doesn't interfere with questionnaire functionality
- ✅ Completion state persists correctly
- ✅ Works across different screen sizes

## Rollback Plan

If issues arise:

1. Comment out TutorialV2 import in QuestionnaireV2.tsx
2. Remove tutorial rendering logic
3. Data attributes are harmless and can remain
4. Tutorial completion flag in database is non-breaking
