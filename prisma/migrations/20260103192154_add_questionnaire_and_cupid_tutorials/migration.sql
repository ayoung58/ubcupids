-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cupidPortalTutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questionnaireTutorialCompleted" BOOLEAN NOT NULL DEFAULT false;
