UBCupids Matching Algorithm — Design Specification (v2.0)
Executive Summary
This document defines the complete matching algorithm for UBCupids, a university dating platform designed to create high-quality matches while explicitly allowing users to remain unmatched rather than receiving poor-quality pairings.
Core Philosophy:

Quality over quantity — no forced matches
Mutual satisfaction required — prevents one-sided pairings
Interpretable and tunable — allows post-launch optimization
Respects hard constraints (dealbreakers) absolutely


Algorithm Overview
The matching process consists of 8 sequential phases:

Hard Filtering — Remove non-viable pairs
Similarity Calculation — Measure question-level compatibility
Importance Weighting — Apply user preference weights
Directional Scoring — Calculate how well B satisfies A
Section Weighting — Prioritize lifestyle over personality
Pair Score Construction — Combine mutual scores with asymmetry penalty
Eligibility Threshold — Filter out subpar matches
Global Matching — Optimize pairings across entire pool


Phase 1: Hard Filtering (Dealbreakers)
Purpose
Eliminate pairs where fundamental incompatibilities exist before any scoring occurs.
Rules
A pair (A, B) is immediately disqualified if:

User A marks question Q as "Dealbreaker" AND User B's answer doesn't satisfy A's requirement
User B marks question Q as "Dealbreaker" AND User A's answer doesn't satisfy B's requirement
User A marks dealbreaker on Q AND User B selected "Prefer not to answer"
User B marks dealbreaker on Q AND User A selected "Prefer not to answer"

Rationale
Dealbreakers represent non-negotiable requirements (e.g., "must not smoke," "must want monogamy"). Violating these creates fundamentally unviable matches. By filtering before scoring, we:

Reduce computational load
Prevent misleading high scores from other questions
Respect users' stated boundaries absolutely

Example

User A: "Non-smoker is a dealbreaker"
User B: "I smoke occasionally"
Result: Pair (A,B) is deleted from consideration, regardless of other compatibility


Phase 2: Similarity Calculation
For each question Q that both users answered, we calculate a similarity score between 0 and 1.
By Question Type
A) Categorical (Single-Select Multiple Choice)
similarity = 1.0 if answers match
similarity = 0.0 if answers differ
Example:

Q: "What is your religion?"
A answers: Christian
B answers: Christian → similarity = 1.0
C answers: Atheist → similarity = 0.0


B) Multi-Select (Check All That Apply)
similarity = |A ∩ B| / |A ∪ B|  (Jaccard similarity)
Why Jaccard? Proportional overlap matters. If two users both select "hiking" but have 20 other different interests, they're less compatible than two users who share 5 out of 6 interests.
Example:

Q: "What are your hobbies?"
User A selects: {hiking, cooking, reading}
User B selects: {hiking, reading, gaming}
Intersection: {hiking, reading} = 2 items
Union: {hiking, cooking, reading, gaming} = 4 items
similarity = 2/4 = 0.5


C) Ordinal/Likert Scales (1-5)
similarity = 1 - |answer_A - answer_B| / (max - min)
Why distance-based? Penalizes disagreement proportionally. Being 1 point apart (4 vs 5) is a minor difference; being 4 points apart (1 vs 5) is fundamental incompatibility.
Example:

Q: "How social are you?" (1 = introverted, 5 = extroverted)
A answers: 5, B answers: 4 → similarity = 1 - |5-4|/4 = 0.75
A answers: 5, B answers: 1 → similarity = 1 - |5-1|/4 = 0.0


Handling "Prefer Not to Answer"
Special rules apply when one user doesn't answer a question:
Other User's ImportanceSimilarity ValueRationaleDealbreakerN/A (filtered in Phase 1)Hard filterVery Important0.3Uncertainty penalty — risky but not confirmed mismatchImportantExcluded from calculationNot critical enough to penalize ambiguitySomewhat ImportantExcluded from calculationNot critical enough to penalize ambiguityNot ImportantExcluded from calculationNo weight anyway
Why 0.3 for "Very Important"?

