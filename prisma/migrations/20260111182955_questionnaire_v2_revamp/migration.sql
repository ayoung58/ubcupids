-- ============================================
-- QUESTIONNAIRE V2 REVAMP MIGRATION
-- ============================================
-- This migration:
-- 1. Wipes all existing questionnaire responses (V1 is deprecated)
-- 2. Creates the new QuestionnaireResponseV2 table
-- 3. Sets needsQuestionnaireUpdate flag for all existing users
-- ============================================

-- Step 1: Delete all old questionnaire responses
-- This is intentional - V1 questionnaires are no longer compatible
DELETE FROM "Questionnaire";
DELETE FROM "QuestionnaireResponse";

-- Step 2: Add needsQuestionnaireUpdate column to User table
ALTER TABLE "User" ADD COLUMN     "needsQuestionnaireUpdate" BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Set flag to true for all existing users
-- New users created after this migration will have it as false by default
UPDATE "User" SET "needsQuestionnaireUpdate" = true WHERE "id" IS NOT NULL;

-- Step 4: Create the new QuestionnaireResponseV2 table
CREATE TABLE "QuestionnaireResponseV2" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "freeResponse1" TEXT,
    "freeResponse2" TEXT,
    "freeResponse3" TEXT,
    "freeResponse4" TEXT,
    "freeResponse5" TEXT,
    "questionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireResponseV2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireResponseV2_userId_key" ON "QuestionnaireResponseV2"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponseV2_userId_idx" ON "QuestionnaireResponseV2"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponseV2_isSubmitted_idx" ON "QuestionnaireResponseV2"("isSubmitted");

-- AddForeignKey
ALTER TABLE "QuestionnaireResponseV2" ADD CONSTRAINT "QuestionnaireResponseV2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
