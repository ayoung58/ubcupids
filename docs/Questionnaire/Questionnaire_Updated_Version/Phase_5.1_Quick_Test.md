# Phase 5.1 Testing Guide - Quick Reference

## Quick Start

1. **Start dev server**: `npm run dev`
2. **Navigate to**: http://localhost:3000/questionnaire
3. **Test submission flow** (see below)

## Priority Test: Complete Submission Flow

### Step-by-Step Test

1. ✅ Complete all questions to 100% (Q1-Q36 + 2 mandatory free responses)
2. ✅ Navigate to final page (Free Response section)
3. ✅ Verify button text: **"Submit Questionnaire"** (not "Complete")
4. ✅ Click "Submit Questionnaire"
5. ✅ Verify during submission:
   - Button shows "Submitting..."
6. ✅ Verify after submission:
   - Success alert appears
   - Green banner at top: "Questionnaire Submitted" + read-only message
   - All inputs visually dimmed (opacity-70)
   - Cannot click or type in inputs
   - Autosave indicator hidden
7. ✅ Refresh page:
   - Green banner persists
   - Inputs still disabled
   - Can navigate between pages
   - All responses still visible

## Expected Behavior

### Before Submission (0-99% complete)

- Button shows "Next →" or "Complete"
- Inputs are editable
- Autosave indicator visible
- Can make changes

### At 100% Complete (Ready to Submit)

- Button changes to **"Submit Questionnaire"**
- Button is enabled (pink, not gray)
- Clicking submits to API

### After Submission

- **Green banner** appears with checkmark icon
- **All inputs disabled** (pointer-events-none, opacity-70)
- **Autosave hidden** (not needed anymore)
- **Navigation works** (can view all pages)
- **Cannot edit** (inputs don't respond to clicks)
- **Refresh persists** (read-only mode survives page reload)

## Testing Summary

✅ **TypeScript Compilation: PASSED**

### What Was Implemented

1. Submit API endpoint (`POST /api/questionnaire/v2/submit`)
2. Submit button (appears at 100% completion)
3. Read-only mode (green banner, disabled inputs)
4. Autosave disabled after submission
5. Navigation still works to view responses
6. Prevents re-submission
7. Updates user flag (`needsQuestionnaireUpdate = false`)

## Quick Manual Test (5 minutes)

1. Start dev server
2. Navigate to `/questionnaire`
3. Complete all questions to 100%
4. Go to final page (Free Response)
5. Verify button: "Submit Questionnaire"
6. Click submit
7. Verify green banner appears
8. Try to edit any input (should be blocked)
9. Refresh page - verify still read-only

## Next Steps

Once you've tested and confirmed submission works:

**Option 1**: Continue with Phase 6 (Banner & Migration Path)
**Option 2**: Report any bugs/issues for fixes

---

Would you like me to proceed with Phase 6 now?
