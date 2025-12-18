UBCupids Matching Algorithm - Comprehensive Decision Document
Version: 1.0
 Date: December 18, 2024
 Status: Final Specification for Implementation

Table of Contents
System Overview
Match Types & User Experience
Algorithm Pairing Strategy
Hard Filters (Pre-Scoring)
Compatibility Scoring System
Question-Specific Scoring Rules
Importance Rating System
Section Weighting
Cupid Matching System
Batch System & Duplicate Prevention
AI Model Integration
Data Models & Storage
Edge Cases & Error Handling
Success Metrics & Validation

1. System Overview
Purpose
Match UBC students based on compatibility scores derived from questionnaire responses, using a hybrid algorithm + human cupid approach.
Core Principles
Data-driven: Algorithm calculates objective compatibility scores
Human-augmented: Cupids add intuition and nuance
Transparent process: Users understand how they were matched (algorithm vs cupid)
Privacy-preserving: No names shown to cupids, compatibility scores hidden from users
Scale
Year 1: 500 users
Batches: 2 matching rounds (February 1 & February 7, 2026)
Matches per person: 1-5 (1 algorithm + 0-4 cupid matches)

2. Match Types & User Experience
2.1 Algorithm Matches (Symmetric/Bidirectional)
How it works:
Algorithm calculates pairwise compatibility scores for all users
Greedily pairs users with highest mutual compatibility
If A is matched with B, then B is automatically matched with A
User sees:
✅ Algorithm chose Person B for you!
Properties:
Symmetric (both people see each other as algorithm match)
One-time per batch (cannot be algorithm-matched twice in same batch)
Exclusive across batches (if matched in Batch 1, cannot be algorithm-matched in Batch 2)

