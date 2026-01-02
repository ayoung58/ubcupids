-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "cupidComment" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'accepted';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardTutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredCandidateEmail" TEXT,
ADD COLUMN     "profileTutorialCompleted" BOOLEAN NOT NULL DEFAULT false;
