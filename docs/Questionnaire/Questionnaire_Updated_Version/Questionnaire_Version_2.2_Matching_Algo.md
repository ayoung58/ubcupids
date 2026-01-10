# UBCupids Matching Algorithm — Design Specification (v2.2)

## Executive Summary

This document defines the complete matching algorithm for UBCupids, a university dating platform optimized for high-quality, mutually satisfying matches, while explicitly allowing users to remain unmatched rather than being paired with subpar partners.

The algorithm balances:

- Hard constraints (dealbreakers)
- Soft preferences with tunable importance
- Mutual satisfaction (no one-sided matches)
- Global optimization (system-wide best outcomes)

All parameters are interpretable, tunable, and designed for post-launch iteration.

## Core Principles

- Quality over quantity — no forced matches
- Mutual satisfaction required — asymmetry is penalized
- Hard constraints respected — dealbreakers are absolute
- Transparent & tunable — behavior can be explained and adjusted

## Algorithm Overview

The algorithm proceeds through 8 strictly ordered phases:

1. Hard Filtering — remove fundamentally incompatible pairs
2. Similarity Calculation — question-level compatibility $\in [0,1]$
3. Importance Weighting — user-defined preference strength
4. Directional Scoring — how well B satisfies A
5. Section Weighting — lifestyle > personality
6. Pair Score Construction — penalize asymmetry
7. Eligibility Thresholding — allow "no match" outcomes
8. Global Matching — maximize total compatibility

## Phase 1: Hard Filtering (Dealbreakers)

### Note:

Encourage UI copy that strongly warns users:

"Dealbreakers should be used sparingly. This will immediately exclude matches potential matches"

### Rule

A pair (A, B) is immediately disqualified if either user marks a question as Dealbreaker and the other user provides an incompatible response.

### Definition of "Incompatible" by Question Type

For categorical single-select questions:

- User B's answer $\neq$ User A's required answer

For multi-select questions (own answer and/or preference): **[CHANGED v2.2]**

- User B's answer is NOT in User A's acceptable preference set

**Example (Q5 - Ethnicity):**

- User A (Asian) prefers [Asian, White, Mixed] + Dealbreaker
- User B answers "Black"
- → Pair is disqualified

For ordinal/Likert questions:

- User B's answer falls outside User A's acceptable range
- If User A specifies "same" as preference: User B's answer $\neq$ User A's answer
- If User A specifies "similar" as preference: |User B's answer - User A's answer| > 1

For "Prefer not to answer": **[UNCHANGED]**

- If User A marks any question as Dealbreaker and User B selects "Prefer not to answer"
- → Pair is disqualified

### Rationale

Dealbreakers are non-negotiable constraints, not preferences.

Early filtering:

- Prevents misleading high scores
- Reduces computation
- Fully respects user boundaries

### Example

- User A: Non-smoker (Dealbreaker)
- User B: Smokes occasionally
- → Pair removed immediately

## Phase 2: Similarity Calculation

**[MAJOR CHANGES v2.2]**

For each answered question, compute a similarity score $\in [0,1]$.

### Critical Implementation Note [NEW v2.2]

For all split-screen questions:

Similarity is calculated between: User B's answer (left side response) vs. User A's preference specification (right side preference)

NOT between User A's answer vs. User B's answer

This directional calculation is what enables score(A → B) to measure "how well B satisfies A's preferences"

**Example:**

- User A answers: "I drink socially" + preference: "I prefer my match to drink [never, rarely]"
- User B answers: "I drink rarely"
- Similarity calculation: Compare B's "rarely" against A's acceptable set [never, rarely] → similarity = 1.0

### Question Type Classification [REORGANIZED v2.2]

#### Type A: Categorical Single-Select (No Preference Specification)

Used for: Gender Identity (Q1), Age (Q4)

- similarity = 1.0 if answers match
- similarity = 0.0 otherwise

These are typically hard filters, so similarity calculation is rarely needed.

#### Type B: Categorical Single-Select with "Same" Preference [NEW v2.2]

Used for: Relationship Style (Q11 - though own answer is single-select, preference allows multi-select)

When user specifies "same" preference:

- similarity = 1.0 if match's answer = user's answer
- similarity = 0.0 otherwise

