-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pointOfContact" TEXT,
ADD COLUMN     "showPointOfContactToMatches" BOOLEAN NOT NULL DEFAULT true;
