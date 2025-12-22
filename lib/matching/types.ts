/**
 * Matching System Type Definitions
 *
 * Comprehensive types for the matching algorithm, scoring,
 * and cupid review system.
 */

import type { User, Match } from "@prisma/client";

// ===========================================
// QUESTIONNAIRE TYPES
// ===========================================

/**
 * Question types from questionnaire-config.json
 */
export type QuestionType =
  | "radio"
  | "checkbox"
  | "slider"
  | "text"
  | "ranking"
  | "scale";

/**
 * A single question from the questionnaire config
 */
export interface QuestionConfig {
  id: string;
  section: number;
  type: QuestionType;
  question: string;
  description?: string;
  hasImportance: boolean;
  options?: Array<{
    value: string;
    label: string;
    emoji?: string;
  }>;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  maxSelections?: number;
}

/**
 * Decrypted questionnaire responses
 */
export interface DecryptedResponses {
  [questionId: string]: string | string[] | number;
}

/**
 * Decrypted importance ratings (1-5 scale)
 */
export interface DecryptedImportance {
  [questionId: string]: number;
}

/**
 * User data with decrypted questionnaire for scoring
 */
export interface UserForScoring {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  responses: DecryptedResponses;
  importance: DecryptedImportance;
}

// ===========================================
// SCORING TYPES
// ===========================================

/**
 * Score comparison result for a single question
 */
export interface QuestionScore {
  questionId: string;
  baseScore: number; // 0-100 before importance weighting
  importanceWeight: number; // Multiplier from importance rating
  weightedScore: number; // baseScore * importanceWeight
}

/**
 * Section score breakdown
 */
export interface SectionScore {
  section: number;
  questions: QuestionScore[];
  rawTotal: number; // Sum of weighted scores
  normalizedScore: number; // 0-100 scale
  weight: number; // Section weight (from config)
  weightedScore: number; // normalizedScore * weight
}

/**
 * Complete compatibility calculation between two users
 */
export interface CompatibilityCalculation {
  userId: string;
  targetUserId: string;

  // Section breakdowns
  section1: SectionScore;
  section2: SectionScore;
  section3: SectionScore;
  section5: SectionScore;

  // Total scores
  totalScore: number; // 0-100, weighted sum of sections
  bidirectionalScore?: number; // Average with reverse calculation

  // Filter results
  passesGenderFilter: boolean;
  passesAgeFilter: boolean;
  isEligible: boolean; // passesGenderFilter && passesAgeFilter
}

/**
 * Pair of users for matching consideration
 */
export interface ScoredPair {
  user1Id: string;
  user2Id: string;
  score1to2: number; // User1's compatibility toward User2
  score2to1: number; // User2's compatibility toward User1
  bidirectionalScore: number; // (score1to2 + score2to1) / 2
  passesFilters: boolean; // Both directions pass filters
  // Section scores from user1 -> user2
  section1Score: number;
  section2Score: number;
  section3Score: number;
  section5Score: number;
}

// ===========================================
// MATCHING TYPES
// ===========================================

/**
 * Match types
 */
export type MatchType = "algorithm" | "cupid_sent" | "cupid_received";

/**
 * Match with related user data
 */
export interface MatchWithUsers extends Match {
  user: Pick<
    User,
    "id" | "firstName" | "displayName" | "profilePicture" | "bio" | "interests"
  >;
  matchedUser: Pick<
    User,
    "id" | "firstName" | "displayName" | "profilePicture" | "bio" | "interests"
  >;
}

/**
 * Greedy algorithm output
 */
export interface AlgorithmMatch {
  userId: string;
  matchedUserId: string;
  compatibilityScore: number;
  matchType: "algorithm";
}

/**
 * Match generation result
 */
export interface MatchingResult {
  batchNumber: number;
  algorithmMatches: AlgorithmMatch[];
  totalUsers: number;
  totalPairsScored: number;
  averageScore: number;
  medianScore: number;
  matchedUsers: number;
  unmatchedUsers: number;
}