#### Type C: Multi-Select (Own Answer) with Multi-Select Preference [NEW v2.2]

Used for: Religion (Q6), Cultural Background (Q5), Relationship Intent (Q13), Love Languages (Q21 - special case)

##### C1: "Same" Preference

- similarity = 1.0 if match's answer set = user's answer set (identical sets)
- similarity = 0.0 otherwise

##### C2: "Similar" Preference

- similarity = |match's answers ∩ user's answers| / |match's answers ∪ user's answers|
- (Jaccard similarity - measures proportional overlap)

**Example (Q6 - Religion):**

- User A answers: [Christian, Spiritual but not religious]
- User A preference: "similar"
- User B answers: [Christian, Jewish]
- Jaccard similarity = |{Christian}| / |{Christian, Spiritual, Jewish}| = 1/3 = 0.33

#### Type D: Single-Select (Own Answer) with Multi-Select Preference [NEW v2.2]

Used for: Alcohol (Q8), Living Situation (Q15), Pet Attitude (Q19), Relationship Experience (Q20), Field of Study (Q14), many Section 2 questions

##### D1: Set Membership Check

If match's answer ∈ user's acceptable preference set:

- similarity = 1.0

Else:

- similarity = 0.0

**Example (Q8 - Alcohol):**

- User A answers: "Socially"
- User A preference: [Never, Rarely] (wants match who drinks less)
- User B answers: "Rarely"
- B's "Rarely" ∈ A's [Never, Rarely] → similarity = 1.0

Note: This applies regardless of whether the user selected "same" or "similar" for multi-select preferences, as the user has already defined their acceptable set by selecting multiple options.

#### Type E: Multi-Select (Own Answer) with Single Directional Preference [NEW v2.2]

Used for: Drug Use (Q9)

##### E1: Compound Matching Logic

Q9 has two components:

- Substances (multi-select)
- Frequency (single-select ordinal)

The preference states: "I prefer my match to use [selected substances] at a [similar frequency / doesn't matter]"

**Step 1 - Substance Check:**

If match's substances ∩ user's preferred substances ≠ ∅:

- substances_match = true

Else:

- substances_match = false

**Step 2 - Frequency Check (if substances_match = true):**

If frequency preference = "similar":

- frequency_similarity = 1 - |match_freq - user_freq| / (max_freq - min_freq)

Else if frequency preference = "doesn't matter":

- frequency_similarity = 1.0

**Combined Similarity:**

If substances_match = false:

- similarity = 0.0

Else:

- similarity = frequency_similarity

**Example:**

- User A: Uses [Cannabis] at "Regularly"
- User A preference: Match uses [Cannabis, None] at "similar" frequency
- User B: Uses [Cannabis] at "Occasionally"
- Substance overlap exists → frequency_similarity = 1 - |Regularly - Occasionally|/range ≈ 0.67

#### Type F: Ordinal/Likert (1-5) with "Same/Similar" Preference [ENHANCED v2.2]

Used for: Political Leaning (Q7), Exercise (Q10), Ambition (Q16), Financial Attitudes (Q17), Time Availability (Q18), and most Section 2 questions

##### F1: "Same" Preference

- similarity = 1.0 if match_value = user_value
- similarity = 0.0 otherwise

##### F2: "Similar" Preference

- similarity = 1 - |match_value - user_value| / (max - min)

Optional sensitivity control:

- similarity = 1 - (|match_value - user_value| / (max - min))^EXPONENT

where EXPONENT = 1.0 by default

**Example:**

- User A: Political leaning = 2 (somewhat progressive)
- User A preference: "similar"
- User B: Political leaning = 3 (centrist)
- similarity = 1 - |2-3|/4 = 0.75

#### Type G: Ordinal/Likert with Directional Preference ("More"/"Less") [NEW v2.2]

Used for: Exercise (Q10), Ambition (Q16), Social Energy (Q22), some Section 2 questions

##### G1: "More" Preference

User wants match to score higher on the scale.

If match_value > user_value:

- similarity = 1.0

Else:

- similarity = max(0, 1 - (user_value - match_value) / (max - min))

Rationale: Perfect compatibility when match exceeds user's level. Similarity decreases linearly as match falls below user's level.

**Example (Q10 - Exercise):**

