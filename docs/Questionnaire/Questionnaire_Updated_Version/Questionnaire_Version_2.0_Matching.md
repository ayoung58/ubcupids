# UBCupids Matching Algorithm — Design Specification (v2.0)

## Executive summary

This document defines the UBCupids matching algorithm used to produce high-quality, mutually satisfying matches while allowing users to remain unmatched rather than receive low-quality pairings.

## Core principles

- Quality over quantity — no forced matches
- Mutual satisfaction required — asymmetry is penalized
- Hard constraints respected — dealbreakers are absolute
- Interpretable and tunable — parameters are adjustable post-launch

## Algorithm overview

The algorithm proceeds through eight strictly ordered phases:

1. Hard Filtering — remove fundamentally incompatible pairs
2. Similarity Calculation — question-level compatibility (0–1)
3. Importance Weighting — user-defined preference strength
4. Directional Scoring — how well B satisfies A
5. Section Weighting — lifestyle > personality
6. Pair Score Construction — penalize asymmetry
7. Eligibility Thresholding — allow “no match” outcomes
8. Global Matching — maximize total compatibility

### Phase 1 — Hard filtering (dealbreakers)

#### Rule

A pair (A, B) is immediately disqualified if either user marks a question as a Dealbreaker and the other user either gives an incompatible answer or selects “Prefer not to answer”.

#### Rationale

Dealbreakers are non-negotiable. Early filtering prevents misleading high scores, reduces computation, and respects user boundaries.

#### Example

- A: “Non-smoker” (Dealbreaker)
- B: “Smokes occasionally”
- Result: pair removed immediately

### Phase 2 — Similarity calculation

For each answered question, compute a similarity score in $[0,1]$ depending on question type.

#### Types

- Single-select categorical

  similarity = 1 if answers match; otherwise 0.

- Multi-select (Jaccard similarity)

  $$\text{similarity} = \frac{|A\cap B|}{|A\cup B|}$$

- Likert / ordinal (e.g. 1–5)

  $$\text{similarity} = 1 - \frac{|a-b|}{\text{max}-\text{min}}$$

#### Prefer Not to Answer

Handled only when the other user assigns importance to the question:

- Dealbreaker: filtered in Phase 1
- Very Important: similarity = 0.3 (penalize uncertainty)
- Important or less: exclude from scoring (do not penalize)

This approach avoids rewarding withholding while not presuming incompatibility.

### Phase 3 — Importance weighting

Each user assigns an importance level per question. The default linear weights are:

- Not Important: $0.0$
- Somewhat Important: $0.5$
- Important: $1.0$
- Very Important: $2.0$
- Dealbreaker: handled in Phase 1 (hard filter)

Rationale: a linear scale prevents a single question from dominating while allowing accumulation of moderate preferences.

### Phase 4 — Directional scoring

How well user B satisfies user A:

$$\text{score}(A\to B)=\frac{\sum_{q\in Q_A} w_A(q)\cdot s_q(A,B)}{\sum_{q\in Q_A} w_A(q)}$$

Where $Q_A$ is the set of questions with weight $w_A(q)>0$, and $s_q(A,B)$ is the question similarity. The output is in $[0,1]$.

Interpretation: “User B satisfies 72% of what User A is looking for.”

### Phase 5 — Section weighting

The questionnaire is split into two sections with default weights:

- Section 1 (65%): lifestyle, values, surface-level compatibility
- Section 2 (35%): personality, interaction style, relationship dynamics

Combined directional score:

$$\text{score\_final}(A\to B)=0.65\cdot\text{score}_{S1}(A\to B)+0.35\cdot\text{score}_{S2}(A\to B)$$

Rationale: lifestyle incompatibilities more often cause early failure, while personality affects enjoyment.

### Phase 6 — Pair score construction (mutuality)

Given directional scores $\text{score}(A\to B)$ and $\text{score}(B\to A)$, compute a symmetric pair score that penalizes asymmetry:

$$\text{pair\_score}=\alpha\cdot\min\big(\text{score}(A\to B),\text{score}(B\to A)\big)+(1-\alpha)\cdot\frac{\text{score}(A\to B)+\text{score}(B\to A)}{2}$$

Default $\alpha=0.65$. This strongly penalizes one-sided matches while preserving strong mutual compatibility.

### Phase 7 — Eligibility threshold (quality gate)

A pair (A,B) is eligible only if all three conditions hold:

1. Relative threshold for A: $\text{score}(A\to B) \ge \beta\cdot \text{best\_score}(A)$
2. Relative threshold for B: $\text{score}(B\to A) \ge \beta\cdot \text{best\_score}(B)$
3. Absolute floor: $\text{pair\_score} \ge T_{\min}$

Recommended defaults:

- $\beta = 0.6$
- $T_{\min} = 0.25$

Rationale: relative thresholds prevent settling; the absolute floor catches pathological edge cases and allows users to remain unmatched.

### Phase 8 — Global matching

Construct a graph where nodes are users and edges are eligible pairs weighted by `pair_score`. Run a Maximum Weight Matching algorithm (Blossom) to produce a globally optimal set of disjoint matches. This supports unmatched users naturally and outperforms greedy methods for global optimality.

## Tunable parameters

All values must be configurable. Defaults and recommended ranges:

```yaml
SECTION_1_WEIGHT: 0.65 # range [0.55, 0.75]
SECTION_2_WEIGHT: 0.35

W_NOT: 0.0
W_SOMEWHAT: 0.5
W_IMPORTANT: 1.0
W_VERY: 2.0 # recommended range [2.0, 3.0]

UNCERTAINTY_SIMILARITY: 0.3 # range [0.2, 0.5]

ALPHA: 0.65 # asymmetry weight, range [0.60, 0.75]
BETA: 0.6 # relative threshold, range [0.50, 0.70]
T_MIN: 0.25 # absolute floor, range [0.20, 0.35]

LIKERT_EXPONENT: 1.0 # optional: similarity = 1 - (|a-b|/(max-min))^EXPONENT
```

## Implementation notes

- Modularize code to mirror the eight phases for clarity and testability.
- Logging: percent matched, pair_score distribution, eliminations per phase.
- Provide a simulation mode for parameter tuning and A/B testing.
- Per-user diagnostics: `best_possible_score`, final match score (if matched), and reason for being unmatched.

## Appendix: quick formula summary

- Jaccard (multi-select): $\dfrac{|A\cap B|}{|A\cup B|}$
- Likert similarity: $1-\dfrac{|a-b|}{\text{max}-\text{min}}$ (optionally exponentiated)
- Directional score: see Phase 4
- Pair score: see Phase 6

End of document.
