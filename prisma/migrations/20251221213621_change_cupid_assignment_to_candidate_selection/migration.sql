/*
  Warnings:

  - You are about to drop the column `algorithmScore` on the `CupidAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `decision` on the `CupidAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `decisionReason` on the `CupidAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `user1Id` on the `CupidAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `user2Id` on the `CupidAssignment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cupidUserId,candidateId,batchNumber]` on the table `CupidAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `candidateId` to the `CupidAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `potentialMatches` to the `CupidAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CupidAssignment" DROP CONSTRAINT "CupidAssignment_user1Id_fkey";

-- DropForeignKey
ALTER TABLE "CupidAssignment" DROP CONSTRAINT "CupidAssignment_user2Id_fkey";

-- DropIndex
DROP INDEX "CupidAssignment_cupidUserId_user1Id_user2Id_batchNumber_key";

-- DropIndex
DROP INDEX "CupidAssignment_decision_idx";

-- DropIndex
DROP INDEX "CupidAssignment_user1Id_batchNumber_idx";

-- DropIndex
DROP INDEX "CupidAssignment_user2Id_batchNumber_idx";

-- DropIndex
DROP INDEX "Match_matchedUserId_idx";

-- DropIndex
DROP INDEX "Match_userId_idx";

-- AlterTable
ALTER TABLE "CupidAssignment" DROP COLUMN "algorithmScore",
DROP COLUMN "decision",
DROP COLUMN "decisionReason",
DROP COLUMN "user1Id",
DROP COLUMN "user2Id",
ADD COLUMN     "candidateId" TEXT NOT NULL,
ADD COLUMN     "potentialMatches" JSONB NOT NULL,
ADD COLUMN     "selectedMatchId" TEXT,
ADD COLUMN     "selectionReason" TEXT;

-- CreateIndex
CREATE INDEX "CupidAssignment_candidateId_batchNumber_idx" ON "CupidAssignment"("candidateId", "batchNumber");

-- CreateIndex
CREATE INDEX "CupidAssignment_selectedMatchId_idx" ON "CupidAssignment"("selectedMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "CupidAssignment_cupidUserId_candidateId_batchNumber_key" ON "CupidAssignment"("cupidUserId", "candidateId", "batchNumber");

-- AddForeignKey
ALTER TABLE "CupidAssignment" ADD CONSTRAINT "CupidAssignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
