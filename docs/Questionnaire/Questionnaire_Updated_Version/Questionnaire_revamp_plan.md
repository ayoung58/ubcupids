Plan: UBCupids Questionnaire V2.2 Revamp
Complete overhaul of the questionnaire system to support split-screen "self vs. preference" format with 38 questions across 3 sections, new matching algorithm with 9 question types and directional scoring, dealbreaker hard filtering, and Blossom maximum-weight matching. Removes old features (tutorial, admin config editor content, test user script logic) and rebuilds with new architecture while preserving core functionality (auto-save, progress tracking, navigation).

Steps
Foundation & Cleanup Phase

Remove tutorial integration/questionnaire/_components/QuestionnaireForm.tsx) from QuestionnaireForm.tsx/questionnaire/_components/QuestionnaireForm.tsx) and delete Tutorial.tsx component
Clear content from admin/questionnaire-config/page.tsx/admin/questionnaire-config/page.tsx) (keep empty page structure)
Disable/comment out test user generation script questionnaire logic to prevent errors
Update TypeScript types in profile.ts for new response format: { ownAnswer, preference: { type, value, doesntMatter }, importance, dealbreaker }
Create new question configuration file questionnaireConfigV2.ts/questionnaire/_components/questionnaireConfigV2.ts) with Q1-Q38 from Questionnaire_Version_2.md
Database & API Layer

Update schema.prisma: Keep encrypted JSON structure but document new format in comments
Modify api/questionnaire/route.ts GET/POST endpoints to handle new response structure
Update encryption/decryption logic in questionnaire/page.tsx/questionnaire/page.tsx) server component to parse new format
Create migration utility function convertLegacyResponses() (for dev use if needed, not automatic migration)
Test API routes with Postman/Thunder Client using new format
Core UI Components - Preference Selectors

Create new components in _components:
PreferenceSelector.tsx - Base component for preference UI (same/similar/different/doesn't matter buttons)
ImportanceSelector.tsx - Refactor from existing, add disabled state logic
DealBreakerToggle.tsx - Checkbox component with disabled state
DoesntMatterButton.tsx - Toggle button that disables importance/dealbreaker
Implement conditional logic: when "doesn't matter" selected, disable importance selector and dealbreaker toggle
Add mobile-responsive styling (stack vertically on <768px)
Split-Screen Question Renderer

Rewrite QuestionRenderer.tsx/questionnaire/_components/QuestionRenderer.tsx) to two-column layout:
Left side: "About Me" with existing input types (radio, checkbox, textarea, age-range)
Right side: "My Preference" with PreferenceSelector + ImportanceSelector + DealBreakerToggle
Handle special cases:
Q21 (Love Languages): Two multi-select (max 2) components - left="top 2 show", right="top 2 receive" (reference current love languages implementation)
Q9 (Drug Use): Compound component with substances multi-select + frequency dropdown + preference logic
Age (Q4): Age input on left, age range selector on right (hard filter, no importance)
Gender/Sexual Orientation (Q1-Q3): Hard filters, no importance/dealbreaker UI
Add "Prefer not to answer" option for applicable questions
Main Questionnaire Integration

Update QuestionnaireForm.tsx/questionnaire/_components/QuestionnaireForm.tsx):
Replace old question config import with questionnaireConfigV2.ts
Update state management: responses object to new structure { questionId: { ownAnswer, preference: {...}, importance, dealbreaker } }
Update handleResponseChange() to manage nested preference object
Update progress calculation: 38 total questions (Q1-Q36 + Q60-Q61 mandatory free response)
Update section navigation: 3 sections instead of current structure
Preserve existing features: auto-save (3s debounce), manual save, jump-to-first-unanswered, back-to-top, read-only after submission
Update validation logic: require ownAnswer for all questions, preference optional (can be doesntMatter: true)
Matching Algorithm Core - Similarity Functions

