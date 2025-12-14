-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isBeingMatched" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCupid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "showBioToMatches" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInterestsToMatches" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showProfilePicToMatches" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "interests" DROP NOT NULL,
ALTER COLUMN "interests" SET DATA TYPE TEXT;