- User A: Exercise = 2 (1-2x/week)
- User A preference: "more"
- User B: Exercise = 4 (5-6x/week)
- B > A → similarity = 1.0

##### G2: "Less" Preference

User wants match to score lower on the scale.

If match_value < user_value:

- similarity = 1.0

Else:

- similarity = max(0, 1 - (match_value - user_value) / (max - min))

**Example (Q10 - Exercise):**

- User A: Exercise = 4 (5-6x/week)
- User A preference: "less"
- User B: Exercise = 2 (1-2x/week)
- B < A → similarity = 1.0

#### Type H: Ordinal/Likert with "Different" Preference [NEW v2.2]

Used for: Social Energy (Q22), Ambition (Q16), Group Socializing (Q33), Outdoor vs Indoor (Q34), Communication Directness (Q35)

##### H1: Inverse Similarity

User explicitly wants dissimilarity.

- similarity = |match_value - user_value| / (max - min)

Rationale: This is the inverse of the normal Likert formula. Maximum similarity (1.0) when users are at opposite ends of the scale.

**Example (Q22 - Social Energy):**

- User A: Social energy = 1 (strong introvert)
- User A preference: "different"
- User B: Social energy = 5 (strong extrovert)
- similarity = |1-5|/4 = 1.0 (perfect complementary match)

#### Type I: Special Cases [NEW v2.2]

##### I1: Love Languages (Q21)

Q21 asks users to select:

- Top 2 they show
- Top 2 they receive

Preference: "I prefer my match to have the same or similar love languages"

Compatibility Logic: The algorithm measures how well the match's way of showing love aligns with how the user likes to receive love (and vice versa for mutual scoring).

Calculation:

$$
compatibility\_score = \left( \frac{|\text{user's_receive} \cap \text{match's_show}|}{2} \right) \times 0.5 + \left( \frac{|\text{match's_receive} \cap \text{user's_show}|}{2} \right) \times 0.5
$$

Where division by 2 normalizes since users select exactly 2 languages.

"Same" vs "Similar" Preference:

If preference = "same":

- similarity = 1.0 if compatibility_score = 1.0
- similarity = 0.0 otherwise

If preference = "similar":

- similarity = compatibility_score

**Example:**

- User A: Shows [Physical Touch, Quality Time], Receives [Words, Acts of Service]
- User A preference: "similar"
- User B: Shows [Words, Acts of Service], Receives [Physical Touch, Gifts]
- A receives ∩ B shows = {Words, Acts of Service} = 2/2 = 1.0
- B receives ∩ A shows = {Physical Touch} = 1/2 = 0.5
- compatibility_score = 1.0 × 0.5 + 0.5 × 0.5 = 0.75

##### I2: Sleep Schedule (Q29) with "Flexible" Option

Q29 options: Early bird, Night owl, Flexible

Special Compatibility Rule:

If either user = "Flexible":

- similarity = 1.0

Else if both users have same schedule:

- similarity = 1.0

Else:

- similarity = 0.0

Rationale: "Flexible" is compatible with any option, as noted in questionnaire comments.

##### I3: Conflict Resolution (Q25) - Multi-Select with "Same/Compatible" Preference

###### Question Structure

Primary Question: "When conflict comes up with someone you're dating, what feels most natural to you? (Select all that apply, up to 2)"

Response Format: Multi-select (maximum 2 selections)

Options:

- Compromise-focused — Find middle ground where both people give a little
- Solution-focused — Take action together to solve the root problem
- Emotion-focused — Express and process feelings before problem-solving
- Analysis-focused — Understand what caused the conflict and why
- Space-first — Take time to cool down before discussing
- Direct-address — Talk through the issue immediately and openly

Preference dropdown: "same / compatible / no preference"

###### "Compatible" Definition

Certain combinations of conflict styles work well together even if not identical. The compatibility is based on empirical conflict resolution research and complementary dynamics.

###### Compatibility Matrix