Too harsh: 0.0 treats uncertainty as confirmed incompatibility
Too lenient: 1.0 rewards hiding information
Just right: 0.3 reflects risk without over-penalizing

Example:

User A marks "Are you religious?" as "Very Important" and wants "Yes"
User B selects "Prefer not to answer"
similarity = 0.3 (User A earns only 30% of possible points for this question)


Phase 3: Importance Weighting
Each user assigns an importance level to each question, determining how much that question contributes to their overall score.
Weight Scale
Importance LevelWeightDescriptionNot Important0.0Question is excluded from scoringSomewhat Important0.5Nice to have, minor preferenceImportant1.0Meaningful factor in compatibilityVery Important2.0Core value or lifestyle requirementDealbreakerN/AHandled in Phase 1 (hard filter)
Why This Scale?
Alternative considered: Logarithmic scale (0, 1, 10, 50)

Rejected because: One "Very Important" question would dominate 20+ other questions, making scores fragile and brittle. Small misclicks would have outsized impact.

Why 0/0.5/1/2 is better:

Stable: Moderate preferences accumulate meaningfully
Interpretable: Easy to explain to users and debug
Tunable: Can be adjusted post-launch without breaking system
Realistic: Reflects how people actually weight preferences (not all-or-nothing)

Example:
User A's preferences:

Religion (Very Important, weight = 2.0)
Political views (Important, weight = 1.0)
Love of hiking (Somewhat Important, weight = 0.5)
Favorite movie genre (Not Important, weight = 0.0)


Phase 4: Directional Scoring
We calculate how well User B satisfies User A's preferences (and vice versa separately).
Formula
score(A → B) = Σ [weight_A(q) × similarity_q(A,B)] / Σ [weight_A(q)]
Where:

The sum is over all questions Q that User A weighted > 0
Questions User A skipped or marked "Not Important" are excluded from numerator AND denominator

Why This Works

Self-normalizing: Denominator adjusts for how many questions A cared about
Bounded: Always produces a score between 0 and 1
Interpretable: "User B satisfies 73% of what User A is looking for"

Worked Example
User A's preferences and User B's compatibility:
QuestionWeight_ASimilarityContributionReligion2.01.0 (match)2.0Politics1.00.5 (partial)0.5Social energy1.00.750.75Smoking0.50.0 (mismatch)0.0Movie taste0.0(excluded)—
Calculation:
Numerator = 2.0 + 0.5 + 0.75 + 0.0 = 3.25
Denominator = 2.0 + 1.0 + 1.0 + 0.5 = 4.5
score(A → B) = 3.25 / 4.5 = 0.722 (72.2%)
Interpretation: User B satisfies 72.2% of what User A is looking for.

Phase 5: Section Weighting
The questionnaire is divided into two sections with different strategic importance:

Section 1 (65%): Lifestyle, dealbreakers, surface-level traits (religion, politics, substance use, monogamy, etc.)
Section 2 (35%): Personality, relationship dynamics (love languages, communication style, social energy, etc.)

Formula
score_final(A → B) = 0.65 × score_section1(A → B) + 0.35 × score_section2(A → B)
Rationale
Why weight Section 1 more heavily?

Section 1 contains incompatibilities that cause early relationship failure
Section 2 contains preferences that affect enjoyment but are more negotiable
In university dating, lifestyle mismatches (e.g., religious differences, monogamy mismatch) are decisive; personality quirks are workable

Why not 50/50?

Equal weighting treats "do you want kids?" the same as "do you like morning dates?"
Human cupids can use Section 2 data to add personalized touches to already-viable matches

Why not 80/20 or more extreme?

Section 2 still matters — dating isn't just checkbox compatibility
Preserves ability to differentiate among lifestyle-compatible pairs


Phase 6: Pair Score Construction
We now have two directional scores:

