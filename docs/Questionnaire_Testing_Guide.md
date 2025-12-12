# UBCupids Questionnaire - Comprehensive Testing Guide

## 📋 Testing Overview

This document provides step-by-step testing procedures to identify bugs and ensure the questionnaire works correctly across all scenarios.

---

## 🧪 Test Environment Setup

### Prerequisites

- [ ] Development server running (`npm run dev`)
- [ ] Database connected and migrated
- [ ] Test user account created and verified
- [ ] Browser DevTools open (Console + Network tabs)

### Browsers to Test

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (desktop)
- [ ] Safari iOS (mobile)
- [ ] Chrome Android (mobile)

---

## 1️⃣ Initial Load & Authentication Tests

### Test 1.1: Unauthenticated Access

**Steps:**

1. Log out if currently authenticated
2. Navigate to `/questionnaire`
3. Observe behavior

**Expected Result:**

- ✅ Redirects to `/login` page
- ✅ No error messages in console
- ✅ Login page loads correctly

**Bug Indicators:**

- ❌ 500 error or blank page
- ❌ Questionnaire loads without authentication
- ❌ Console errors about session

---

### Test 1.2: First-Time User Load

**Steps:**

1. Log in with account that has NEVER started questionnaire
2. Navigate to `/questionnaire`
3. Wait for page to load

**Expected Result:**

- ✅ Loading skeleton appears briefly
- ✅ Pre-questionnaire agreement screen shows
- ✅ No pre-filled responses
- ✅ Progress bar shows 0%
- ✅ Continue button is disabled until checkbox is checked

**Bug Indicators:**

- ❌ Blank page or infinite loading
- ❌ Skips agreement screen
- ❌ Shows random pre-filled data
- ❌ Continue button works without agreement

---

### Test 1.3: Returning User Load (Draft)

**Steps:**

1. Log in with account that has saved draft (not submitted)
2. Navigate to `/questionnaire`
3. Observe loaded data

**Expected Result:**

- ✅ Skips agreement screen (goes straight to questionnaire)
- ✅ Previously saved responses are loaded
- ✅ Progress bar shows correct percentage
- ✅ All buttons are enabled
- ✅ "Last saved at" timestamp may appear

**Bug Indicators:**

- ❌ Shows agreement screen again
- ❌ Responses are missing or incorrect
- ❌ Progress calculation is wrong
- ❌ Form is disabled

---

### Test 1.4: Submitted Questionnaire Load

**Steps:**

1. Log in with account that has submitted questionnaire
2. Navigate to `/questionnaire`
3. Observe form state

**Expected Result:**

- ✅ Questionnaire loads in read-only mode
- ✅ All responses are displayed
- ✅ All inputs are disabled (grayed out)
- ✅ Save and Submit buttons are hidden
- ✅ Message displays: "Your responses have been submitted and are now locked."

**Bug Indicators:**

- ❌ Form is editable
- ❌ Buttons are visible
- ❌ Can modify responses
- ❌ No indication it's submitted

---

## 2️⃣ Pre-Agreement Screen Tests

### Test 2.1: Agreement Interaction

**Steps:**

1. Load questionnaire as first-time user
2. Try clicking Continue button (should be disabled)
3. Click the agreement checkbox
4. Click Continue button

**Expected Result:**

- ✅ Continue button disabled initially
- ✅ Button enables after checkbox checked
- ✅ Checkbox has visual checkmark
- ✅ Transitions to questionnaire form
- ✅ No page reload (smooth transition)

**Bug Indicators:**

- ❌ Button works while disabled
- ❌ Checkbox doesn't toggle
- ❌ Page refreshes on continue
- ❌ Doesn't navigate to questionnaire

---

### Test 2.2: Mobile Responsiveness

**Steps:**

1. Resize browser to 375px width (iPhone size)
2. Check agreement screen layout
3. Verify all content is visible

**Expected Result:**

- ✅ Heart icon and title are centered
- ✅ All text is readable without horizontal scroll
- ✅ Checkbox and label are aligned
- ✅ Continue button spans full width
- ✅ Touch targets are at least 44×44px

**Bug Indicators:**