| Compromise | 1.0 | 0.9 | 0.6 | 0.7 | 0.5 | 0.6 |
| ---------- | --- | --- | --- | --- | --- | --- |
| Solution   | 0.9 | 1.0 | 0.7 | 0.9 | 0.6 | 0.8 |
| Emotion    | 0.6 | 0.7 | 1.0 | 0.5 | 0.7 | 0.5 |
| Analysis   | 0.7 | 0.9 | 0.5 | 1.0 | 0.6 | 0.7 |
| Space      | 0.5 | 0.6 | 0.7 | 0.6 | 1.0 | 0.3 |
| Direct     | 0.6 | 0.8 | 0.5 | 0.7 | 0.3 | 1.0 |

High compatibility (0.8-0.9):

- Compromise ↔ Solution (both action-oriented)
- Solution ↔ Analysis (understanding + action)
- Solution ↔ Direct (proactive approaches)

Moderate compatibility (0.5-0.7):

- Emotion ↔ Space (both need emotional processing)
- Emotion ↔ Solution (balance feelings + action)
- Most other cross-combinations

Lower compatibility (0.3-0.5):

- Space ↔ Direct (fundamentally opposite timing)
- Emotion ↔ Analysis (can clash without awareness)
- Space ↔ Compromise (delaying vs immediate resolution)

###### Calculation

If preference = "same":

- similarity = 1.0 if match's answer set = user's answer set (exact match)
- similarity = 0.0 otherwise

**Example:**

- User A: [Solution-focused, Space-first] + preference: "same"
- User B: [Solution-focused, Space-first]
- Exact match → similarity = 1.0

If preference = "compatible":

**Step 1: Calculate Direct Overlap**

- overlap_score = |user's answers ∩ match's answers| / max(|user's answers|, |match's answers|)

**Step 2: Calculate Cross-Compatibility**

- compatibility_scores = [MATRIX[u][m] for u in user's answers for m in match's answers]
- avg_compatibility = mean(compatibility_scores)

**Step 3: Combined Similarity**

- similarity = 0.6 × overlap_score + 0.4 × avg_compatibility

Rationale:

- 60% weight on overlap rewards shared approaches
- 40% weight on cross-compatibility allows complementary styles to score well

**Example 1 - Partial Overlap:**

- User A: [Solution-focused, Direct-address] + preference: "compatible"
- User B: [Solution-focused, Space-first]
- Overlap: 1/2 = 0.5
- Compatibility scores: [1.0, 0.6, 0.8, 0.6]
- Avg compatibility: 0.75
- Final similarity: 0.6 × 0.5 + 0.4 × 0.75 = 0.60

**Example 2 - No Overlap, High Compatibility:**

- User A: [Compromise-focused] + preference: "compatible"
- User B: [Solution-focused]
- Overlap: 0/1 = 0.0
- Avg compatibility: 0.9
- Final similarity: 0.6 × 0.0 + 0.4 × 0.9 = 0.36

**Example 3 - No Overlap, Low Compatibility:**

- User A: [Direct-address] + preference: "compatible"
- User B: [Space-first]
- Overlap: 0/1 = 0.0
- Avg compatibility: 0.3
- Final similarity: 0.6 × 0.0 + 0.4 × 0.3 = 0.12

If preference = "no preference":

- Question excluded (weight = 0)

### "Prefer Not to Answer" Handling [UNCHANGED]

Handled only when the other user cares:

| Other User's Importance | Similarity Used | Reason               |
| ----------------------- | --------------- | -------------------- |
| Dealbreaker             | N/A             | Filtered in Phase 1  |
| Very Important          | 0.3             | Penalize uncertainty |
| Important or less       | Excluded        | Not worth penalizing |

Key property: "Prefer not to answer" is never rewarded, but only penalized when it matters.

## Phase 3: Importance Weighting [UNCHANGED]

Each user assigns an importance level per question.

| Importance Level   | Weight      |
| ------------------ | ----------- |
| Not Important      | 0.0         |
| Somewhat Important | 0.5         |
| Important          | 1.0         |
| Very Important     | 2.0         |
| Dealbreaker        | Hard filter |

### "Doesn't Matter" Option Handling [CLARIFIED v2.2]

When a user selects "doesn't matter" as their preference (right side of split screen):

- This question receives weight = 0.0 for that user
- The question is excluded entirely from both numerator and denominator in Phase 4
- This is functionally identical to selecting "Not Important" on the importance scale
- Both the importance scale and dealbreaker button are disabled/greyed out when "doesn't matter" is selected

Rationale:

