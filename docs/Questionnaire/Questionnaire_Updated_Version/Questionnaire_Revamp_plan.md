Overview
This is a phased, incremental implementation that allows testing after each step. Each phase builds on the previous one without breaking existing functionality until we're ready to switch over.

PHASE 1: Database Schema & Migration
Goal: Create new database structure without touching existing code

Tasks:
Create new Prisma schema models

QuestionnaireResponseV2 table with flexible JSON structure
Support for split-screen data (answer + preference + importance + dealbreaker)
Free response fields (2 mandatory, 3 optional)
Timestamps and user relations
Create migration script

Wipe all existing questionnaire responses
Create new v2 tables
Add banner flag to User model: needsQuestionnaireUpdate: Boolean
Update Prisma schema types

Files to modify:
schema.prisma
Testing Checkpoint:
✅ Run prisma migrate dev
✅ Verify new tables exist in database
✅ Verify old responses are cleared
✅ Test user creation still works
PHASE 2: Type Definitions & Constants
Goal: Define TypeScript types and question configuration without breaking existing code

Tasks:
Create questionnaire config file (lib/questionnaire/v2/config.ts)

Define all 36 questions with metadata
Question types (likert, single-select, multi-select, etc.)
Preference types (same/similar/different, multi-select, doesn't matter)
Section assignments (1-20, 21-36)
Validation rules (max selections, age ranges, etc.)
Create type definitions (types/questionnaire-v2.ts)

Response types for each question pattern
Preference types
Importance levels enum
Section types
Create constants file (lib/questionnaire/v2/constants.ts)

Importance weights: NOT_IMPORTANT=0, SOMEWHAT=0.5, IMPORTANT=1.0, VERY=2.0
Section weights: SECTION_1=0.65, SECTION_2=0.35
Progress calculation constants
Validation limits (age 18-40, max 300 chars, etc.)
Files to create:
lib/questionnaire/v2/config.ts
types/questionnaire-v2.ts
lib/questionnaire/v2/constants.ts
Testing Checkpoint:
✅ TypeScript compilation passes
✅ No import errors
✅ Existing app still runs
PHASE 3: UI Components - Building Blocks
Goal: Create reusable UI components for question rendering

Tasks:
Create base question components

QuestionCard.tsx - Container with left/right split (50/50 desktop, stacked mobile)
LeftSide.tsx - User's self-description area
RightSide.tsx - Preference + importance controls
ImportanceScale.tsx - Horizontal radio buttons + dealbreaker button
DoesntMatterButton.tsx - Toggle that disables other controls
Create answer input components

SingleSelectInput.tsx - Radio buttons
MultiSelectInput.tsx - Checkboxes with max selection limit
LikertScale.tsx - 1-5 slider with anchor labels
AgeRangeInput.tsx - Min/max numeric inputs (18-40)
TextInput.tsx - For "Other" options with text fields
Create preference input components

PreferenceSelector.tsx - Routes to correct preference type
SameSimilarDifferent.tsx - 3-option selector with "doesn't matter"
MultiSelectPreference.tsx - Checkboxes matching left side options
Create compound question components

DrugUseQuestion.tsx - Q9 special case (substances + frequency)
LoveLanguagesQuestion.tsx - Q21 special case (show vs receive)
Files to create:
components/questionnaire/v2/QuestionCard.tsx
components/questionnaire/v2/answer-inputs/_
components/questionnaire/v2/preference-inputs/_
components/questionnaire/v2/special-questions/\*
Testing Checkpoint:
✅ Build Storybook stories for each component (optional but recommended)
✅ Components render in isolation
✅ Responsive behavior works (50/50 → stacked)
✅ "Doesn't matter" disables importance correctly
PHASE 4: Main Questionnaire Page - Basic Structure
Goal: Build the questionnaire page layout and navigation

Tasks:
Create questionnaire page structure

Progress bar (linear, 38 total questions including 2 mandatory free response)
Section headers (Lifestyle, Personality, Free Response)
Question rendering loop
Navigation (prev/next buttons, skip optional)
Implement Q1/Q2 special layout

Render Gender Identity (Q1) and Gender Preference (Q2) side-by-side as first "card"
No importance/preference controls for these
Create free response section

2 mandatory questions at top
3 optional questions below (labeled clearly)
Character counter (max 300)
Progress calculation logic

Count only completed questions (1-36 + 2 mandatory free response)
Optional free response doesn't block progress
Update progress bar in real-time
Files to modify:
page.tsx (replace with V2 structure)
Files to create:
components/questionnaire/v2/QuestionnaireV2.tsx
components/questionnaire/v2/ProgressBar.tsx
components/questionnaire/v2/FreeResponseSection.tsx
Testing Checkpoint:
✅ Page loads without errors
✅ Can navigate between questions
✅ Progress bar updates correctly
✅ Q1/Q2 display side-by-side
✅ Free response section appears at end
⚠️ Note: Saving won't work yet - that's Phase 5
PHASE 5: API Routes - Save/Load Logic
Goal: Enable autosave, data persistence, and submission (restore critical feature!)

Tasks:
Create V2 API routes

POST /api/questionnaire/v2/save - Save partial/complete responses
GET /api/questionnaire/v2/load - Load existing responses
POST /api/questionnaire/v2/validate - Validate before submission
POST /api/questionnaire/v2/submit - Submit and lock questionnaire
Implement autosave logic

Debounce 3 seconds (same as before)
Save both answer + preference + importance for each question
Handle partial saves (not all questions answered)
Show save status indicator
Implement submission logic

Submit button appears when 100% complete
Validates all responses before submission
Sets isSubmitted = true and submittedAt timestamp
Updates user.needsQuestionnaireUpdate = false
Implement read-only mode

Display green banner when submitted
Disable all inputs (opacity + pointer-events-none)
Hide autosave indicator
Allow navigation to view responses
Validation logic

Age ranges (18-40, min < max)
Required fields (Q1-Q4, 2 mandatory free response)
Max character limits (300)
Multi-select limits (Q21: exactly 2, Q25: max 2)
Files to create:
app/api/questionnaire/v2/save/route.ts
app/api/questionnaire/v2/load/route.ts
app/api/questionnaire/v2/validate/route.ts
app/api/questionnaire/v2/submit/route.ts
lib/questionnaire/v2/validation.ts
Files to modify:
components/questionnaire/v2/QuestionnaireV2.tsx (add autosave hook + submission)
Testing Checkpoint:
✅ Autosave triggers after 3 seconds
✅ Manual save works
✅ Progress persists on page refresh
✅ Validation catches errors before submission
✅ Error messages display correctly
✅ Submit button appears at 100% completion
✅ Submission locks questionnaire (read-only mode)
✅ Banner displays for submitted questionnaires
✅ Inputs are disabled after submission
✅ Can still navigate to view all responses
PHASE 6: Banner & Migration Path
Goal: Notify existing users to retake questionnaire

Tasks:
Create banner component

Display on dashboard if user.needsQuestionnaireUpdate === true
Prominent, dismissible (but reappears until questionnaire completed)
Link directly to questionnaire
Update user flags

Set needsQuestionnaireUpdate = true for all existing users (migration)
Clear flag when V2 questionnaire is completed
Update dashboard layout

Show banner at top of dashboard if needed
Hide old questionnaire status
Files to create:
components/dashboard/QuestionnaireUpdateBanner.tsx
Files to modify:
layout.tsx or DashboardLayoutClient.tsx
Prisma migration to set flags
Testing Checkpoint:
✅ Banner displays for existing users
✅ Banner disappears after completing V2
✅ New users don't see banner
PHASE 7: Cleanup - Remove Old Features
Goal: Remove deprecated functionality

Tasks:
Remove old tutorial

Comment out tutorial component imports
Remove tutorial state/logic from questionnaire page
Disable admin question configuration

Keep route and page file
Replace content with "Coming soon - V2 question management"
Update cupid dashboard to VIEW v2 data

Ensure cupids can see v2 responses (read-only)
Don't change layout yet (defer to later)
Disable test user script

Comment out or add warning to seed-test-data.ts
Add TODO comment for V2 implementation
Files to modify:
Tutorial.tsx (comment out)
app/(dashboard)/admin/configure-questionnaire/page.tsx (simplify)
app/(dashboard)/cupid-dashboard/\* (ensure v2 compatibility)
seed-test-data.ts (disable)
Testing Checkpoint:
✅ No tutorial appears
✅ Admin config page shows placeholder
✅ Cupid dashboard doesn't crash when viewing v2 responses
✅ Test script doesn't run (or warns user)
PHASE 8: Matching Algorithm - Complete Rewrite
Goal: Implement the 8-phase matching algorithm from spec

Tasks:
Create matching service structure

lib/matching/v2/index.ts - Main orchestrator
lib/matching/v2/phase1-hard-filters.ts
lib/matching/v2/phase2-similarity.ts
lib/matching/v2/phase3-importance.ts
lib/matching/v2/phase4-directional-scoring.ts
lib/matching/v2/phase5-section-weighting.ts
lib/matching/v2/phase6-pair-score.ts
lib/matching/v2/phase7-eligibility.ts
lib/matching/v2/phase8-global-matching.ts
Implement similarity calculations

Type A-I handlers (as defined in algo doc)
Special cases: Love Languages (Q21), Sleep Schedule (Q29), Conflict Resolution (Q25)
Conflict resolution compatibility matrix
Implement global matching

Blossom algorithm (use existing library or implement)
Handle unmatched users gracefully
Create tunable config

Config file for all parameters (α, β, T_MIN, section weights, etc.)
Admin interface to adjust (future)
Logging and diagnostics

Per-phase elimination tracking
Match quality metrics
Reason for no match (per user)
Files to create:
lib/matching/v2/_ (entire new matching system)
lib/matching/v2/config.ts (tunable parameters)
lib/matching/v2/types.ts
lib/matching/v2/utils/_ (similarity calculators)
Files to potentially deprecate:
ai.ts (old AI matching - review and possibly remove)
Testing Checkpoint:
✅ Algorithm runs without errors
✅ Test with 10+ mock users
✅ Verify matches are mutual
✅ Verify dealbreakers are respected
✅ Verify some users remain unmatched (quality threshold)
✅ Log output shows all 8 phases executing
PHASE 9: Admin Dashboard Integration
Goal: Enable admins to trigger matching

Tasks:
Update admin matching triggers

Button to run V2 matching algorithm
Display matching statistics
Show unmatched users and reasons
Cupid assignment flow

Assign questionnaire responses to cupids (if needed)
Update cupid portal to properly display v2 format
Matching history

Store matching run metadata
Show historical match quality trends
Files to modify:
app/(dashboard)/admin/\*/page.tsx (matching triggers)
app/api/admin/matching/route.ts
Testing Checkpoint:
✅ Admin can trigger matching
✅ Matching results appear correctly
✅ Cupid assignment works
PHASE 10: Test User Scripts
Goal: Re-enable test data generation with V2 format

Tasks:
Update test user script

Generate random but valid V2 responses
Respect question constraints (age ranges, max selections, etc.)
Include variety (different preferences, importance levels)
Create test scenarios

Perfect match pair
Dealbreaker conflict pair
Asymmetric pair (one-sided high score)
Files to modify:
seed-test-data.ts
Testing Checkpoint:
✅ Script generates valid V2 responses
✅ Test users can be matched
✅ Various match qualities represented
PHASE 11: New Tutorial (Final Polish)
Goal: Create updated tutorial for V2 questionnaire

Tasks:
Update tutorial content

Explain split-screen concept
Explain importance scale
Explain dealbreakers (use sparingly!)
Explain "doesn't matter" option
Position tutorial overlays

Point to left side (your answer)
Point to right side (preference)
Point to importance scale
Point to dealbreaker button
Files to create:
components/tutorial/TutorialV2.tsx
Files to modify:
components/questionnaire/v2/QuestionnaireV2.tsx (integrate tutorial)
Testing Checkpoint:
✅ Tutorial guides users through first question
✅ Tutorial can be skipped
✅ Tutorial doesn't reappear after completion
Testing Strategy Per Phase
After each phase:

Run the app locally (npm run dev)
Test the specific feature implemented in that phase
Verify nothing broke from previous phases
Commit changes with clear phase marker
Wait for your approval before proceeding
Risk Mitigation
Preserve autosave - Implemented in Phase 5 (early!)
Incremental UI changes - Components built in isolation first
New table strategy - No risk to existing data
Testing checkpoints - Catch issues early
Banner for users - Clear communication about changes

In addition, at the end of each phase:

- provide a summary of changes
- provide how to test with given changes for the changes of that phase
- provide a commit message and description.