- ❌ Text overflows or cuts off
- ❌ Elements overlap
- ❌ Horizontal scrollbar appears
- ❌ Button is too small to tap easily

---

## 3️⃣ Question Rendering Tests

### Test 3.1: Single-Choice (Radio) Questions

**Example:** Question about gender/orientation
**Steps:**

1. Scroll to a single-choice question
2. Click on each radio option
3. Observe selection behavior

**Expected Result:**

- ✅ Only one option can be selected at a time
- ✅ Previous selection deselects when new one chosen
- ✅ Selected option has visual indicator (filled circle)
- ✅ If option has "specify" text input, it appears below selection
- ✅ Red asterisk (\*) shows if question is required

**Bug Indicators:**

- ❌ Multiple selections possible
- ❌ Selection doesn't register
- ❌ Text input doesn't appear/disappear correctly
- ❌ Visual state doesn't update

---

### Test 3.2: Multi-Choice (Checkbox) Questions

**Example:** "What are your hobbies?"
**Steps:**

1. Find a multi-choice question
2. Check multiple checkboxes
3. Uncheck some checkboxes
4. Verify selection state

**Expected Result:**

- ✅ Multiple checkboxes can be selected simultaneously
- ✅ Checkboxes toggle on/off correctly
- ✅ Visual checkmark appears when selected
- ✅ Progress bar updates as selections are made

**Bug Indicators:**

- ❌ Only one checkbox selectable
- ❌ Checkboxes don't toggle
- ❌ Selections don't save
- ❌ Visual state incorrect

---

### Test 3.3: Text Input Questions

**Example:** Short answer fields
**Steps:**

1. Find a text input question
2. Type text (normal length)
3. Try to exceed maxLength (if defined)
4. Clear the field

**Expected Result:**

- ✅ Text input accepts typing
- ✅ Cannot exceed maxLength
- ✅ Input has minimum 44px height
- ✅ Placeholder text is visible when empty
- ✅ Value persists on blur/refocus

**Bug Indicators:**

- ❌ Can't type in field
- ❌ Can exceed character limit
- ❌ Input is too small (hard to tap on mobile)
- ❌ Value clears unexpectedly

---

### Test 3.4: Textarea Questions

**Example:** "Describe yourself" or "What are you looking for?"
**Steps:**

1. Find a textarea question
2. Type multiple lines of text
3. Watch character counter
4. Approach character limit
5. Try to exceed limit

**Expected Result:**

- ✅ Textarea accepts multiple lines
- ✅ Character counter shows "X / Y characters"
- ✅ Counter turns orange when <50 characters remaining
- ✅ Shows "(X remaining)" when close to limit
- ✅ Cannot exceed maxLength
- ✅ Textarea has comfortable height (120px min)

**Bug Indicators:**

- ❌ Counter doesn't update
- ❌ Counter shows wrong numbers
- ❌ Can exceed character limit
- ❌ Color warning doesn't appear
- ❌ Textarea too small

---

### Test 3.5: Ranking Questions

**Example:** "Rank your top 3 priorities"
**Steps:**

1. Find a ranking question
2. Click on first option
3. Click on second option
4. Click on third option
5. Try clicking a fourth option
6. Click on a selected option to deselect
7. Use keyboard (Tab + Enter/Space)

**Expected Result:**

- ✅ First selection shows badge with "1"
- ✅ Second selection shows badge with "2"
- ✅ Third selection shows badge with "3"
- ✅ Fourth click does nothing (max 3)
- ✅ Clicking selected option removes it
- ✅ Numbers reorder when middle item removed
- ✅ Keyboard navigation works (Tab to focus, Enter/Space to select)
- ✅ Selected items have blue border and background

**Bug Indicators:**

- ❌ Can select more than 3 items
- ❌ Numbers don't display correctly
- ❌ Can't deselect items
- ❌ Order doesn't update properly
- ❌ Keyboard doesn't work

---

### Test 3.6: Scale Questions

**Example:** Numeric rating (1-10)
**Steps:**

1. Find a scale question
2. Enter a number within range
3. Try entering number below minimum
4. Try entering number above maximum
5. Try entering non-numeric text

**Expected Result:**