- Linear weights prevent domination by single questions
- Allows meaningful accumulation of moderate preferences
- Stable, interpretable, and tunable

Rejected: logarithmic scales (e.g., 1/10/50) due to brittleness.

## Phase 4: Directional Scoring [CLARIFIED v2.2]

Compute how well User B satisfies User A:

$$
score(A \rightarrow B) = \frac{\Sigma [\ weight_A(q) \times similarity_q(A,B) ]}{\Sigma [\ weight_A(q) ]}
$$

### Rules

- Only questions with weight > 0 are included
- "Not Important" questions are excluded entirely
- Questions where user selected "doesn't matter" preference are excluded
- Skipped questions are excluded unless penalized in Phase 2 (Prefer not to answer case)
- Output $\in [0,1]$

### Interpretation

"User B satisfies 72% of what User A is looking for."

This is a weighted average of how well B's answers match A's stated preferences.

## Phase 5: Section Weighting [UNCHANGED]

The questionnaire is split into two sections:

- Section 1 (65%) — lifestyle, values, surface-level compatibility (Q1-Q20)
- Section 2 (35%) — personality, interaction style, relationship dynamics (Q21-Q36)

$$
score_{final}(A \rightarrow B) = 0.65 \times score_{S1}(A \rightarrow B) + 0.35 \times score_{S2}(A \rightarrow B)
$$

Rationale

- Lifestyle incompatibilities cause early relationship failure
- Personality differences affect enjoyment, not viability
- Section 2 still meaningfully differentiates viable pairs

## Phase 6: Pair Score Construction (Mutuality) [UNCHANGED]

Given:

- score(A → B) — how well B satisfies A
- score(B → A) — how well A satisfies B

Compute:

$$
pair\_score = \alpha \times \min(score(A\rightarrow B), score(B\rightarrow A)) + (1 - \alpha) \times \text{mean}(score(A\rightarrow B), score(B\rightarrow A))
$$

Where: $\alpha = 0.65$

### Why this formulation

- Strongly penalizes one-sided matches
- Preserves strong mutual compatibility
- Less brittle than geometric mean
- More honest than simple averaging

**Example:**

- score(A → B) = 0.9
- score(B → A) = 0.5
- pair_score = 0.65 × 0.5 + 0.35 × 0.7 = 0.325 + 0.245 = 0.57

The low mutual score (0.5) significantly drags down the pair score despite A being highly satisfied.

## Phase 7: Eligibility Threshold (Quality Gate) [UNCHANGED]

A pair (A, B) is eligible only if all conditions pass:

### Relative Thresholds

- score(A → B) ≥ β × best_score(A)
- score(B → A) ≥ β × best_score(B)

Where best_score(X) = highest score(X → Y) among all potential matches for user X

### Absolute Floor

- pair_score ≥ T_MIN

Recommended Defaults

- β = 0.6
- T_MIN = 0.25

Rationale

- Relative thresholds prevent "settling" — users are only matched if the pair is close to their best option
- Absolute floor catches pathological edge cases (e.g., two users with very low mutual compatibility)
- Explicitly allows users to remain unmatched rather than receiving poor-quality matches

## Phase 8: Global Matching [UNCHANGED]

### Graph Construction

- Nodes: users
- Edges: eligible pairs (passed Phase 7)
- Edge weights: pair_score

### Algorithm

Maximum Weight Matching (Blossom Algorithm)

Chosen because:

- Pool size (~500 users) is computationally manageable
- Produces globally optimal outcomes
- Naturally supports unmatched users (nodes without edges remain unmatched)
- Guarantees no two matches could swap and both be happier

Greedy matching is explicitly rejected due to suboptimal global outcomes.

## Tunable Parameters (Post-Launch) [UNCHANGED]

All values below must be configurable via admin interface or config file:

1. Section Weights
   - SECTION_1_WEIGHT = 0.65
   - SECTION_2_WEIGHT = 0.35
   - Recommended range: Section 1 ∈ [0.55, 0.75]
2. Importance Weights
   - W_NOT = 0.0
   - W_SOMEWHAT = 0.5
   - W_IMPORTANT = 1.0
   - W_VERY = 2.0
   - Recommended range: W_VERY ∈ [2.0, 3.0]