2.2 Cupid Matches (Asymmetric/Directional)
How it works:
Each person is assigned 1 dedicated cupid
Cupid reviews top 5-10 algorithm-suggested candidates
Cupid selects 1 candidate to match with their person (or chooses no one)
User sees:
Sent cupid match (your cupid picked someone for you):
✅ Your cupid chose Person C for you!
Received cupid match (someone else's cupid picked you):
✅ Person D's cupid chose you as a match for them!
Properties:
Asymmetric (Person A's cupid picks B, but B's cupid might not pick A)
No batch limitations (same pair can be cupid-matched in both batches)
Optional (cupids can choose no one for their person)

2.3 Overlap Scenarios
Scenario 1: Algorithm and cupid pick the same person
Person A's matches:
✅ Algorithm AND your cupid both chose Person B for you! 🎯
   (This is a strong match—both data and intuition agree!)
Display: Merged into single match notification with special badge/emphasis

Scenario 2: Multiple cupids pick the same person
Person B's matches:
✅ Algorithm chose Person A for you!
✅ Your cupid chose Person A for you! (overlaps with algorithm)
✅ Person C's cupid chose you as a match for them!
✅ Person D's cupid chose you as a match for them!
Total matches for Person B: 4 (1 algorithm + 3 cupid)

2.4 Match Result Example
Person A's Match Dashboard:
Your Matches (3 total):

1. 🎯 Person B (Algorithm + Your Cupid)
   Both our algorithm and your cupid thought you'd be great together!
   Major: Computer Science | Interests: Hiking, board games, coffee

2. 💌 Person C (Your Cupid's Pick)
   Your cupid saw something special here.
   Major: Biology | Interests: Yoga, reading, trying new restaurants

3. 💝 Person E (Their Cupid's Pick)
   Person E's cupid thought you'd be a great match for them!
   Major: Economics | Interests: Traveling, cooking, live music
Note: No compatibility scores shown to users (maintains mystery)

3. Algorithm Pairing Strategy
3.1 Strategy: Greedy Maximum Compatibility
Algorithm:
Calculate pairwise compatibility scores for all valid pairs (after hard filters)
For each pair (A, B), calculate bidirectional average:
  pair_score = (compatibility_A_to_B + compatibility_B_to_A) / 2
Sort all pairs by pair_score (highest first)
Greedily assign matches:
Take highest scoring pair → create match
Remove both users from available pool
Repeat until pool is exhausted or everyone matched
Why Greedy:
Maximizes top-tier matches (people get their best compatible partner)
Simple to implement and debug
Fast execution (<5 seconds for 500 users)
Works with gender imbalances (unmatched users are acceptable)
Trade-offs:
Some users may remain unmatched (if odd number or low compatibility across board)
Not globally optimal (sum of all scores might not be maximum possible)
Can create "missed connection" scenarios (but unlikely with good scoring)

3.2 Tie-Breaking
If multiple pairs have identical average compatibility scores:
Random selection from tied pairs
Use cryptographically secure random (not deterministic)
Log tie-breaking decisions for debugging
Example:
Pairs with 92.5% average:
- A-B: 92.5%
- C-D: 92.5%
- E-F: 92.5%

Randomly select one pair to match first, then proceed with others

3.3 Unmatched Users
Scenario: User X has no compatible matches after hard filters (e.g., their gender preferences don't match anyone)
Handling:
User X does NOT get an algorithm match
User X CAN still receive cupid matches (if other cupids pick them)
User X's cupid can still pick someone for User X
User sees: "No algorithm match found this round, but you may receive cupid matches!"
Expected frequency: <5% of users (mostly due to very specific gender/age preferences)

4. Hard Filters (Pre-Scoring)
Before calculating compatibility scores, exclude pairs that fail these criteria:
4.1 Gender & Sexual Orientation (Q1-Q3)
Rule: Both people must be open to each other's gender
Logic:
Person A:
- Gender: man (Q1)
- Open to: [women, non-binary] (Q3)

Person B:
- Gender: woman (Q1)
- Open to: [men, women] (Q3)

Check:
- Is B's gender (woman) in A's preferences? YES ✅
- Is A's gender (man) in B's preferences? YES ✅
→ PASS (calculate compatibility)

Person C:
- Gender: non-binary (Q1)
- Open to: [women, non-binary] (Q3)

Check:
- Is C's gender (non-binary) in A's preferences? YES ✅
- Is A's gender (man) in C's preferences? NO ❌
→ FAIL (skip pair entirely, do not calculate score)
Special case: "Anyone (gender doesn't matter to me)" option
Matches all genders automatically

4.2 Age Range (Q34)
Rule: Both people must fall within each other's acceptable age range
Logic:
Person A: acceptable age 19-23
Person B: age 22, acceptable age 20-25

Check:
- Is B's age (22) in A's range (19-23)? YES ✅
- Is A's age (20) in B's range (20-25)? YES ✅
→ PASS

Person C: age 26, acceptable age 24-30

Check:
- Is C's age (26) in A's range (19-23)? NO ❌
→ FAIL (skip pair)

4.3 Dealbreaker Importance Rating
Rule: If any question is marked "Dealbreaker" by either person, and answers don't match → skip pair
Example:
Q26 (Alcohol):
Person A: "I don't drink" + importance: "Dealbreaker"
Person B: "I enjoy drinking socially" + importance: "Neutral"

Check:
- Answers match? NO
- Either person marked dealbreaker? YES (A did)
→ FAIL (skip pair, compatibility = 0%)

If B had marked "Important" instead of A marking "Dealbreaker":
→ PASS (calculate score normally with heavy penalty)

4.4 Previously Matched in Same Batch
Rule: Cannot be algorithm-matched twice in the same batch
Logic:
Batch 1: A-B are algorithm-matched

Batch 1 (later in same run):
- A and B cannot be matched again (even if still top choice)
- Skip this pair

Batch 2:
- A and B are excluded from algorithm pairing (see Section 10)
- But can still appear in cupid's top 5-10 suggestions

5. Compatibility Scoring System
5.1 Overall Scoring Formula
For each pair of users (A, B), calculate compatibility in both directions:
compatibility_A_to_B = calculate score from A's perspective
compatibility_B_to_A = calculate score from B's perspective

final_score = (compatibility_A_to_B + compatibility_B_to_A) / 2
Directional scoring accounts for asymmetric preferences:
Person A wants high energy, Person B is high energy → A is satisfied
Person B doesn't care about energy → B is satisfied
Both satisfied → high score

5.2 Section-Level Scoring
Questionnaire is divided into 4 sections with different weights:
Section
Weight
Rationale
Section 1: Basic Info & Matching Criteria and Icebreakers / Personality
15%
Hard filters already applied, remaining questions are preferences
Section 2: What I'm Like
30%
Important for personality compatibility
Section 3: What I'm Looking For
45%
Most important—explicit preferences for partner traits
Section 4: Open-Ended Text
10%
Qualitative insights, harder to score objectively

Calculation:
section_1_score = average of all question scores in Section 1
section_2_score = average of all question scores in Section 2
section_3_score = average of all question scores in Section 3
section_4_score = average of all question scores in Section 4

total_compatibility = (
  0.15 × section_1_score +
  0.30 × section_2_score +
  0.45 × section_3_score +
  0.10 × section_4_score
)

5.3 Question-Level Scoring
For each question, calculate a base score (0-100%) based on answer similarity, then apply importance weighting.
General approach:
Compare answers using question-specific rules (see Section 6)
Get base score (0-100%)
Apply importance rating adjustments (see Section 7)
Return final question score

6. Question-Specific Scoring Rules
6.1 Single-Choice Questions (Most Common)
Default rule: Exact match or no match
If answers are identical → 100%
If answers differ → 0%
Example (Q4: Ideal Saturday morning):
Person A: "Sleeping until noon"
Person B: "Sleeping until noon"
→ Score: 100%

Person A: "Sleeping until noon"
Person B: "Up at 7am for a run"
→ Score: 0%

6.2 Ordinal Questions (Ordered Options)
Rule: Use distance-based scoring for questions with ordered options
Formula:
options = [option_1, option_2, option_3, ..., option_n]
index_A = position of Person A's answer in options list
index_B = position of Person B's answer in options list
distance = |index_A - index_B|
max_distance = len(options) - 1

base_score = (1 - distance / max_distance) × 100%
Example 1 (Q14: Energy level - 3 options):
Options: ["High", "Moderate", "Low-key"]
Person A: "High" (index 0)
Person B: "Moderate" (index 1)

distance = |0 - 1| = 1
max_distance = 3 - 1 = 2
base_score = (1 - 1/2) × 100% = 50%
Example 2 (5 options):
Options: ["High", "Moderate-high", "Moderate", "Moderate-low", "Low"]
Person A: "High" (index 0)
Person B: "Moderate-high" (index 1)

distance = 1
max_distance = 4
base_score = (1 - 1/4) × 100% = 75%

Person A: "High" (index 0)
Person B: "Moderate" (index 2)

distance = 2
base_score = (1 - 2/4) × 100% = 50%

Person A: "High" (index 0)
Person B: "Low" (index 4)

distance = 4
base_score = (1 - 4/4) × 100% = 0%
Ordinal questions in questionnaire:
Q14: Energy level (3 options)
Q15: Work-life balance (3 options)
Q18: Social battery (5 options)
Q20: Money habits (4 options)
Q26: Alcohol relationship (5 options)
And others...

6.3 Multi-Select Questions (Select All That Apply)
Rule: Calculate percentage overlap using Jaccard similarity
Formula:
set_A = set of Person A's selected options
set_B = set of Person B's selected options
intersection = set_A ∩ set_B
union = set_A ∪ set_B

base_score = (|intersection| / |union|) × 100%
Example (Q3: Open to being matched with - HARD FILTER, not scored):
This is handled by hard filter, not scoring
Example (Hypothetical multi-select):
Q: "Select hobbies you enjoy" (multi-select)
Person A: [Hiking, Reading, Cooking]
Person B: [Hiking, Cooking, Gaming]

intersection = {Hiking, Cooking} → 2 items
union = {Hiking, Reading, Cooking, Gaming} → 4 items
base_score = 2/4 × 100% = 50%

6.4 Ranking Questions (Q30, Q41: Love Languages)
Rule: Compare top 3 rankings for overlap (position doesn't matter, only presence)
Comparison logic:
Q41 (Person A: how I give affection) ↔ Q30 (Person B: how I receive affection)
Q41 (Person B: how I give affection) ↔ Q30 (Person A: how I receive affection)
Formula:
A_gives = Person A's top 3 from Q41
B_receives = Person B's top 3 from Q30
overlap_A_to_B = |A_gives ∩ B_receives|
score_A_to_B = (overlap_A_to_B / 3) × 100%

B_gives = Person B's top 3 from Q41
A_receives = Person A's top 3 from Q30
overlap_B_to_A = |B_gives ∩ A_receives|
score_B_to_A = (overlap_B_to_A / 3) × 100%

base_score = (score_A_to_B + score_B_to_A) / 2
Example:
Person A:
- Q30 (receive): [Physical Touch #1, Quality Time #2, Words #3]
- Q41 (give): [Acts of Service #1, Physical Touch #2, Quality Time #3]

Person B:

- Q30 (receive): [Quality Time #1, Physical Touch #2, Acts of Service #3]
- Q41 (give): [Physical Touch #1, Quality Time #2, Gifts #3]

Calculate A→B (how well A gives what B wants):
A_gives = [Acts of Service, Physical Touch, Quality Time]
B_receives = [Quality Time, Physical Touch, Acts of Service]
Overlap = {Acts of Service, Physical Touch, Quality Time} → 3/3 = 100%

Calculate B→A (how well B gives what A wants):
B_gives = [Physical Touch, Quality Time, Gifts]
A_receives = [Physical Touch, Quality Time, Words]
Overlap = {Physical Touch, Quality Time} → 2/3 = 66.7%

base_score = (100% + 66.7%) / 2 = 83.35%

6.5 Asymmetric Questions ("What I'm Like" vs "What I'm Looking For")
Many questions have paired descriptors and preferences:
Q14: "My energy level is..." (what I'm like)
Q33: "I'm looking for someone whose energy level is..." (what I want)
UBCupids Matching Algorithm — Comprehensive Decision Document
Version: 1.0
Date: December 18, 2024
Status: Final Specification for Implementation

Table of Contents

- System Overview
- Match Types & User Experience
- Algorithm Pairing Strategy
- Hard Filters (Pre-Scoring)
- Compatibility Scoring System
- Question-Specific Scoring Rules
- Importance Rating System
- Section Weighting
- Cupid Matching System
- Batch System & Duplicate Prevention
- AI Model Integration
- Data Models & Storage
- Edge Cases & Error Handling
- Success Metrics & Validation

1. System Overview

Purpose

Match UBC students based on compatibility scores derived from questionnaire responses, using a hybrid algorithm + human cupid approach.

Core Principles

- Data-driven: Algorithm calculates objective compatibility scores
- Human-augmented: Cupids add intuition and nuance
- Transparent process: Users understand how they were matched (algorithm vs cupid)
- Privacy-preserving: No names shown to cupids, compatibility scores hidden from users

Scale

- Year 1: 500 users
- Batches: 2 matching rounds (February 1 & February 7, 2026)
- Matches per person: 1-5 (1 algorithm + 0-4 cupid matches)

2. Match Types & User Experience

2.1 Algorithm Matches (Symmetric/Bidirectional)

How it works:

- Algorithm calculates pairwise compatibility scores for all users
- Greedily pairs users with highest mutual compatibility
- If A is matched with B, then B is automatically matched with A

User sees:

✅ Algorithm chose Person B for you!

Properties:

- Symmetric (both people see each other as algorithm match)
- One-time per batch (cannot be algorithm-matched twice in same batch)
- Exclusive across batches (if matched in Batch 1, cannot be algorithm-matched in Batch 2)

  2.2 Cupid Matches (Asymmetric/Directional)

How it works:

- Each person is assigned 1 dedicated cupid
- Cupid reviews top 5-10 algorithm-suggested candidates
- Cupid selects 1 candidate to match with their person (or chooses no one)

User sees:

Sent cupid match (your cupid picked someone for you):

✅ Your cupid chose Person C for you!

Received cupid match (someone else's cupid picked you):

✅ Person D's cupid chose you as a match for them!

Properties:

- Asymmetric (Person A's cupid picks B, but B's cupid might not pick A)
- No batch limitations (same pair can be cupid-matched in both batches)
- Optional (cupids can choose no one for their person)

  2.3 Overlap Scenarios

Scenario 1: Algorithm and cupid pick the same person

Person A's matches:

✅ Algorithm AND your cupid both chose Person B for you! 🎯
(This is a strong match—both data and intuition agree!)

Display: Merged into single match notification with special badge/emphasis

Scenario 2: Multiple cupids pick the same person

Person B's matches:

✅ Algorithm chose Person A for you!
✅ Your cupid chose Person A for you! (overlaps with algorithm)
✅ Person C's cupid chose you as a match for them!
✅ Person D's cupid chose you as a match for them!

Total matches for Person B: 4 (1 algorithm + 3 cupid)

2.4 Match Result Example

Person A's Match Dashboard:

Your Matches (3 total):

1. 🎯 Person B (Algorithm + Your Cupid)
   Both our algorithm and your cupid thought you'd be great together!
   Major: Computer Science | Interests: Hiking, board games, coffee

2. 💌 Person C (Your Cupid's Pick)
   Your cupid saw something special here.
   Major: Biology | Interests: Yoga, reading, trying new restaurants

3. 💝 Person E (Their Cupid's Pick)
   Person E's cupid thought you'd be a great match for them!
   Major: Economics | Interests: Traveling, cooking, live music
   Note: No compatibility scores shown to users (maintains mystery)

4. Algorithm Pairing Strategy

3.1 Strategy: Greedy Maximum Compatibility

Algorithm:

- Calculate pairwise compatibility scores for all valid pairs (after hard filters)
- For each pair (A, B), calculate bidirectional average:
  pair_score = (compatibility_A_to_B + compatibility_B_to_A) / 2
- Sort all pairs by pair_score (highest first)
- Greedily assign matches:
  Take highest scoring pair → create match
  Remove both users from available pool
  Repeat until pool is exhausted or everyone matched

Why Greedy:

- Maximizes top-tier matches (people get their best compatible partner)
- Simple to implement and debug
- Fast execution (<5 seconds for 500 users)
- Works with gender imbalances (unmatched users are acceptable)

Trade-offs:

- Some users may remain unmatched (if odd number or low compatibility across board)
- Not globally optimal (sum of all scores might not be maximum possible)
- Can create "missed connection" scenarios (but unlikely with good scoring)

  3.2 Tie-Breaking

If multiple pairs have identical average compatibility scores:

- Random selection from tied pairs
- Use cryptographically secure random (not deterministic)
- Log tie-breaking decisions for debugging

Example:

Pairs with 92.5% average:

- A-B: 92.5%
- C-D: 92.5%
- E-F: 92.5%

Randomly select one pair to match first, then proceed with others

3.3 Unmatched Users

Scenario: User X has no compatible matches after hard filters (e.g., their gender preferences don't match anyone)

Handling:

- User X does NOT get an algorithm match
- User X CAN still receive cupid matches (if other cupids pick them)
- User X's cupid can still pick someone for User X
- User sees: "No algorithm match found this round, but you may receive cupid matches!"

Expected frequency: <5% of users (mostly due to very specific gender/age preferences)

4. Hard Filters (Pre-Scoring)

Before calculating compatibility scores, exclude pairs that fail these criteria:

4.1 Gender & Sexual Orientation (Q1-Q3)

Rule: Both people must be open to each other's gender

Logic:

Person A:

- Gender: man (Q1)
- Open to: [women, non-binary] (Q3)

Person B:

- Gender: woman (Q1)
- Open to: [men, women] (Q3)

Check:

- Is B's gender (woman) in A's preferences? YES ✅
- Is A's gender (man) in B's preferences? YES ✅
  → PASS (calculate compatibility)

Person C:

- Gender: non-binary (Q1)
- Open to: [women, non-binary] (Q3)

Check:

- Is C's gender (non-binary) in A's preferences? YES ✅
- Is A's gender (man) in C's preferences? NO ❌
  → FAIL (skip pair entirely, do not calculate score)
  Special case: "Anyone (gender doesn't matter to me)" option
  Matches all genders automatically

  4.2 Age Range (Q34)

Rule: Both people must fall within each other's acceptable age range

Logic:
Person A: acceptable age 19-23
Person B: age 22, acceptable age 20-25

Check:

- Is B's age (22) in A's range (19-23)? YES ✅
- Is A's age (20) in B's range (20-25)? YES ✅
  → PASS

Person C: age 26, acceptable age 24-30

Check:

- Is C's age (26) in A's range (19-23)? NO ❌
  → FAIL (skip pair)

  4.3 Dealbreaker Importance Rating

Rule: If any question is marked "Dealbreaker" by either person, and answers don't match → skip pair

Example:
Q26 (Alcohol):
Person A: "I don't drink" + importance: "Dealbreaker"
Person B: "I enjoy drinking socially" + importance: "Neutral"

Check:

- Answers match? NO
- Either person marked dealbreaker? YES (A did)
  → FAIL (skip pair, compatibility = 0%)

If B had marked "Important" instead of A marking "Dealbreaker":
→ PASS (calculate score normally with heavy penalty)

4.4 Previously Matched in Same Batch

Rule: Cannot be algorithm-matched twice in the same batch

Logic:
Batch 1: A-B are algorithm-matched

Batch 1 (later in same run):

- A and B cannot be matched again (even if still top choice)
- Skip this pair

Batch 2:

- A and B are excluded from algorithm pairing (see Section 10)
- But can still appear in cupid's top 5-10 suggestions

5. Compatibility Scoring System

5.1 Overall Scoring Formula

For each pair of users (A, B), calculate compatibility in both directions:
compatibility_A_to_B = calculate score from A's perspective
compatibility_B_to_A = calculate score from B's perspective

final_score = (compatibility_A_to_B + compatibility_B_to_A) / 2

Directional scoring accounts for asymmetric preferences:
Person A wants high energy, Person B is high energy → A is satisfied
Person B doesn't care about energy → B is satisfied
Both satisfied → high score

5.2 Section-Level Scoring

Questionnaire is divided into 4 sections with different weights:
Section
Weight
Rationale
Section 1: Basic Info & Matching Criteria and Icebreakers / Personality
15%
Hard filters already applied, remaining questions are preferences
Section 2: What I'm Like
30%
Important for personality compatibility
Section 3: What I'm Looking For
45%
Most important—explicit preferences for partner traits
Section 4: Open-Ended Text
10%
Qualitative insights, harder to score objectively

Calculation:
section_1_score = average of all question scores in Section 1
section_2_score = average of all question scores in Section 2
section_3_score = average of all question scores in Section 3
section_4_score = average of all question scores in Section 4

total_compatibility = (
0.15 × section_1_score +
0.30 × section_2_score +
0.45 × section_3_score +
0.10 × section_4_score
)

5.3 Question-Level Scoring

For each question, calculate a base score (0-100%) based on answer similarity, then apply importance weighting.
General approach:

- Compare answers using question-specific rules (see Section 6)
- Get base score (0-100%)
- Apply importance rating adjustments (see Section 7)
- Return final question score

6. Question-Specific Scoring Rules

6.1 Single-Choice Questions (Most Common)

Default rule: Exact match or no match
If answers are identical → 100%
If answers differ → 0%
Example (Q4: Ideal Saturday morning):
Person A: "Sleeping until noon"
Person B: "Sleeping until noon"
→ Score: 100%

Person A: "Sleeping until noon"
Person B: "Up at 7am for a run"
→ Score: 0%

6.2 Ordinal Questions (Ordered Options)

Rule: Use distance-based scoring for questions with ordered options
Formula:
options = [option_1, option_2, option_3, ..., option_n]
index_A = position of Person A's answer in options list
index_B = position of Person B's answer in options list
distance = |index_A - index_B|
max_distance = len(options) - 1

base_score = (1 - distance / max_distance) × 100%
Example 1 (Q14: Energy level - 3 options):
Options: ["High", "Moderate", "Low-key"]
Person A: "High" (index 0)
Person B: "Moderate" (index 1)

distance = |0 - 1| = 1
max_distance = 3 - 1 = 2
base_score = (1 - 1/2) × 100% = 50%
Example 2 (5 options):
Options: ["High", "Moderate-high", "Moderate", "Moderate-low", "Low"]
Person A: "High" (index 0)
Person B: "Moderate-high" (index 1)

distance = 1
max_distance = 4
base_score = (1 - 1/4) × 100% = 75%

Person A: "High" (index 0)
Person B: "Moderate" (index 2)

distance = 2
base_score = (1 - 2/4) × 100% = 50%

Person A: "High" (index 0)
Person B: "Low" (index 4)

distance = 4
base_score = (1 - 4/4) × 100% = 0%
Ordinal questions in questionnaire:
Q14: Energy level (3 options)
Q15: Work-life balance (3 options)
Q18: Social battery (5 options)
Q20: Money habits (4 options)
Q26: Alcohol relationship (5 options)
And others...

6.3 Multi-Select Questions (Select All That Apply)

Rule: Calculate percentage overlap using Jaccard similarity
Formula:
set_A = set of Person A's selected options
set_B = set of Person B's selected options
intersection = set_A ∩ set_B
union = set_A ∪ set_B

base_score = (|intersection| / |union|) × 100%
Example (Q3: Open to being matched with - HARD FILTER, not scored):
This is handled by hard filter, not scoring
Example (Hypothetical multi-select):
Q: "Select hobbies you enjoy" (multi-select)
Person A: [Hiking, Reading, Cooking]
Person B: [Hiking, Cooking, Gaming]

intersection = {Hiking, Cooking} → 2 items
union = {Hiking, Reading, Cooking, Gaming} → 4 items
base_score = 2/4 × 100% = 50%

6.4 Ranking Questions (Q30, Q41: Love Languages)

Rule: Compare top 3 rankings for overlap (position doesn't matter, only presence)
Comparison logic:
Q41 (Person A: how I give affection) ↔ Q30 (Person B: how I receive affection)
Q41 (Person B: how I give affection) ↔ Q30 (Person A: how I receive affection)
Formula:
A_gives = Person A's top 3 from Q41
B_receives = Person B's top 3 from Q30
overlap_A_to_B = |A_gives ∩ B_receives|
-score_A_to_B = (overlap_A_to_B / 3) × 100%

B_gives = Person B's top 3 from Q41
A_receives = Person A's top 3 from Q30
overlap_B_to_A = |B_gives ∩ A_receives|
-score_B_to_A = (overlap_B_to_A / 3) × 100%

base_score = (score_A_to_B + score_B_to_A) / 2

6.5 Asymmetric Questions ("What I'm Like" vs "What I'm Looking For")
Many questions have paired descriptors and preferences:
Q14: "My energy level is..." (what I'm like)
Q33: "I'm looking for someone whose energy level is..." (what I want)
Rule: Score both directions independently, then average
Logic:
Check if Person A's Q33 preference is satisfied by Person B's Q14 trait
Check if Person B's Q33 preference is satisfied by Person A's Q14 trait
Average the two satisfaction scores

6.6 "Similar to Mine" Option Handling
When a question includes "Similar to mine (from QX)" as an option:
Logic:
Look up Person A's answer from the referenced question (QX)
Compare that answer with Person B's answer to current question
Score using ordinal distance or exact match rules
Example (Q33 references Q14):
Person A:

- Q14: "High energy"
- Q33: "Similar to mine" → interprets as wanting "High energy"

Person B:

- Q14: "Moderate energy"
- Q33: "Doesn't matter"

For Q33 scoring:

- A's preference: "High" (derived from Q14)
- B's actual: "Moderate" (from their Q14)
- Use ordinal scoring: 50% (as calculated earlier)

  6.7 Open-Ended Text Questions (Q60-Q63)
  Rule: Use AI model for semantic similarity scoring
  Questions:
  Q60: "Something I absolutely cannot compromise on"
  Q61: "What are you passionate about?"
  Q62: "One thing you want matches to know"
  Q63: "Question for your match"
  Scoring approach:
  Use sentence embedding model (e.g., all-MiniLM-L6-v2 or OpenAI embeddings)
  Calculate cosine similarity between Person A's text and Person B's text
  Convert similarity (0-1) to percentage score (0-100%)
  Average across all text questions in section
  Example:
  Q61 (Passion):
  Person A: "I'm really into urban planning—I love thinking about how cities can be designed better for people."
  Person B: "I'm passionate about sustainable architecture and creating spaces that benefit communities."

AI similarity score: 0.78 (high semantic overlap)
base_score = 78%

Person A: "I'm really into urban planning..."
Person C: "I love playing competitive video games and streaming on Twitch."

AI similarity score: 0.12 (low semantic overlap)
base_score = 12%
Implementation details in Section 11

6.8 Self-Describe Text Inputs
Some single-choice questions have "Prefer to self-describe" option with text input:
Q1: Gender identity
Q2: Sexual orientation
Q7: Planning style
Q10: Humor type
Q51: Quality time definition
Q57: Most important thing in relationship
Rule: Use AI model for similarity, same as open-ended questions
Example (Q10: Humor type):
Person A: Selected "Self-describe" → "I laugh at really niche memes and absurd internet humor"
Person B: Selected "Absurd or random humor"

AI compares:

- A's text: "niche memes and absurd internet humor"
- B's option label: "Absurd or random humor"
- Similarity: 0.85 → 85% match

Person C: Selected "Self-describe" → "Dark, sarcastic jokes that make people uncomfortable"
AI compares:

- A's text: "niche memes and absurd internet humor"
- C's text: "Dark, sarcastic jokes that make people uncomfortable"
- Similarity: 0.35 → 35% match

7. Importance Rating System
   7.1 Importance Levels
   Users can mark importance for certain questions (not all questions have this feature):
   Level | User Label | Effect on Scoring
   ---|---|---
   0 | Not important | If answers don't match, no score reduction
   1 | Somewhat important | If answers don't match, reduce penalty by half
   2 | Important | If answers don't match, apply standard penalty
   3 | Very important | If answers don't match, amplify penalty by 1.5x
   4 | Dealbreaker | If answers don't match, hard filter (skip pair)

7.2 Importance Weighting Formula
Step 1: Calculate base score using question-specific rules (Section 6)
Step 2: Apply importance adjustment based on mismatch penalty
Mismatch penalty = amount by which score is below 100%
mismatch_penalty = 100% - base_score
Step 3: Adjust mismatch penalty based on importance level
if importance == "Not important":
adjusted_penalty = 0 (no penalty at all)

elif importance == "Somewhat important":
adjusted_penalty = mismatch_penalty × 0.5 (penalty reduced by half)

elif importance == "Important":
adjusted_penalty = mismatch_penalty × 1.0 (standard penalty)

elif importance == "Very important":
adjusted_penalty = mismatch_penalty × 1.5 (penalty amplified by 1.5x)

elif importance == "Dealbreaker":
→ Hard filter (skip pair entirely before scoring)
Step 4: Calculate final question score
final_score = 100% - adjusted_penalty

7.3 Importance Examples
Example 1 (5-option ordinal question):
Options: [High, Medium-high, Medium, Medium-low, Low]

Person A:

- Answer: "High" (index 0)
- Importance: "Somewhat important"

Person B:

- Answer: "Medium" (index 2)
- Importance: "Very important"

Base score calculation (ordinal distance):

- Distance = |0 - 2| = 2
- max_distance = 4
- base_score = (1 - 2/4) × 100% = 50%
- mismatch_penalty = 100% - 50% = 50%

For Person A (somewhat important):

- adjusted_penalty = 50% × 0.5 = 25%
- final_score_A = 100% - 25% = 75%

For Person B (very important):

- adjusted_penalty = 50% × 1.5 = 75%
- final_score_B = 100% - 75% = 25%

Average score for this question:
final_score = (75% + 25%) / 2 = 50%
Interpretation:
Person A is somewhat flexible (75% satisfied despite mismatch)
Person B cares deeply (only 25% satisfied)
Average reflects that one person is unhappy

Example 2 (Exact match despite importance):
Person A:

- Answer: "High"
- Importance: "Very important"

Person B:

- Answer: "High"
- Importance: "Not important"

Base score: 100% (exact match)
mismatch_penalty = 0%

For Person A (very important):

- adjusted_penalty = 0% × 1.5 = 0%
- final_score_A = 100%

For Person B (not important):

- adjusted_penalty = 0% × anything = 0%
- final_score_B = 100%

Average score: 100%
Interpretation: When answers match, importance doesn't matter

Example 3 (Not important for Person A):
Person A:

- Answer: "High"
- Importance: "Not important"

Person B:

- Answer: "Low"
- Importance: "Important"

Base score (ordinal, 5 options):

- Distance = 4, max_distance = 4
- base_score = 0%
- mismatch_penalty = 100%

For Person A (not important):

- adjusted_penalty = 0% (completely ignores mismatch)
- final_score_A = 100%

For Person B (important):

- adjusted_penalty = 100% × 1.0 = 100%
- final_score_B = 0%

Average score: 50%
Interpretation: Person A doesn't care (100% satisfied), Person B is very unhappy (0% satisfied)

7.4 Bidirectional Importance
Rule: Apply importance adjustments independently for each person, then average
Why: Each person's importance reflects their own preferences, not mutual requirements
Example:
Person A marks "Very important" → their satisfaction is more sensitive to mismatches
Person B marks "Not important" → their satisfaction is not affected by mismatches
Average score reflects that one person cares deeply, the other doesn't
This prevents situations where Person A's "Very important" makes Person B's score plummet unfairly.

8. Section Weighting
   8.1 Section Weights (Final)
   Section | # Questions | Weight | Justification
   ---|---:|---:|---
   Section 1: Basic Info & Matching and icebreaker/Personality | 13 | 15% | Q1-Q3 are hard filters, so weight is for preferences only
   Section 2: What I'm Like | 19 | 30% | Personality compatibility is important
   Section 3: What I'm Looking For | 27 | 45% | Most important—explicit partner preferences
   Section 4: Open-Ended Text | 4 | 10% | Qualitative, harder to score objectively

8.2 Final Compatibility Calculation

Step 1: Calculate average score for each section

section_1_score = average(all question scores in Section 1)
section_2_score = average(all question scores in Section 2)
section_3_score = average(all question scores in Section 3)
section_4_score = average(all question scores in Section 4)

Step 2: Apply section weights

total_compatibility = (
0.15 × section_1_score +
0.30 × section_2_score +
0.45 × section_3_score +
0.10 × section_4_score
)

Result: 0-100% compatibility score

8.3 Example Calculation
Person A ↔ Person B:

Section 1 (3 questions + 10 questions for icebreakers/personality):

- Q1-Q3: Hard filters passed
- Average: N/A (no scored questions in this section after filters)
- Use 100% as placeholder for Q1-Q3 or skip those for scoring
- Icebreakers/Personality section:
- Q4: 100%, Q5: 100%, Q6: 100%, Q7: 100%, Q8: 100%, Q9: 100%
- Average: 100%

Section 2 (19 questions):

- Q4: 100%, Q5: 50%, Q6: 100%, Q7: 75%, Q8: 0%, Q9: 50%...
- Average: 68.4%

Section 3 (27 questions):

- Q33: 75%, Q34: 100%, Q35: 100%, Q36: 50%...
- Average: 82.1%

Section 4 (4 questions):

- Q60: 45%, Q61: 78%, Q62: 62%, Q63: 55%
- Average: 60.0%

Total compatibility:
= 0.15 × 100% + 0.30 × 68.4% + 0.45 × 82.1% + 0.10 × 60.0%
= 15.0 + 20.52 + 36.945 + 6.0
= 78.465%
≈ 78.5%
Interpretation: Person A and Person B are 78.5% compatible (from A's perspective). Calculate B→A score separately, then average for final pair score.

9. Cupid Matching System
   9.1 Cupid Assignment
   Rule: Each person gets 1 dedicated cupid
   Assignment method:
   Phase 1 (MVP): Random assignment (500 users, 50 cupids → 10 people per cupid)
   Phase 2 (Future): "Review a Friend" feature where users can nominate a specific cupid (by email)
   Edge case: More cupids than people
   Accept cupids on first-come-first-served basis
   Cap at number of users / 10 (e.g., 500 users → max 50 cupids)
   Reject excess cupids with apology email

9.2 Cupid Interface - What They See
For each person they're reviewing, cupids see:
Person's profile (anonymized):
✅ Age, major, year
✅ Full questionnaire responses (all answers to all questions)
✅ AI-generated summary (Section 9.3)
❌ First name, last name, display name
❌ Photos (MVP has no profile pictures)
❌ Compatibility scores (hidden by default)
Candidate pool (top 5 algorithm matches):
Presented in random order (so cupid doesn't know which is algorithm's #1)
For each candidate, cupid sees same info as above (anonymized)
Optional: Cupid can toggle "Show compatibility scores" (with warning)

9.3 AI-Generated Summaries
To help cupids quickly understand profiles, generate short summaries for each person:
Summary includes:

- Personality traits (from Section 2)
- Top interests/hobbies
- Relationship style (from Section 3)
- Key preferences (what they're looking for)
  Example summary:
  📊 Profile Summary:
  Personality: Introverted, high energy, values personal growth
  Social: Small friend groups, needs alone time to recharge
  Lifestyle: Active (gym 4x/week), organized, moderate drinker
  Looking for: Someone equally ambitious, emotionally open, enjoys physical activities
  Dealbreaker: "Honesty—I need complete transparency"
  Implementation: Use GPT-3.5-turbo or Claude to generate (cost: ~$0.001 per profile, $0.50 for 500 users)

  9.4 Cupid Workflow
  Step 1: Cupid is assigned Person X
  Step 2: Cupid sees Person X's profile + AI summary
  Step 3: Cupid sees top 5 candidates (in random order)
  Can read each candidate's full questionnaire
  Can compare candidates side-by-side
  Step 4: Cupid makes decision
  Option A: Pick 1 candidate from the 5
  Option B: Request 5 more candidates (ranks 6-10 from algorithm)
  Can only request once (max 10 candidates total)
  Option C: Pick no one (with confirmation: "Are you sure? Person X won't get a cupid match")
  Step 5: Cupid submits choice
  Selection is saved to database
  Person X will see cupid match when matches are revealed

  9.5 Compatibility Score Toggle
  Default: Scores are hidden from cupids
  Optional: Cupid can enable "Show compatibility scores" with warning
  Warning dialog:
  ⚠️ Are you sure you want to see compatibility scores?

Showing scores may bias your decision. Our algorithm is good, but not perfect—
sometimes the best matches aren't the highest numbers.

Trust your intuition. You might see something the algorithm missed.

[Cancel] [Yes, Show Scores]
If enabled: Cupid sees scores next to each candidate
Candidate 1: 89% compatible
Candidate 2: 87% compatible
Candidate 3: 86% compatible
...
Note: Scores remain hidden from Person X (the person being matched)

9.6 Cupid Limitations
Limits:
✅ Can view up to 10 candidates per person (5 initial + 5 more)
✅ Can pick 0 or 1 candidate (not multiple)
✅ Can re-match same pairs across batches (no cupid limitations between batches)
✅ Cannot see which candidate is algorithm's #1 pick (unless they enable scores + see they're all similar)
✅ Cannot see other cupids' choices until matches are revealed
Edge case: What if Cupid A picks Person B for Person A, but Person B's cupid doesn't reciprocate?
Answer: This is fine (asymmetric matching). Person A gets a cupid match, Person B might not get a reciprocal match.

10. Batch System & Duplicate Prevention
    10.1 Two-Batch System
    Batch 1: February 1, 2026
    All users are eligible for matching
    Algorithm creates pairings
    Cupids make selections
    Matches revealed to users
    Batch 2: February 7, 2026
    All users are eligible again (including those matched in Batch 1)
    Algorithm excludes Batch 1 algorithm pairs
    Cupids have no restrictions
    New matches revealed
    Purpose:
    Gives people who didn't match in Batch 1 another chance
    Allows algorithm to create alternative pairings for people who want more options

10.2 Algorithm Exclusions in Batch 2
Rule: If A and B were algorithm-matched in Batch 1, they cannot be algorithm-matched in Batch 2
How this works:
Scenario: A and B were algorithm-paired in Batch 1
Batch 2 algorithm run:
Calculate all pairwise compatibility scores (same as Batch 1)
Before pairing, filter out (A, B) from available pairs
If A-B is still the highest scoring pair:
Skip A-B pair
Move to next highest pair
A and B will get matched with other people
Example:
Batch 1:

- A-B: 95% → Matched by algorithm

Batch 2 compatibility scores:

- A-B: 95% (still top choice)
- A-C: 88%
- B-D: 87%

Batch 2 pairing:

- Skip A-B (already matched in Batch 1)
- Pair A-C (A's next best option)
- Pair B-D (B's next best option)

Result:

- A gets 2 algorithm matches across batches: B (Batch 1) + C (Batch 2)
- B gets 2 algorithm matches across batches: A (Batch 1) + D (Batch 2)

  10.3 Cupid Matching Across Batches (No Restrictions)
  Rule: Cupids can re-match the same pairs across batches
  Rationale: Cupids have intuition—if they think A and B are perfect, they can reinforce this in Batch 2
  Scenario: A and B were algorithm-matched in Batch 1
  Batch 2 cupid interface:
  A's cupid sees top 5: [B, C, D, E, F] (B is still in top 5 because compatibility is high)
  A's cupid can pick B again (if they think it's the best match)
  User experience:
  Person A's matches (across both batches):
  Batch 1:
  ✅ Algorithm chose Person B for you!

Batch 2:
✅ Algorithm chose Person C for you!
✅ Your cupid chose Person B for you!
(Note: You were also algorithm-matched with B in Batch 1—
your cupid strongly believes in this connection!)

Display: Show special badge for "reinforced" matches (algorithm + cupid + same person across batches)

10.4 Preventing Exact Duplicates
Rule: Do not create duplicate match records for the same pair in the same batch
Example:
Batch 1:

- A's cupid picks B
- B's cupid also picks A

Database records:
Match 1: A → B (cupid sent)
Match 2: B → A (cupid sent)
Match 3: A ← B (cupid received, auto-generated from Match 2)
Match 4: B ← A (cupid received, auto-generated from Match 1)

User experience:
Person A sees:
✅ Your cupid chose Person B for you!
✅ Person B's cupid chose you!

Person B sees:
✅ Your cupid chose Person A for you!
✅ Person A's cupid chose you!

11. AI Model Integration
    11.1 Use Cases for AI
    Sentence similarity (open-ended text questions):
    Q60: "Something I cannot compromise on"
    Q61: "Passion"
    Q62: "One thing you want matches to know"
    Q63: "Question for your match"
    Self-describe text inputs (within single-choice questions):
    Q1: Gender identity (self-describe)
    Q2: Sexual orientation (self-describe)
    Q10: Humor type (self-describe)
    Q51: Quality time (self-describe)
    Q57: Most important in relationship (self-describe)
    Profile summaries for cupids:
    Generate 3-4 sentence summary of each person's personality and preferences

11.2 Recommended Models
Option 1: Sentence-BERT (Free, Self-Hosted)
Model: sentence-transformers/all-MiniLM-L6-v2
Pros: Free, fast (50ms per comparison), good for semantic similarity
Cons: No nuance (can't understand sarcasm, tone, cultural context)
Use case: MVP (Batch 1 & 2)
Option 2: OpenAI Embeddings (Paid, Best Quality)
Model: text-embedding-3-small
Cost: $0.00002 per 1K tokens
For 500 users × 5 text fields × 100 tokens = 250K tokens = $0.005 (half a cent)
Pros: Best quality, understands nuance
Cons: Requires API key, external dependency
Use case: Post-MVP if quality issues arise
Option 3: GPT-3.5-turbo for Direct Comparison (Paid, Most Nuanced)
Prompt: "Compare these two self-descriptions on a 0-100 scale..."
Cost: $0.002 per 1K tokens × 250 comparisons = $0.50 per batch
Pros: Can understand complex text, explain reasoning
Cons: Slower (1-2 seconds per comparison), more expensive
Use case: Profile summaries for cupids, not compatibility scoring

11.3 Implementation Plan
Phase 1 (MVP - Batch 1):
Use Sentence-BERT for all text comparisons
Host model locally (download to Vercel serverless function or external compute)
Pre-compute embeddings during questionnaire submission
Calculate cosine similarity for each pair during matching
Phase 2 (Post-MVP - Batch 2):
Evaluate quality of Batch 1 matches
If text similarity scores seem off, switch to OpenAI embeddings
Add GPT-3.5-turbo for cupid profile summaries

11.4 Sentence Similarity Scoring
Process:
Convert text to vector embedding (384-dimensional vector for MiniLM model)
Calculate cosine similarity between two vectors
Similarity range: 0.0 (completely different) to 1.0 (identical)
Convert to 0-100% score
Example:
Person A (Q61): "I'm passionate about urban planning and sustainable cities"
Person B (Q61): "I love architecture and designing eco-friendly buildings"

Embeddings:
A_vector = [0.12, -0.34, 0.56, ..., 0.21] (384 dimensions)
B_vector = [0.15, -0.29, 0.61, ..., 0.19]

Cosine similarity = 0.82
Score = 82%

Person C (Q61): "I'm into competitive gaming and esports streaming"

Cosine similarity (A vs C) = 0.18
Score = 18%

11.5 Handling Edge Cases
Empty text fields:
If either person leaves a text field blank → score = 50% (neutral)
Rationale: Don't penalize, but don't reward
Very short text (<10 characters):
Treat as unreliable signal → reduce weight by 50%
Example: "Honesty" vs "Loyalty" (both 1 word) → hard to assess similarity
Mismatched languages:
If one person writes in French, other in English → model may struggle
Mitigation: Language filter in questionnaire (English only for MVP)
Future: Translate to English before comparison

12. Data Models & Storage
    12.1 Database Schema
    New tables for matching:
    prisma
    // Compatibility scores (optional, for debugging)
    model CompatibilityScore {
    id String @id @default(cuid())
    userAId String
    userBId String
    scoreAtoB Float // 0-100 (A's perspective)
    scoreBtoA Float // 0-100 (B's perspective)
    averageScore Float // (scoreAtoB + scoreBtoA) / 2
    breakdown Json // {section1: 85, section2: 78, ...}
    batchNumber Int
    createdAt DateTime @default(now())

@@unique([userAId, userBId, batchNumber])
@@index([averageScore])
@@index([batchNumber])
}

// Match assignments
model Match {
id String @id @default(cuid())
userId String // Person receiving the match
matchedUserId String // Person they're matched with

matchType String // 'algorithm' | 'cupid_sent' | 'cupid_received'
cupidId String? // If cupid match, ID of the cupid who made it

compatibilityScore Float? // Only for algorithm matches
batchNumber Int // 1 or 2
revealedAt DateTime?

createdAt DateTime @default(now())

@@unique([userId, matchedUserId, batchNumber, matchType])
@@index([userId, batchNumber])
@@index([matchedUserId, batchNumber])
}

// Cupid assignments
model CupidAssignment {
id String @id @default(cuid())
cupidId String // User who is the cupid
personId String // User they're reviewing
batchNumber Int

hasSubmitted Boolean @default(false)
submittedAt DateTime?

@@unique([cupidId, personId, batchNumber])
@@index([cupidId, batchNumber])
}

// Text embeddings (pre-computed)
model TextEmbedding {
id String @id @default(cuid())
userId String
questionId String // e.g., "q60", "q61"
text String @db.Text
embedding Json // [0.12, -0.34, ...] (384-dim vector)
createdAt DateTime @default(now())

@@unique([userId, questionId])
@@index([userId])
}

12.2 Match Record Examples
Scenario: Person A gets matched with B (algorithm), C (cupid sent), D (cupid received)
Database records:
// Algorithm match (symmetric, so both A and B get records)
{
"userId": "A",
"matchedUserId": "B",
"matchType": "algorithm",
"compatibilityScore": 92.5,
"batchNumber": 1
}
{
"userId": "B",
"matchedUserId": "A",
"matchType": "algorithm",
"compatibilityScore": 92.5,
"batchNumber": 1
}

// Cupid sent (A's cupid picked C)
{
"userId": "A",
"matchedUserId": "C",
"matchType": "cupid_sent",
"cupidId": "cupid_123",
"batchNumber": 1
}

// Cupid received (D's cupid picked A)
{
"userId": "A",
"matchedUserId": "D",
"matchType": "cupid_received",
"cupidId": "cupid_456",
"batchNumber": 1
}
Query for Person A's matches:
sql
SELECT \* FROM Match
WHERE userId = 'A' AND batchNumber = 1
ORDER BY matchType ASC

13. Edge Cases & Error Handling
    13.1 Unmatched Users
    Scenario: User X has no valid matches (hard filters eliminate everyone)
    Handling:
    X does NOT get an algorithm match
    X's cupid can still pick someone (cupid sees all users, not just top 5)
    X can still receive cupid matches from other cupids
    User sees: "No algorithm match this round. Check back for cupid matches!"
    Expected frequency: <5% of users

13.2 Odd Number of Users
Scenario: 501 users after hard filters (odd number)
Handling:
Algorithm pairs 500 users → 250 pairs
1 user remains unmatched by algorithm
That user can still get cupid matches
No action needed: This is acceptable, user just has no algorithm match that batch

13.3 Cupid Picks No One
Scenario: Cupid reviews 10 candidates, doesn't like any
Handling:
Cupid clicks "Pick no one" → confirmation dialog appears
Cupid confirms → no cupid_sent match is created for that person
Person only gets algorithm match (if any) + cupid_received matches (if any)
Confirmation message: "Are you sure? [Person's first name] won't receive a cupid match from you this round. They may still get an algorithm match or matches from other cupids."

13.4 All Candidates Already Matched
Scenario: By the time Cupid A reviews Person X, all top 5 candidates have been matched in Batch 1
Handling:
Batch 2 only: Show note next to candidate: "⚠️ This person was algorithm-matched in Batch 1"
Cupid can still pick them (cupid matches have no restrictions)
If cupid picks someone already matched → create cupid_sent match record (allowed)

13.5 Missing Questionnaire Data
Scenario: User submits questionnaire with some fields blank (shouldn't happen due to required validation, but edge case)
Handling:
Skip questions with missing data (don't score them)
Reduce denominator in section average (don't count missing questions)
Example: Section 2 has 19 questions, User X only answered 17 → average of 17 scores
Prevention: Frontend validation ensures all required fields are filled

13.6 AI Model Failure
Scenario: Sentence embedding model throws error (API timeout, model not loaded, etc.)
Handling:
Catch error gracefully
Assign neutral score (50%) to affected text questions
Log error for debugging
Continue matching algorithm (don't fail entire batch)
Fallback: If AI model consistently fails, use manual text matching (exact word overlap % as score)

14. Success Metrics & Validation
    14.1 Algorithm Quality Metrics
    Pre-launch validation (with test data):
    Create 20-50 fake profiles with known "correct" matches
    Run algorithm, verify it pairs expected matches
    Check average compatibility scores (should be >75% for top pairs)
    Post-launch metrics (Batch 1):
    Average compatibility score across all algorithm matches (target: >80%)
    % of users who got algorithm match (target: >90%)
    Distribution of match counts per person (target: 2-4 matches average)

14.2 Cupid Quality Metrics
Tracking:
% of cupids who pick someone (vs. pick no one) → target: >80%
% of cupids who request 5 more candidates → target: <30%
Average time spent per review → target: 5-10 minutes
Feedback:
Survey cupids after Batch 1: "Did you feel the top 5 candidates were good options?"
If <70% say yes → adjust algorithm scoring weights

14.3 User Satisfaction Metrics
Week 1 survey (after Batch 1 matches revealed):
"How happy are you with your matches?" (1-5 scale)
"Did you reach out to your matches?" (yes/no)
"Would you recommend UBCupids to a friend?" (NPS score)
Target outcomes:
70% satisfaction (4-5 stars)

60% reach out rate

NPS >30

14.4 Technical Performance
Matching algorithm execution time:
Target: <10 seconds for 500 users (full compatibility matrix + pairing)
Actual: Likely 3-5 seconds with optimized code
Database queries:
Compatibility score lookups: <500ms
Match creation: <200ms per batch
AI model latency:
Text embedding generation: <100ms per text field
Compatibility calculation: <50ms per pair