- ✅ Accepts numbers in valid range
- ✅ Number input has spinner arrows
- ✅ Cannot enter values outside min/max
- ✅ Non-numeric input is rejected
- ✅ Input has 44px minimum height

**Bug Indicators:**

- ❌ Accepts invalid values
- ❌ Allows text entry
- ❌ No min/max enforcement
- ❌ Input too small

---

## 4️⃣ Progress Tracking Tests

### Test 4.1: Progress Calculation

**Steps:**

1. Start fresh questionnaire (0% progress)
2. Answer first question
3. Check progress bar percentage
4. Answer half of all questions
5. Answer all questions
6. Un-answer a question (clear a field)

**Expected Result:**

- ✅ Initial progress: 0%
- ✅ Progress increases with each answered question
- ✅ Progress calculation: (answered / total) × 100
- ✅ Progress decreases when question un-answered
- ✅ "X of Y answered" count matches progress
- ✅ Progress bar fills from left to right

**Bug Indicators:**

- ❌ Progress stuck at 0%
- ❌ Progress exceeds 100%
- ❌ Count doesn't match actual answered questions
- ❌ Progress doesn't update dynamically

---

### Test 4.2: Progress Bar Visibility

**Steps:**

1. Load questionnaire
2. Scroll down through questions
3. Scroll back up
4. Check progress bar position

**Expected Result:**

- ✅ Progress bar sticks to top of screen while scrolling
- ✅ Always visible regardless of scroll position
- ✅ Has shadow/border for visibility
- ✅ Doesn't cover questionnaire content

**Bug Indicators:**

- ❌ Progress bar scrolls out of view
- ❌ Covers important content
- ❌ Doesn't stay at top
- ❌ Z-index issues (content overlaps it)

---

## 5️⃣ Auto-Save Tests

### Test 5.1: Auto-Save Trigger

**Steps:**

1. Load questionnaire (not submitted)
2. Answer a question
3. Wait 3 seconds without interacting
4. Check Network tab for API call
5. Check "Last saved at" timestamp

**Expected Result:**

- ✅ Auto-save triggers 3 seconds after last change
- ✅ Network shows POST to `/api/questionnaire/save`
- ✅ "Last saved at [time]" appears below header
- ✅ No toast notification (silent save)
- ✅ Console shows no errors

**Bug Indicators:**

- ❌ Auto-save doesn't trigger
- ❌ Triggers too quickly (< 3 seconds)
- ❌ Multiple rapid saves (debounce not working)
- ❌ 403/500 errors in Network tab
- ❌ Timestamp doesn't appear

---

### Test 5.2: Auto-Save Data Persistence

**Steps:**

1. Answer several questions
2. Wait for auto-save (watch for timestamp)
3. Refresh the page (F5 or Cmd+R)
4. Wait for page to reload
5. Check if responses are still there

**Expected Result:**

- ✅ All saved responses load correctly
- ✅ No data loss
- ✅ Progress bar shows correct percentage
- ✅ Form state matches what was saved

**Bug Indicators:**

- ❌ Responses disappear after refresh
- ❌ Only some responses saved
- ❌ Data corruption (wrong values)
- ❌ Progress resets to 0%

---

### Test 5.3: Auto-Save During Typing

**Steps:**

1. Focus on a textarea question
2. Type continuously for 10 seconds
3. Stop typing
4. Wait 3 seconds
5. Check for auto-save

**Expected Result:**

- ✅ Auto-save waits until you stop typing
- ✅ Doesn't interrupt your typing
- ✅ Saves after 3-second pause
- ✅ Full text content is saved

**Bug Indicators:**

- ❌ Saves while typing (disruptive)
- ❌ Truncates text mid-typing
- ❌ Cursor jumps during save
- ❌ Input loses focus

---

## 6️⃣ Manual Save Tests

### Test 6.1: Save Progress Button

**Steps:**

1. Answer some questions
2. Click "Save Progress" button
3. Observe feedback
4. Check Network tab

**Expected Result:**

- ✅ Button shows loading state (spinner + "Saving...")
- ✅ Button disabled during save
- ✅ Toast notification appears: "Progress Saved"
- ✅ "Last saved at" timestamp updates
- ✅ POST request to `/api/questionnaire/save` succeeds (200)

**Bug Indicators:**