3. Unanswered Penalty
   - UNCERTAINTY_SIMILARITY = 0.3
   - Recommended range: [0.2, 0.5]
4. Asymmetry Weight
   - ALPHA = 0.65
   - Recommended range: [0.60, 0.75]
5. Relative Threshold
   - BETA = 0.6
   - Recommended range: [0.50, 0.70]
6. Absolute Floor
   - T_MIN = 0.25
   - Recommended range: [0.20, 0.35]
7. Likert Sensitivity (Optional)
   - EXPONENT = 1.0
   - Recommended range: [0.8, 1.2]
   - Applied in Type F2 (Similar preference for Likert):
   - similarity = 1 - (|match_value - user_value| / (max - min))^EXPONENT

## Implementation Notes [ENHANCED v2.2]

The system should support:

### Architecture

- Strict modular separation of all 8 phases
- Deterministic outputs for reproducibility
- Question type routing — each question mapped to its similarity calculation type (A-I)
- Preference parsing — system must extract both user's answer AND user's preference specification for each question

### Logging & Diagnostics

- % of users matched
- Pair score distribution
- Eliminations per phase (how many pairs filtered at each step)
- Simulation mode for parameter tuning
- Per-question similarity score distributions

### Per-User Outputs

- Best possible score (highest score(User → X) found)
- Match score (if matched)
- Explicit reason for being unmatched:
  - "No eligible pairs passed Phase 7 thresholds"
  - "Filtered by dealbreakers in Phase 1"
  - "No mutually compatible pairs after global matching"

### Data Structure Requirements [NEW v2.2]

For each question, store:

```json
{
  "question_id": 7,
  "type": "F", // Ordinal with same/similar preference
  "user_answer": 2,
  "user_preference": {
    "type": "similar",
    "range": null // or [min, max] if applicable
  },
  "importance": "very_important",
  "is_dealbreaker": false
}
```

For multi-select:

```json
{
  "question_id": 6,
  "type": "C", // Multi-select own + preference
  "user_answer": ["Christian", "Spiritual but not religious"],
  "user_preference": {
    "type": "similar",
    "acceptable_set": null // null means same as user_answer
  },
  "importance": "important",
  "is_dealbreaker": false
}
```

## Summary of Changes from v2.1 to v2.2

### Critical Additions:

- Phase 1: Explicit definition of "incompatible" for all question types
- Phase 2: Complete reorganization into Types A-I with specific formulas for:
  - Multi-select preference matching (Type D)
  - Directional Likert ("more"/"less" - Type G)
  - "Different" preference (Type H)
  - Love languages compatibility (Type I1)
  - Drug use compound logic (Type E)
  - Sleep schedule "Flexible" handling (Type I2)
  - Conflict resolution compatibility matrix (Type I3)
- Phase 2: Critical implementation note about split-screen directional calculation
- Phase 3: Explicit "doesn't matter" handling clarification

### Clarifications:

- Phase 4: Added explicit note about directional scoring
- All phases: Added specific question references (Q1, Q7, etc.) for clarity

### Documentation:

- Added question type classification table
- Added numerous worked examples
- Added data structure requirements for implementation

## Notes on Design Decisions

### Why "More"/"Less" Uses Linear Decay

For directional preferences, we assign perfect similarity (1.0) when the condition is met, then linearly decrease similarity as the match deviates in the wrong direction. This is more forgiving than a binary 0/1 split and allows the algorithm to distinguish between "somewhat acceptable" and "completely unacceptable" deviations.

### Why Love Languages Use Bidirectional Matching

Research on love languages emphasizes that relationship satisfaction comes from partners understanding how to show love in the way the other receives it best. A unidirectional match (only checking if their showing matches my receiving) would miss cases where compatibility is asymmetric.

### Why "Flexible" Gets Perfect Similarity

Users who mark themselves as "Flexible" for attributes like sleep schedule are explicitly signaling adaptability. Treating this as compatible with any option respects that user's stated preference for flexibility.

### Why Conflict Resolution Uses a Compatibility Matrix

Certain conflict styles are empirically known to work well together even if not identical (e.g., emotion-driven + logic-driven can be complementary if both partners are aware). A simple "same/different" binary would miss these nuanced compatibilities.

End of Specification v2.2
