-- AlterTable: Add campus fields to User table
-- These fields are for match users only to specify their campus and preferences

-- Add campus column with default value 'Vancouver'
ALTER TABLE "User" ADD COLUMN "campus" TEXT NOT NULL DEFAULT 'Vancouver';

-- Add okMatchingDifferentCampus column with default value true
ALTER TABLE "User" ADD COLUMN "okMatchingDifferentCampus" BOOLEAN NOT NULL DEFAULT true;