Create new file lib/matching/similarityV2.ts with 9 question type implementations:
Type A: Categorical exact match (gender, age ranges)
Type B: Single-select with "same" preference
Type C: Multi-select with "same/similar" (Jaccard similarity)
Type D: Single answer vs. multi-select preference (set membership)
Type E: Compound Drug Use logic (substances + frequency)
Type F: Ordinal/Likert with same/similar (distance-based decay)
Type G: Directional Likert (more/less with linear decay)
Type H: "Different" preference (inverse similarity)
Type I: Special cases - Love Languages (bidirectional), Conflict Resolution (compatibility matrix), Sleep Schedule ("Flexible" wildcard)
Each function signature: calculateSimilarity(userBOwnAnswer, userAPreference): number (returns 0-1)
Include "Prefer not to answer" handling (treat as incompatible if other user has dealbreaker)
Matching Algorithm - Scoring & Filtering

Create lib/matching/algorithmV2.ts implementing 8 phases:
Phase 1: applyDealBreakerFilters() - hard filtering with incompatibility rules per question type
Phase 2-4: calculateDirectionalScore(userA, userB) - weighted similarity with importance multipliers (0.0, 0.5, 1.0, 2.0), handle "doesn't matter" (weight=0)
Phase 5: applySectionWeights() - Section 1: 65%, Section 2: 35%, free response excluded
Phase 6: constructPairScore(scoreAtoB, scoreBtoA) - formula: 0.65 × min + 0.35 × mean
Define constants at top of file: IMPORTANCE_WEIGHTS, SECTION_WEIGHTS, ASYMMETRY_ALPHA, MIN_THRESHOLD, RELATIVE_THRESHOLD
Add comprehensive logging for debugging
Matching Algorithm - Global Optimization

Research and select Blossom algorithm library:
Recommendation: Use edmonds-blossom npm package (pure JS, no external dependencies)
Alternative: Python networkx with separate API endpoint
Implement Phase 7: applyEligibilityThresholds() - filter pairs below relative (60% of best) and absolute (0.25) thresholds
Implement Phase 8: runBlossomMatching() - convert compatibility scores to weighted graph, run maximum-weight matching
Update admin/matching/run-algorithm route to use algorithmV2.ts
Store matches in Match table with new algorithmV2 match type
Cupid Dashboard Updates

Update cupid-dashboard/matching-portal/page.tsx/cupid-dashboard/matching-portal/page.tsx):
Add tabbed view for candidate questionnaires: "Own Answers" tab and "Preferences" tab
Display dealbreaker indicators (e.g., red flag icon) for dealbreaker-marked questions
Show importance ratings (color-coded: not important=gray, very important=bold)
Update compatibility score display to show Section 1 vs. Section 2 breakdown
Ensure mobile responsiveness for split-screen data display
Test User Generation Script

Rewrite seed-test-data.ts questionnaire section:
Generate random ownAnswer for each question type (respect min/max, options)
Generate random preference: 70% "same/similar", 20% specific values, 10% "doesn't matter"
Randomize importance (bell curve: mostly 1-3, occasional 4-5)
5% chance of dealbreaker on important questions
Ensure test data passes validation (all required fields present)
Add flag to generate "edge case" test users: all dealbreakers, all "doesn't matter", extreme preferences
Testing & Validation

Create lib/matching/tests/similarityV2.test.ts:
Unit tests for all 9 question type similarity functions
Edge cases: "Prefer not to answer", null values, empty arrays
Special case tests: Love Languages bidirectionality, Conflict Resolution matrix, Sleep Schedule flexible
Create lib/matching/tests/algorithmV2.test.ts:
Dealbreaker filtering tests (should disqualify pairs)
Directional scoring tests (A→B ≠ B→A)
Section weighting validation (65%/35% split)
Pair score construction (min/mean formula)
Threshold filtering (relative + absolute)
Manual testing checklist:
Create 10 test users with seed-test-data.ts, run matching, verify results make sense
Fill out questionnaire manually (desktop + mobile), verify all UI interactions work
Test "doesn't matter" button disables importance/dealbreaker correctly
Test auto-save and manual save preserve all fields
Test submission validation catches missing required fields
Test cupid portal displays both tabs correctly
Documentation & Final Polish

Update AI_SETUP.md or create new MATCHING_ALGORITHM_V2.md documenting:
New algorithm phases with formulas
Question type classifications (A-I)
Tunable constants and their locations in code
How to debug matching issues
Add inline code comments for complex similarity calculations
Update README.md if questionnaire changes affect setup/testing
Create migration guide for developers: "Breaking Changes in V2.2"