score(A → B) = how happy A would be with B
score(B → A) = how happy B would be with A

We must combine these into a single pair score.
Formula
pair_score = α × min(score(A→B), score(B→A)) + (1-α) × mean(score(A→B), score(B→A))

where α = 0.65
Why This Hybrid Approach?
Alternative 1: Simple average
pair_score = (score(A→B) + score(B→A)) / 2

Problem: Hides asymmetry. If A loves B (90%) but B dislikes A (30%), average = 60% (looks okay).

Alternative 2: Geometric mean
pair_score = √(score(A→B) × score(B→A))

Problem: Over-punishes mild asymmetry. If A = 70% and B = 60%, geometric mean = 64.8% (harsh).

Our approach: Weighted min + mean

Prevents one-sided matches: The min component (65% weight) heavily penalizes if one person is unhappy
Rewards mutual enthusiasm: The mean component (35% weight) still values strong bilateral compatibility
Tunable: Can adjust α to make system more/less strict about asymmetry

Worked Example
Scenarioscore(A→B)score(B→A)Simple AvgGeometricOur Formula (α=0.65)Mutual mismatch30%30%30%30%30%One-sided crush90%30%60%52%43.5% ← prevents bad matchMild asymmetry75%65%70%69.9%68.5% ← reasonableMutual match85%80%82.5%82.5%81.75%
Notice how our formula:

Properly penalizes the one-sided crush (43.5% vs 60% average)
Doesn't over-punish mild asymmetry (68.5% vs 70% average)
Closely tracks mutual matches


Phase 7: Eligibility Threshold (Quality Gate)
Not all mathematically possible pairs should be matched. We implement a dual-gate system.
Rules
A pair (A, B) is eligible for matching only if ALL three conditions are met:

Relative threshold for A:

   score(A → B) ≥ β × best_possible_score(A)

Relative threshold for B:

   score(B → A) ≥ β × best_possible_score(B)

Absolute floor:

   pair_score ≥ T_min
Recommended values:

β = 0.6 (relative quality requirement)
T_min = 0.25 (absolute safety floor)

Rationale
Why relative threshold (Gate 1 & 2)?

