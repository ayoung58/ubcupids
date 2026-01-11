# Phase 4 Complete Implementation Plan

## Current Issues to Fix

1. ❌ Q1/Q2 not selecting (state management issue)
2. ❌ Q36 missing (navigation/config issue)
3. ❌ Wrong preference layouts (multi-select vs same/similar confusion)
4. ❌ Dealbreaker error in DrugUseQuestion
5. ❌ Missing age input for Q4
6. ❌ Missing frequency for Q9 (needs to be split)
7. ❌ Love Languages wrong layout

## Implementation Order

### Step 1: Core Data Structure Fixes (30 min)

- Update QuestionConfig types to support all preference variations
- Fix responses state structure to handle Q9a/Q9b separately
- Add validation state tracking

### Step 2: Fix Q1/Q2 Selection Bug (15 min)

- Debug updateResponse function for hard filter questions
- Ensure Q1/Q2 state updates correctly

### Step 3: Create Q4 Age Component (20 min)

- AgeInput component with validation
- Red outline when out of range
- Error messages
- Update config.ts for Q4

### Step 4: Split Q9 into Q9a and Q9b (30 min)

- Update config.ts to have Q9a (substances) and Q9b (frequency)
- Create separate navigation steps
- Update completion tracking

### Step 5: Fix Love Languages (15 min)

- Remove same/similar selector
- Left: "How I show" multi-select (max 2)
- Right: "How I receive" multi-select (max 2)
- Keep importance scale

### Step 6: Update Preference Rendering Logic (45 min)

- Identify which questions use multi-select preference
- Remove same/similar selector for those questions
- Keep same/similar for Likert and directional questions
- Update PreferenceSelector routing logic

### Step 7: Fix All Runtime Errors (20 min)

- Fix DrugUseQuestion dealbreaker error
- Ensure all question types render without crashes
- Add null checks

### Step 8: Create Question Matrix Component (60 min)

- Collapsible panel
- ~10 buttons per row (3-4 rows)
- Completion tracking logic
- Color coding (green/hollow/red)
- Jump-to-question functionality
- Tooltips

### Step 9: Implement Completion Tracking (30 min)

- Logic: answer + (preference OR doesn't matter) + (importance OR doesn't matter OR dealbreaker)
- Update on every state change
- Store completion status per question

### Step 10: Update Progress Bar (15 min)

- Show percentage instead of "Question X of Y"
- Calculate: completed / 39 \* 100%
- Update in real-time

### Step 11: Update DoesntMatterButton (15 min)

- Clear preferences when toggled
- Add visual separator
- Ensure disables importance

### Step 12: Testing & Documentation (45 min)

- Comprehensive verification tests
- Test all 38 views
- Test completion tracking
- Test validation
- Create commit message

**Total Estimated Time: 5-6 hours**

## Key Design Decisions

### Question Types & Preference Layouts

Based on Questionnaire V2 spec:

**Multi-Select Preference (No same/similar selector)**:

- Q3: Sexual Orientation
- Q5: Cultural Background
- Q6: Religious Beliefs (has same/similar but for Jaccard)
- Q8: Alcohol
- Q9a: Drug substances
- Q13: Relationship Intent
- Q14: Field of Study
- Q15: Living Situation
- Q19: Pet Attitude
- Q20: Relationship Experience
- Q21: Love Languages (special - receive is preference)
- Q32: What Counts as Cheating

**Same/Similar Selector (Likert or directional)**:

- Q7: Political Leaning
- Q10: Exercise (directional: less/similarly/more)
- Q11: Relationship Style (same only)
- Q12: Sexual Activity (same/similar)
- Q16: Ambition (same/similar/different)
- Q17: Financial (same/similar/different)
- Q18: Time Availability (same/similar)
- Q22: Social Energy (same/similar/different)
- Q23: Recharge Style (same only)
- Q24: Party Interest (same/similar)
- Q26: Texting (same/similar)
- Q27: PDA (same/similar)
- Q28: Planning (same/similar/different)
- Q29: Sleep Schedule (same only)
- Q30: Cleanliness (same/similar)
- Q31: Openness (same/similar)
- Q33: Group Socializing (same/similar/different)
- Q34: Outdoor/Indoor (same/similar/different)
- Q35: Communication (same/similar/different)
- Q36: Emotional Processing (same/similar)

**Special Cases**:

- Q25: Conflict Resolution (dropdown: same/compatible/no preference)
- Q9b: Frequency (same/similar selector)

### Navigation Structure

Total 38 views:

1. Q1+Q2 (1 view, 2 completions)
2. Q3 (1 view)
3. Q4 (1 view)
4. Q5-Q8 (4 views)
5. Q9a (1 view)
6. Q9b (1 view)
7. Q10-Q36 (27 views)
8. Mandatory Free Response (1 view, 2 completions)
9. Optional Free Response (1 view, 3 completions)

### Completion Tracking Logic

A question is complete when ALL of:

- LEFT side answer provided
- RIGHT side: (preference specified OR doesn't matter toggled)
- Importance: (importance level selected OR dealbreaker OR doesn't matter toggled)

Special cases:

- Q1/Q2: Only left side needed (no preference/importance)
- Free response: Text entered (mandatory) or left blank (optional)

## Implementation Approach

I will implement this in **3 major commits**:

### Commit 1: Core Fixes & Data Structure

- Fix Q1/Q2 selection
- Add Q4 age inputs
- Split Q9 into Q9a/Q9b
- Fix Love Languages
- Update all question configs
- Fix preference rendering logic
- Fix all runtime errors

### Commit 2: Navigation & Progress

- Create Question Matrix component
- Implement completion tracking
- Update ProgressBar to percentage
- Update DoesntMatterButton behavior

### Commit 3: Testing & Polish

- Comprehensive testing
- Verification document
- Final bug fixes

## Confirmed Answers

1. ✅ Q6 (Religious Beliefs): Keep same/similar selector (not multi-select preference)
2. ✅ Q25 (Conflict Resolution): Two buttons ("same" and "compatible") + doesn't matter button (NOT dropdown)
3. ✅ Validation: Allow navigation with errors (Next button stays enabled), but:
   - Age input shows red outline when invalid
   - Cannot submit questionnaire if errors exist
   - Completion tracking marks incomplete if validation fails

## Additional Requirements

- Generate Phase_4_Verification.md document with comprehensive test cases
- Test all functionality after implementation
- Final review of ALL requirements against questionnaire spec
- Ask clarifying questions at end if needed
