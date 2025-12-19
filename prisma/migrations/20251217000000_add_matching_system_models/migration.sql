-- Add Matching System Models
-- Migration: add_matching_system_models
-- This migration adds all models needed for the UBCupids matching system

-- CreateTable: CompatibilityScore
CREATE TABLE "CompatibilityScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "section1Score" DOUBLE PRECISION NOT NULL,
    "section2Score" DOUBLE PRECISION NOT NULL,
    "section3Score" DOUBLE PRECISION NOT NULL,
    "section5Score" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "bidirectionalScore" DOUBLE PRECISION,
    "batchNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CupidAssignment
CREATE TABLE "CupidAssignment" (
    "id" TEXT NOT NULL,
    "cupidUserId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "algorithmScore" DOUBLE PRECISION NOT NULL,
    "decision" TEXT,
    "decisionReason" TEXT,
    "batchNumber" INTEGER NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupidAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TextEmbedding
CREATE TABLE "TextEmbedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    "textHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CupidProfileSummary
CREATE TABLE "CupidProfileSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyTraits" JSONB NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "responseHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CupidProfileSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MatchingBatch
CREATE TABLE "MatchingBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalPairs" INTEGER NOT NULL DEFAULT 0,
    "algorithmMatches" INTEGER NOT NULL DEFAULT 0,
    "cupidMatches" INTEGER NOT NULL DEFAULT 0,
    "scoringStartedAt" TIMESTAMP(3),
    "scoringCompletedAt" TIMESTAMP(3),
    "matchingStartedAt" TIMESTAMP(3),
    "matchingCompletedAt" TIMESTAMP(3),
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchingBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Match - modify structure
-- Change cupidType to matchType
ALTER TABLE "Match" RENAME COLUMN "cupidType" TO "matchType";

-- Make compatibilityScore nullable (for cupid matches)
ALTER TABLE "Match" ALTER COLUMN "compatibilityScore" DROP NOT NULL;

-- Make revealedAt nullable and remove default
ALTER TABLE "Match" ALTER COLUMN "revealedAt" DROP DEFAULT;
ALTER TABLE "Match" ALTER COLUMN "revealedAt" DROP NOT NULL;

-- Update unique constraint on Match
DROP INDEX IF EXISTS "Match_userId_matchedUserId_batchNumber_key";

-- CreateIndex: CompatibilityScore
CREATE UNIQUE INDEX "CompatibilityScore_userId_targetUserId_batchNumber_key" ON "CompatibilityScore"("userId", "targetUserId", "batchNumber");
CREATE INDEX "CompatibilityScore_userId_batchNumber_idx" ON "CompatibilityScore"("userId", "batchNumber");
CREATE INDEX "CompatibilityScore_targetUserId_batchNumber_idx" ON "CompatibilityScore"("targetUserId", "batchNumber");
CREATE INDEX "CompatibilityScore_totalScore_idx" ON "CompatibilityScore"("totalScore");

-- CreateIndex: CupidAssignment
CREATE UNIQUE INDEX "CupidAssignment_cupidUserId_user1Id_user2Id_batchNumber_key" ON "CupidAssignment"("cupidUserId", "user1Id", "user2Id", "batchNumber");
CREATE INDEX "CupidAssignment_cupidUserId_batchNumber_idx" ON "CupidAssignment"("cupidUserId", "batchNumber");
CREATE INDEX "CupidAssignment_user1Id_batchNumber_idx" ON "CupidAssignment"("user1Id", "batchNumber");
CREATE INDEX "CupidAssignment_user2Id_batchNumber_idx" ON "CupidAssignment"("user2Id", "batchNumber");
CREATE INDEX "CupidAssignment_decision_idx" ON "CupidAssignment"("decision");

-- CreateIndex: TextEmbedding
CREATE UNIQUE INDEX "TextEmbedding_userId_questionId_key" ON "TextEmbedding"("userId", "questionId");
CREATE INDEX "TextEmbedding_userId_idx" ON "TextEmbedding"("userId");
CREATE INDEX "TextEmbedding_questionId_idx" ON "TextEmbedding"("questionId");

-- CreateIndex: CupidProfileSummary
CREATE UNIQUE INDEX "CupidProfileSummary_userId_key" ON "CupidProfileSummary"("userId");
CREATE INDEX "CupidProfileSummary_userId_idx" ON "CupidProfileSummary"("userId");

-- CreateIndex: MatchingBatch
CREATE UNIQUE INDEX "MatchingBatch_batchNumber_key" ON "MatchingBatch"("batchNumber");

-- CreateIndex: Match (new unique constraint and improved indexes)
CREATE UNIQUE INDEX "Match_userId_matchedUserId_batchNumber_matchType_key" ON "Match"("userId", "matchedUserId", "batchNumber", "matchType");
CREATE INDEX "Match_userId_batchNumber_idx" ON "Match"("userId", "batchNumber");
CREATE INDEX "Match_matchedUserId_batchNumber_idx" ON "Match"("matchedUserId", "batchNumber");

-- AddForeignKey: CompatibilityScore
ALTER TABLE "CompatibilityScore" ADD CONSTRAINT "CompatibilityScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompatibilityScore" ADD CONSTRAINT "CompatibilityScore_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CupidAssignment
ALTER TABLE "CupidAssignment" ADD CONSTRAINT "CupidAssignment_cupidUserId_fkey" FOREIGN KEY ("cupidUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CupidAssignment" ADD CONSTRAINT "CupidAssignment_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CupidAssignment" ADD CONSTRAINT "CupidAssignment_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TextEmbedding
ALTER TABLE "TextEmbedding" ADD CONSTRAINT "TextEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CupidProfileSummary
ALTER TABLE "CupidProfileSummary" ADD CONSTRAINT "CupidProfileSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