- ❌ Button doesn't respond
- ❌ No loading indicator
- ❌ No toast notification
- ❌ API error (check console)
- ❌ Timestamp doesn't update

---

### Test 6.2: Save After Submission

**Steps:**

1. Complete and submit questionnaire
2. Reload page (should be in read-only mode)
3. Check if Save button is visible

**Expected Result:**

- ✅ Save button is hidden
- ✅ Submit button is hidden
- ✅ Form is in disabled state
- ✅ No way to modify responses

**Bug Indicators:**

- ❌ Save button still visible
- ❌ Can click save on submitted form
- ❌ API allows saving after submission (403 error expected)

---

## 7️⃣ Submit Tests

### Test 7.1: Submit with Incomplete Questionnaire

**Steps:**

1. Answer only 50% of required questions
2. Click "Submit Questionnaire" button
3. Observe behavior

**Expected Result:**

- ✅ Toast notification appears with error
- ✅ Message: "Incomplete Questionnaire" or similar
- ✅ Specifies first missing required question
- ✅ Submit dialog does NOT open
- ✅ Form remains in edit mode

**Bug Indicators:**

- ❌ Submit dialog opens anyway
- ❌ No validation error shown
- ❌ Submits with incomplete data
- ❌ No indication of what's missing

---

### Test 7.2: Submit Button State

**Steps:**

1. Load questionnaire with <100% progress
2. Check Submit button state
3. Complete all required questions
4. Check Submit button state again

**Expected Result:**

- ✅ Button disabled when progress < 100%
- ✅ Button has reduced opacity when disabled
- ✅ Hover/click doesn't work when disabled
- ✅ Button enables when progress = 100%
- ✅ Button is clickable when enabled

**Bug Indicators:**

- ❌ Button always enabled
- ❌ No visual disabled state
- ❌ Can click disabled button
- ❌ Doesn't enable at 100%

---

### Test 7.3: Submit Confirmation Dialog

**Steps:**

1. Complete all required questions (100%)
2. Click "Submit Questionnaire"
3. Observe dialog
4. Click Cancel/X to close
5. Click Submit again
6. Click Confirm

**Expected Result:**

- ✅ Dialog appears with warning message
- ✅ Message mentions responses will be "locked"
- ✅ Cancel button closes dialog without submitting
- ✅ Confirm button triggers submission
- ✅ Dialog shows loading state during submission
- ✅ Network shows POST to `/api/questionnaire/submit`

**Bug Indicators:**

- ❌ Dialog doesn't appear
- ❌ Cancel submits anyway
- ❌ No loading state
- ❌ Dialog doesn't close
- ❌ API error

---

### Test 7.4: Successful Submission

**Steps:**

1. Complete questionnaire 100%
2. Click Submit → Confirm
3. Wait for submission to complete
4. Observe outcome

**Expected Result:**

- ✅ Success toast: "Questionnaire Submitted! 🎉"
- ✅ Redirects to `/dashboard`
- ✅ Page refreshes
- ✅ If you navigate back to `/questionnaire`, form is read-only
- ✅ Database record has `isSubmitted: true` and `submittedAt` timestamp

**Bug Indicators:**

- ❌ Error toast appears
- ❌ Doesn't redirect
- ❌ Form still editable after submission
- ❌ Can submit again
- ❌ Database not updated

---

### Test 7.5: Re-Submission Prevention

**Steps:**

1. After submitting questionnaire
2. Try navigating to `/questionnaire` again
3. Check if form is editable

**Expected Result:**

- ✅ Form loads in read-only mode
- ✅ All responses are visible but disabled
- ✅ No Save or Submit buttons
- ✅ Message: "Your responses have been submitted and are now locked."

**Bug Indicators:**

- ❌ Form is editable
- ❌ Can submit again
- ❌ Buttons are visible
- ❌ No locked message

---

## 8️⃣ Validation Tests

### Test 8.1: Required Field Validation

**Steps:**

1. Find a required question (marked with red \*)
2. Leave it empty
3. Try to submit questionnaire
4. Observe validation

**Expected Result:**

- ✅ Submit blocked with error toast
- ✅ Error message mentions required field
- ✅ Form does not submit

**Bug Indicators:**