Prevents users from being matched far below their realistic expectations
Adapts to pool composition (e.g., users with niche preferences get matches calibrated to what's available)
Protects dignity: "You deserve someone reasonably close to the best you could get"

Why absolute floor (Gate 3)?

Catches pathological edge cases (e.g., two highly incompatible users who are each other's "best" in a tiny pool)
Sets a universal minimum quality standard

Alternative considered: Pure absolute threshold (e.g., 40%)

Rejected because: Punishes users with niche preferences. If someone's "best possible match" in the entire pool is 35%, they'd be excluded entirely even though that match might be genuinely good for them.

Worked Example
User A's scores with all potential partners:

User B: 68%
User C: 72% ← best
User D: 45%
User E: 38%

User B's scores with all potential partners:

User A: 65%
User F: 70% ← best
User G: 50%

Checking pair (A, B):
Gate 1: score(A→B) = 68% ≥ 0.6 × 72% = 43.2% ✓ Pass
Gate 2: score(B→A) = 65% ≥ 0.6 × 70% = 42% ✓ Pass
Gate 3: pair_score = 66.4% ≥ 25% ✓ Pass
Result: (A,B) is ELIGIBLE
Checking pair (A, E):
Gate 1: score(A→E) = 38% ≥ 0.6 × 72% = 43.2% ✗ Fail
Result: (A,E) is INELIGIBLE (too far below A's best option)

Phase 8: Global Matching
We now have a filtered set of eligible pairs with associated pair scores. The final step is to assign matches.
Graph Construction

Nodes: All users
Edges: Only eligible pairs (from Phase 7)
Edge weights: pair_score values

Algorithm: Blossom Algorithm (Maximum Weight Matching)
What it does: Finds the set of pairings that maximizes the sum of all pair_scores across the entire pool, subject to the constraint that each person is matched to at most one other person.
Why not greedy matching?

Greedy (match highest-scoring pair first, then next-highest, etc.) can trap users in suboptimal configurations
Example: If we greedily match (A,B) at 75%, we might miss that A+C = 80% and B+D = 78% would yield higher total satisfaction

Why Blossom works for your case:

Pool size (~500 users) is computationally manageable
Algorithm is well-studied and has efficient implementations
Produces provably optimal results
Explicitly supports unmatched users (nodes with no edges)

Allowing Unmatched Users
This is a feature, not a bug.
If a user has no edges in the filtered graph (all their potential pairs were eliminated in Phase 7), they remain unmatched. The system explicitly communicates: "We didn't find a high-quality match for you this round."
Why this is better than forcing matches:

Protects brand trust (no "why did you match me with this person?" complaints)
Respects user expectations (students would rather wait than go on a bad date)
Creates urgency for subsequent rounds (users may adjust preferences or wait for new participants)


Complete Algorithm Summary
INPUT: 
  - User responses to questionnaire
  - User importance ratings for each question
  
PHASE 1: Hard Filtering
  FOR each pair (A, B):
    IF either user's dealbreaker is violated:
      DELETE pair
      
PHASE 2: Similarity Calculation  
  FOR each remaining pair (A, B):
    FOR each question Q both answered:
      CALCULATE similarity_Q based on question type
      HANDLE "prefer not to answer" per tiered rules
      
PHASE 3: Importance Weighting
  (No computation — weights are user-provided)
  
PHASE 4: Directional Scoring
  FOR each user A:
    FOR each potential partner B:
      score(A→B) = Σ[weight_A × similarity_Q] / Σ[weight_A]
      
PHASE 5: Section Weighting
  FOR each directional score:
    score_final(A→B) = 0.65 × score_S1(A→B) + 0.35 × score_S2(A→B)
    
PHASE 6: Pair Score Construction
  FOR each pair (A,B):
    pair_score = 0.65 × min(score(A→B), score(B→A)) 
               + 0.35 × mean(score(A→B), score(B→A))
               
PHASE 7: Eligibility Threshold
  FOR each pair (A,B):
    IF score(A→B) < 0.6 × best_score(A) OR
       score(B→A) < 0.6 × best_score(B) OR
       pair_score < 0.25:
      DELETE pair
      
PHASE 8: Global Matching
  BUILD graph from remaining eligible pairs
  RUN Blossom algorithm
  OUTPUT matches (some users may be unmatched)

Tunable Parameters (Post-Launch Adjustment)
The following parameters can be adjusted after launch to optimize match quality and coverage. These should be implemented as configurable variables in the codebase.
1. Section Weights
SECTION_1_WEIGHT = 0.65  // Lifestyle/dealbreakers section
SECTION_2_WEIGHT = 0.35  // Personality/relationship section
When to adjust:

If matches feel "too robotic" or "soulless" → decrease Section 1 weight
If matches are fun but fundamentally incompatible → increase Section 1 weight

Recommended range: Section 1 ∈ [0.55, 0.75]

2. Importance Weights
WEIGHT_NOT_IMPORTANT = 0.0
WEIGHT_SOMEWHAT = 0.5
WEIGHT_IMPORTANT = 1.0
WEIGHT_VERY_IMPORTANT = 2.0
When to adjust:

If "Very Important" questions aren't differentiating enough → increase to 2.5 or 3.0
If scores are too dominated by a few questions → decrease to 1.5

Recommended range: Very Important ∈ [2.0, 3.0]

3. "Prefer Not to Answer" Penalty
UNCERTAINTY_PENALTY = 0.3  // Similarity value when "Very Important" question is unanswered
When to adjust:

If users are gaming system by not answering → decrease penalty to 0.2 (make it less attractive to hide info)
If too many pairs filtered due to unanswered questions → increase to 0.4 (more forgiving)

Recommended range: [0.2, 0.5]

4. Pair Score Asymmetry Weight (α)
ALPHA = 0.65  // Weight given to min() vs mean() in pair score formula
When to adjust:

If too many one-sided matches → increase α to 0.70 or 0.75 (stricter on asymmetry)
If mutual matches are rare → decrease α to 0.60 (more forgiving of mild asymmetry)

Recommended range: [0.60, 0.75]

5. Relative Quality Threshold (β)
BETA = 0.6  // Users only matched if score ≥ 60% of their best possible
When to adjust:

If too many users are unmatched (e.g., >30% of pool):

Decrease β to 0.55 or 0.50 (more lenient — willing to match further below best option)


If matches feel "settling" or quality complaints:

Increase β to 0.65 or 0.70 (stricter — only match if close to best option)



Recommended range: [0.50, 0.70]
Effect on match rate:

β = 0.50 → ~75-85% of users matched
β = 0.60 → ~60-75% matched (recommended)
β = 0.70 → ~45-60% matched (very selective)


6. Absolute Quality Floor (T_min)
T_MIN = 0.25  // Minimum pair_score required regardless of relative quality
When to adjust:

If pathological low-quality matches slip through → increase to 0.30 or 0.35
If too many viable pairs filtered by this floor → decrease to 0.20

Recommended range: [0.20, 0.35]
Note: This is a safety net. In well-tuned systems, relative threshold (β) does most of the work.

7. Question Type Sensitivity (Advanced)
For Likert scale questions, you can adjust the distance penalty formula:
LIKERT_EXPONENT = 1.0  // Default: linear penalty

similarity = 1 - (|a - b| / (max - min))^LIKERT_EXPONENT
When to adjust:

If small differences (4 vs 5) are penalized too much → set to 0.8 (softer penalty)
If large differences (1 vs 5) aren't penalized enough → set to 1.2 (harsher penalty)

Recommended range: [0.8, 1.2]

Adjustment Strategy (If Results Are Poor)
Scenario 1: Too Many Unmatched Users (>30%)
Diagnosis: System is too strict.
Adjustments (in order of impact):

Decrease BETA from 0.6 → 0.55 (biggest impact)
Decrease T_MIN from 0.25 → 0.20
Decrease ALPHA from 0.65 → 0.60 (allows more asymmetric pairs)
Increase UNCERTAINTY_PENALTY from 0.3 → 0.4 (fewer pairs filtered for unanswered questions)


Scenario 2: Matches Are Low Quality / Many Complaints
Diagnosis: System is too lenient OR wrong questions are weighted.
Adjustments:

Increase BETA from 0.6 → 0.65 or 0.70 (stricter eligibility)
Increase SECTION_1_WEIGHT from 0.65 → 0.70 (prioritize lifestyle compatibility more)
Increase ALPHA from 0.65 → 0.70 (penalize asymmetry more)
Audit which questions users are marking "Very Important" — may need to adjust question set


Scenario 3: Matches Feel "Robotic" / Lack Chemistry
Diagnosis: System over-optimizes on surface traits.
Adjustments:

Decrease SECTION_1_WEIGHT from 0.65 → 0.60 or 0.55
Review Section 2 questions — may need more personality/chemistry proxies
Consider adding "wildcard" factor (e.g., 5% random noise to encourage unexpected pairings)


Implementation Checklist for Developer
Your codebase should include:

 All 7 tunable parameters as global constants or config file entries
 Logging of key metrics per run:

% of users matched
Distribution of pair_scores (mean, median, min)
Number of pairs filtered at each phase


 Ability to run algorithm in "simulation mode" with different parameter values
 Export of per-user diagnostics:

Their best_possible_score
Their actual match score (if matched)
Reasons for being unmatched (if applicable)


 Clear separation of the 8 phases in code (do not merge phases — keep modular)