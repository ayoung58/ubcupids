/*
  Warnings:

  - Added the required column `age` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add age column with a default value of 20 for existing rows, then make it required
ALTER TABLE "User" ADD COLUMN "age" INTEGER;

-- Update existing rows to have a default age of 20
UPDATE "User" SET "age" = 20 WHERE "age" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "age" SET NOT NULL;