- ❌ Submits with empty required fields
- ❌ No validation error
- ❌ Asterisk missing on required fields

---

### Test 8.2: Character Limit Validation (Textarea)

**Steps:**

1. Find textarea with character limit (e.g., 500 chars)
2. Try typing more than limit
3. Check if blocked

**Expected Result:**

- ✅ Cannot type beyond maxLength
- ✅ Counter shows "500 / 500 characters"
- ✅ Paste is truncated if it exceeds limit

**Bug Indicators:**

- ❌ Can exceed character limit
- ❌ Counter shows wrong number
- ❌ Paste allows overflow

---

### Test 8.3: Minimum Character Validation

**Steps:**

1. Find textarea with minimum length requirement
2. Enter 1-2 characters
3. Try to submit

**Expected Result:**

- ✅ Validation error for minimum length
- ✅ Error message specifies minimum required
- ✅ Submit is blocked

**Bug Indicators:**

- ❌ Accepts text below minimum
- ❌ No validation error
- ❌ Submits anyway

---

## 9️⃣ Keyboard Navigation Tests

### Test 9.1: Tab Order

**Steps:**

1. Load questionnaire
2. Press Tab key repeatedly
3. Observe focus order

**Expected Result:**

- ✅ Skip link appears first (press Tab once from top)
- ✅ Focus moves through questions in logical order
- ✅ Each radio/checkbox/input receives focus
- ✅ Tab reaches Save and Submit buttons
- ✅ No keyboard traps (can Tab forward and Shift+Tab backward)

**Bug Indicators:**

- ❌ Focus jumps randomly
- ❌ Some elements can't receive focus
- ❌ Stuck in a component (keyboard trap)
- ❌ Tab order is illogical

---

### Test 9.2: Skip Link

**Steps:**

1. Load questionnaire
2. Press Tab once
3. Observe skip link appearance
4. Press Enter
5. Observe focus

**Expected Result:**

- ✅ Skip link becomes visible after first Tab
- ✅ Has clear text: "Skip to main content"
- ✅ Pressing Enter jumps focus to main questionnaire
- ✅ Skips over progress bar

**Bug Indicators:**

- ❌ Skip link doesn't appear
- ❌ Enter doesn't jump to content
- ❌ Link is always visible (should be hidden)

---

### Test 9.3: Radio Group Navigation

**Steps:**

1. Tab to a radio group
2. Use Arrow keys (Up/Down or Left/Right)
3. Press Space or Enter to select

**Expected Result:**

- ✅ Tab focuses first radio in group
- ✅ Arrow keys navigate between radio options
- ✅ Space/Enter selects focused radio
- ✅ Visual focus indicator is clear

**Bug Indicators:**

- ❌ Arrow keys don't work
- ❌ Must Tab through each radio (wrong behavior)
- ❌ Can't select with keyboard

---

### Test 9.4: Ranking Button Keyboard

**Steps:**

1. Tab to ranking question
2. Tab through each ranking option
3. Press Enter or Space on an option
4. Observe selection

**Expected Result:**

- ✅ Each option button receives focus
- ✅ Enter or Space toggles selection
- ✅ Visual feedback shows selection (numbered badge)
- ✅ Focus ring visible on focused button

**Bug Indicators:**

- ❌ Buttons not focusable
- ❌ Enter/Space doesn't work
- ❌ No visual focus indicator

---

## 🔟 Screen Reader Tests

### Test 10.1: VoiceOver (macOS/iOS)

**Steps:**

1. Enable VoiceOver (Cmd+F5 on Mac)
2. Navigate through questionnaire
3. Listen to announcements

**Expected Result:**

- ✅ Progress bar announces percentage
- ✅ Required fields announced as "required"
- ✅ Form controls have descriptive labels
- ✅ Auto-save timestamp is announced
- ✅ Character counters are announced
- ✅ Error messages are announced

**Bug Indicators:**

- ❌ No announcements for key elements
- ❌ Generic labels like "button" or "input"
- ❌ Missing ARIA labels

---

### Test 10.2: NVDA/JAWS (Windows)

**Steps:**

1. Enable NVDA or JAWS
2. Navigate with Tab and arrow keys
3. Listen to screen reader output