// ===========================================
// CUPID SYSTEM TYPES
// ===========================================

/**
 * Profile summary for cupid review
 */
export interface CupidProfileView {
  userId: string;
  firstName: string;
  age: number;

  // AI-generated summary
  summary: string;
  keyTraits: string[];
  lookingFor: string;

  // Selected questionnaire highlights
  highlights: {
    questionId: string;
    question: string;
    answer: string;
  }[];
}

/**
 * Potential match option for cupid to choose from
 */
export interface PotentialMatch {
  userId: string;
  score: number;
  profile: CupidProfileView;
}

/**
 * Candidate assignment for cupid review
 * Each cupid is assigned ONE candidate and must select the best match from top 5
 */
export interface CupidCandidateAssignment {
  assignmentId: string;
  cupidUserId: string;

  candidate: CupidProfileView;
  potentialMatches: PotentialMatch[];

  selectedMatchId: string | null;
  selectionReason: string | null;
}

/**
 * Cupid's dashboard view
 */
export interface CupidDashboard {
  cupidId: string;
  cupidName: string;

  // Stats
  totalAssigned: number; // Total candidates assigned
  reviewed: number; // Candidates for which cupid made a selection
  pending: number; // Candidates awaiting selection

  // Pending candidate assignments for review
  pendingAssignments: CupidCandidateAssignment[];
}

// Legacy type for backwards compatibility during transition
export type CupidPairAssignment = CupidCandidateAssignment;

// ===========================================
// BATCH STATUS TYPES
// ===========================================

/**
 * Batch status values
 */
export type BatchStatus =
  | "pending"
  | "scoring"
  | "matching"
  | "cupid_review"
  | "completed";

/**
 * Batch progress info
 */
export interface BatchProgress {
  batchNumber: number;
  status: BatchStatus;

  totalUsers: number;
  totalPairs: number;
  algorithmMatches: number;
  cupidMatches: number;

  scoringProgress?: {
    completed: number;
    total: number;
    percentage: number;
  };

  timestamps: {
    created: Date;
    scoringStarted?: Date;
    scoringCompleted?: Date;
    matchingStarted?: Date;
    matchingCompleted?: Date;
    revealed?: Date;
  };
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Match display for user-facing UI
 */
export interface MatchDisplay {
  matchId: string;
  matchType: MatchType;
  compatibilityScore: number | null;

  matchedUser: {
    firstName: string;
    displayName: string | null;
    age: number;
    profilePicture: string | null;
    bio: string | null;
    interests: string | null;
  };

  revealedAt: Date | null;
  createdAt: Date;
}

/**
 * User's matches page data
 */
export interface UserMatchesData {
  matches: MatchDisplay[];
  totalMatches: number;
  algorithmMatches: number;
  cupidSentMatches: number;
  cupidReceivedMatches: number;
  batchNumber: number;
  isRevealed: boolean;
}

// ===========================================
// TEXT SIMILARITY TYPES
// ===========================================

/**
 * Text embedding for a question
 */
export interface TextEmbeddingData {
  userId: string;
  questionId: string;
  embedding: number[];
  model: string;
}

/**
 * Text similarity result
 */
export interface TextSimilarity {
  questionId: string;
  cosineSimilarity: number; // -1 to 1, normalized to 0-100
  normalizedScore: number; // 0-100
}

// ===========================================
// FILTER TYPES
// ===========================================

/**
 * Gender preference filter result
 */
export interface GenderFilterResult {
  user1Id: string;
  user2Id: string;
  user1PassesFilter: boolean; // User1's preference satisfied by User2
  user2PassesFilter: boolean; // User2's preference satisfied by User1
  bothPass: boolean; // Mutual match
}

/**
 * Age preference filter result (future use)
 */
export interface AgeFilterResult {
  user1Id: string;
  user2Id: string;
  user1PassesFilter: boolean;
  user2PassesFilter: boolean;
  bothPass: boolean;
}
