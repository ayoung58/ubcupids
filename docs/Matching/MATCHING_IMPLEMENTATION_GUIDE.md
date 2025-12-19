# Matching System Implementation Guide

**Created:** December 18, 2025  
**Status:** In Progress

---

## Implementation Overview

This guide provides the step-by-step implementation plan for the UBCupids matching system. The implementation is divided into 7 phases, with checkpoints for testing and feedback.

---

## Phase 1: Database Schema Migration ⬅️ CURRENT

### Objectives

1. Add new models for matching system
2. Modify existing Match model
3. Create migration and apply to database

### New/Modified Models

#### 1. CompatibilityScore (NEW)

Stores top 10 compatibility scores per user for debugging.

#### 2. Match (MODIFIED)

- Change `cupidType` → `matchType` with values: 'algorithm', 'cupid_sent', 'cupid_received'
- Make `revealedAt` nullable (null until revealed)
- Make `compatibilityScore` nullable (only for algorithm matches)

#### 3. CupidAssignment (NEW)

Tracks which cupid is assigned to which person.

#### 4. TextEmbedding (NEW)

Pre-computed text embeddings for AI-based similarity scoring.

#### 5. CupidProfileSummary (NEW)

AI-generated summaries for cupid review.

#### 6. MatchingConfig (NEW)

Runtime configuration for batch triggers.

### Tasks

- [x] Design schema (documented in clarifications)
- [ ] Update schema.prisma
- [ ] Generate migration
- [ ] Apply migration
- [ ] Test database connection

---

## Phase 2: Core Matching Library

### Objectives

1. Create matching configuration module
2. Implement question scoring functions
3. Implement importance weighting
4. Implement section scoring

### File Structure

```
lib/
  matching/
    config.ts           # Matching configuration (triggers, dates)
    types.ts            # TypeScript types for matching
    scoring/
      index.ts          # Main scoring exports
      question-scorer.ts  # Per-question scoring logic
      ordinal.ts        # Ordinal distance scoring
      ranking.ts        # Ranking overlap scoring
      text-similarity.ts # AI-based text scoring
    filters/
      hard-filters.ts   # Gender, age, dealbreaker filters
    algorithm/
      compatibility.ts  # Calculate pairwise compatibility
      greedy-pairing.ts # Greedy matching algorithm
    utils/
      decrypt-responses.ts # Batch decrypt questionnaire responses
```

### Tasks

- [ ] Create config.ts with trigger variables
- [ ] Create types.ts with matching interfaces
- [ ] Implement hard-filters.ts
- [ ] Implement question-scorer.ts
- [ ] Implement ordinal.ts
- [ ] Implement ranking.ts
- [ ] Implement compatibility.ts
- [ ] Implement greedy-pairing.ts

---

## Phase 3: AI Integration

### Objectives

1. Set up text embedding pipeline
2. Implement profile summary generation
3. Create batch processing utilities

### Tasks

- [ ] Research/select free embedding model
- [ ] Create text-similarity.ts with embedding logic
- [ ] Create profile-summary.ts for AI summaries
- [ ] Add embedding generation to questionnaire submit flow
- [ ] Create batch embedding regeneration script

---

## Phase 4: Matching Algorithm API

### Objectives

1. Create API endpoints for matching operations
2. Implement batch matching trigger
3. Store compatibility scores

### API Endpoints

```
POST /api/admin/matching/run-batch    # Trigger matching (admin only)
GET  /api/admin/matching/status       # Check matching status
GET  /api/matches                     # Get user's matches
```

### Tasks

- [ ] Create admin authentication middleware
- [ ] Implement run-batch endpoint
- [ ] Implement status endpoint
- [ ] Implement matches endpoint
- [ ] Create matching job runner

---

## Phase 5: Cupid System

### Objectives

1. Implement cupid assignment algorithm
2. Create cupid dashboard UI
3. Implement cupid match selection flow

### Tasks

- [ ] Implement random cupid assignment
- [ ] Create split-screen comparison UI
- [ ] Implement candidate navigation
- [ ] Implement match selection
- [ ] Add compatibility score toggle (optional)

---

## Phase 6: Match Display

### Objectives

1. Implement match reveal logic
2. Create user match dashboard
3. Display matches with profile info

### Tasks

- [ ] Create matches page UI
- [ ] Implement reveal date checking
- [ ] Display match cards with info
- [ ] Handle match type badges

---

## Phase 7: Testing & Validation

### Objectives

1. Create test data generation script
2. Run end-to-end matching simulation
3. Validate scoring accuracy
4. Performance testing

### Tasks

- [ ] Create test user generation script
- [ ] Create matching simulation script
- [ ] Add logging for debugging
- [ ] Performance benchmarking

---

## Current Progress

### Completed

- [x] Phase 0: Questionnaire Config Updates
- [x] Documentation and planning

### In Progress

- [ ] Phase 1: Database Schema Migration

---

## Checkpoint Schedule

1. **After Phase 1:** Test database migration, verify schema
2. **After Phase 2:** Test scoring functions with sample data
3. **After Phase 4:** Run matching algorithm with test users
4. **After Phase 5:** Test cupid workflow end-to-end
5. **After Phase 6:** Full integration test

---

## Implementation Notes

### Encryption Handling

- Questionnaire responses are encrypted in DB using AES-256-GCM
- Must decrypt before processing for matching
- Use `decryptJSON()` from lib/encryption.ts

### Performance Considerations

- Pre-compute text embeddings at questionnaire submission
- Batch decrypt all responses at matching run start
- Use in-memory scoring (don't query DB per comparison)

### Error Handling

- Log all matching decisions for debugging
- Handle missing/incomplete questionnaires gracefully
- Provide clear error messages for admin