**Expected Result:**

- ✅ Same as VoiceOver test above
- ✅ All interactive elements have meaningful names
- ✅ Form structure is clear

**Bug Indicators:**

- ❌ Elements not announced
- ❌ Confusing navigation
- ❌ Missing labels

---

## 1️⃣1️⃣ Mobile Device Tests

### Test 11.1: Mobile Layout (375px)

**Steps:**

1. Open on iPhone or resize browser to 375px width
2. Scroll through entire questionnaire
3. Check all components

**Expected Result:**

- ✅ No horizontal scroll
- ✅ Text is readable without zooming
- ✅ Buttons stack vertically
- ✅ Touch targets ≥44×44px
- ✅ Progress bar fits screen
- ✅ Cards/sections have proper padding

**Bug Indicators:**

- ❌ Horizontal scroll required
- ❌ Text too small
- ❌ Buttons overlap
- ❌ Touch targets too small
- ❌ Layout broken

---

### Test 11.2: Touch Interaction

**Steps:**

1. Use actual mobile device (not simulator)
2. Tap radio buttons, checkboxes
3. Tap input fields to type
4. Tap Save and Submit buttons

**Expected Result:**

- ✅ All taps register correctly
- ✅ No accidental double-taps needed
- ✅ Keyboard appears for text inputs
- ✅ Buttons respond to touch
- ✅ No delay in interaction

**Bug Indicators:**

- ❌ Taps don't register
- ❌ Must tap multiple times
- ❌ Wrong element gets tapped
- ❌ Buttons don't respond

---

### Test 11.3: Orientation Change

**Steps:**

1. Load questionnaire in portrait mode
2. Rotate device to landscape
3. Rotate back to portrait

**Expected Result:**

- ✅ Layout adapts to new orientation
- ✅ No data loss during rotation
- ✅ Scroll position maintained reasonably
- ✅ All content still visible

**Bug Indicators:**

- ❌ Layout breaks
- ❌ Responses cleared
- ❌ Page reloads
- ❌ Content cut off

---

## 1️⃣2️⃣ Error Handling Tests

### Test 12.1: Network Failure During Save

**Steps:**

1. Open DevTools → Network tab
2. Answer some questions
3. Set throttling to "Offline"
4. Click "Save Progress"
5. Observe behavior

**Expected Result:**

- ✅ Error toast appears
- ✅ Message: "Save Failed" or "An error occurred"
- ✅ Button returns to normal state
- ✅ Data remains in form (not lost)
- ✅ Can retry save when back online

**Bug Indicators:**

- ❌ No error message
- ❌ Button stuck in loading state
- ❌ Page crashes
- ❌ Data disappears

---

### Test 12.2: Network Failure During Submit

**Steps:**

1. Complete questionnaire
2. Go offline (DevTools throttling)
3. Try to submit
4. Observe error handling

**Expected Result:**

- ✅ Error toast appears
- ✅ Submit dialog closes
- ✅ Form remains editable
- ✅ Can retry submission
- ✅ No partial submission

**Bug Indicators:**

- ❌ Silent failure
- ❌ Dialog stuck open
- ❌ Form gets locked anyway
- ❌ Partial data submitted

---

### Test 12.3: Session Expiration

**Steps:**

1. Start questionnaire
2. Wait for session to expire (or manually delete session cookie)
3. Try to save or submit
4. Observe behavior

**Expected Result:**

- ✅ 401 Unauthorized response
- ✅ Redirects to login page
- ✅ Shows message about session expiration (if possible)

**Bug Indicators:**

- ❌ No redirect
- ❌ Generic error
- ❌ Page crash
- ❌ Data loss

---

## 1️⃣3️⃣ Performance Tests

### Test 13.1: Initial Load Time

**Steps:**

1. Clear browser cache
2. Open DevTools → Network
3. Navigate to `/questionnaire`
4. Measure load time

**Expected Result:**

- ✅ Page loads in <3 seconds on good connection
- ✅ Skeleton screen shows immediately
- ✅ No layout shift when content loads
- ✅ Smooth transition from skeleton to content

**Bug Indicators:**

- ❌ Takes >5 seconds to load
- ❌ Blank screen during load
- ❌ Content jumps around
- ❌ Flash of unstyled content

