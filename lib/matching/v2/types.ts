/**
 * Matching Algorithm V2 - Type Definitions
 *
 * Type definitions for the matching algorithm data structures.
 */

import { QuestionnaireResponseV2 } from "@prisma/client";

/**
 * User data prepared for matching
 * Includes parsed responses and metadata
 */
export interface MatchingUser {
  id: string;
  email: string;
  name: string;
  gender: string;
  interestedInGenders: string[];
  responses: Record<string, any>;
  responseRecord: QuestionnaireResponseV2;
}

/**
 * Result of applying hard filters between two users
 */
export interface HardFilterResult {
  passed: boolean;
  userA?: MatchingUser;
  userB?: MatchingUser;
  reason?: string;
  failedQuestions?: string[];
}

/**
 * Similarity score for a single question
 */
export interface QuestionSimilarity {
  questionId: string;
  rawSimilarity: number; // Base similarity [0, 1]
  importanceWeight: number; // User's importance rating [0, 1]
  directionalMultiplier: number; // α or β if applicable, 1.0 otherwise
  weightedSimilarity: number; // After importance weighting
  finalSimilarity: number; // After directional adjustment
}

/**
 * Similarity scores for an entire section
 */
export interface SectionScore {
  section: "LIFESTYLE" | "PERSONALITY";
  questionScores: QuestionSimilarity[];
  sectionAverage: number; // Average of all finalSimilarity values
  weightedScore: number; // After section weight applied
}

/**
 * Complete compatibility score between two users
 */
export interface PairScore {
  userAId: string;
  userBId: string;
  hardFiltersPassed: boolean;
  sectionScores: SectionScore[];
  totalScore: number; // Sum of weightedScores (0-100 scale)
  meetsThreshold: boolean; // totalScore >= T_MIN
  diagnostics?: PairScoreDiagnostics;
}

/**
 * Diagnostic information for debugging pair scores
 */
export interface PairScoreDiagnostics {
  questionCount: number;
  dealbreakers: string[];
  lowScoreQuestions: Array<{
    questionId: string;
    score: number;
    reason: string;
  }>;
  asymmetricPreferences: Array<{
    questionId: string;
    userA: any;
    userB: any;
  }>;
}

/**
 * Matching run result
 */
export interface MatchingRunResult {
  runId: string;
  timestamp: Date;
  userCount: number;
  pairScoresCalculated: number;
  eligiblePairs: number;
  matchesCreated: number;
  unmatchedUsers: string[];
  diagnostics: MatchingRunDiagnostics;
}

/**
 * Diagnostic information for entire matching run
 */
export interface MatchingRunDiagnostics {
  averagePairScore: number;
  medianPairScore: number;
  scoreDistribution: {
    range: string; // e.g., "0-20"
    count: number;
  }[];
  hardFilterFailures: {
    gender: number;
    dealbreakers: number;
    other: number;
  };
  belowThreshold: number;
  perfectionistUsers: string[]; // Users with very high standards
}

/**
 * Options for running the matching algorithm
 */
export interface MatchingOptions {
  userIds?: string[]; // Specific users to match (if not provided, uses all eligible)
  dryRun?: boolean; // If true, calculate scores but don't create Match records
  includeDiagnostics?: boolean; // Include detailed diagnostics in result
  configOverrides?: Partial<typeof import("./config").MATCHING_CONFIG>;
}