---

### Test 13.2: Large Textarea Performance

**Steps:**

1. Find textarea with 1000+ character limit
2. Paste large block of text
3. Edit text rapidly
4. Watch character counter

**Expected Result:**

- ✅ No lag when typing
- ✅ Counter updates smoothly
- ✅ Auto-save doesn't cause stuttering
- ✅ No frame drops

**Bug Indicators:**

- ❌ Typing is laggy
- ❌ Counter freezes
- ❌ Input feels sluggish
- ❌ Browser warns about unresponsive script

---

## 1️⃣4️⃣ Browser Compatibility Tests

### Test 14.1: Chrome/Edge

**Steps:**

1. Test all above scenarios in Chrome
2. Check console for errors
3. Verify all features work

**Expected Result:**

- ✅ All features work correctly
- ✅ No console errors
- ✅ Visual styles correct

---

### Test 14.2: Firefox

**Steps:**

1. Repeat all tests in Firefox
2. Pay attention to form controls (Firefox has unique styling)

**Expected Result:**

- ✅ Same as Chrome
- ✅ Radio buttons and checkboxes work
- ✅ Focus styles visible

**Bug Indicators:**

- ❌ Broken layouts
- ❌ Non-functional controls
- ❌ Missing focus indicators

---

### Test 14.3: Safari (Desktop & iOS)

**Steps:**

1. Test on Safari (macOS)
2. Test on Safari (iOS)
3. Check form control behavior

**Expected Result:**

- ✅ All features work
- ✅ Touch events work on iOS
- ✅ No webkit-specific bugs

**Bug Indicators:**

- ❌ Buttons don't work
- ❌ Inputs don't focus
- ❌ Styles broken

---

## 📊 Bug Report Template

When you find a bug, document it using this template:

```markdown
### Bug #[Number]: [Short Description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**

1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[Attach if relevant]

**Environment:**

- Browser: [Chrome 120 / Firefox 121 / Safari 17, etc.]
- Device: [Desktop / iPhone 15 / Galaxy S23, etc.]
- Screen Size: [1920×1080 / 375×667, etc.]
- User State: [First-time / Has draft / Submitted]

**Console Errors:**
```

[Paste any console errors]

```

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ Testing Checklist Summary

### Core Functionality

- [ ] Authentication & Authorization
- [ ] First-time user flow
- [ ] Returning user flow
- [ ] Submitted user flow
- [ ] Agreement screen
- [ ] All 6 question types render correctly
- [ ] Progress tracking
- [ ] Auto-save (3-second debounce)
- [ ] Manual save
- [ ] Submit validation
- [ ] Submit confirmation
- [ ] Successful submission
- [ ] Re-submission prevention

### Accessibility

- [ ] Keyboard navigation
- [ ] Skip link
- [ ] Focus indicators
- [ ] Screen reader compatibility
- [ ] ARIA labels
- [ ] Touch target sizes (≥44px)

### Responsiveness

- [ ] Mobile (320px - 640px)
- [ ] Tablet (640px - 768px)
- [ ] Desktop (768px+)
- [ ] Orientation changes

### Error Handling

- [ ] Network failures
- [ ] Session expiration
- [ ] Validation errors
- [ ] API errors

### Performance

- [ ] Initial load time
- [ ] Typing responsiveness
- [ ] Auto-save performance

### Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (Desktop + iOS)
- [ ] Chrome Android

---

## 📝 Next Steps After Testing

1. **Collect all bugs** using the template above
2. **Prioritize** by severity (Critical → Low)
3. **Fix critical bugs** first (blocking user flow)
4. **Retest** after fixes
5. **Document** any known limitations
6. **Deploy** to staging environment
7. **User acceptance testing** with real users

---

## 🎯 Success Criteria

The questionnaire is ready for production when:

✅ All critical and high-severity bugs are fixed
✅ Core user flows work without errors
✅ Auto-save and submit work reliably
✅ Passes accessibility tests (keyboard + screen reader)
✅ Works on mobile devices (iOS + Android)
✅ No console errors in production
✅ Load time <3 seconds on average connection
✅ Data persistence is 100% reliable

Good luck with testing! 🚀
