/**
 * Comprehensive Orphaned Records Cleanup
 *
 * This script removes all orphaned records across multiple tables where
 * the associated user has been deleted but related records weren't cascade deleted.
 *
 * Tables cleaned:
 * - QuestionnaireResponseV2
 * - CupidAssignment (where cupid or candidate deleted)
 * - Match (where user or matched user deleted)
 * - CompatibilityScore (where user or target user deleted)
 * - CupidProfile
 * - TextEmbedding
 * - Upload
 *
 * Usage: npx tsx scripts/cleanup-all-orphaned-records.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getAllUserIds(): Promise<Set<string>> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  return new Set(users.map((u) => u.id));
}

async function cleanupOrphanedResponses(existingUserIds: Set<string>) {
  console.log("\n📋 QuestionnaireResponseV2...");

  const responses = await prisma.questionnaireResponseV2.findMany({
    select: { id: true, userId: true },
  });

  const orphaned = responses.filter((r) => !existingUserIds.has(r.userId));

  if (orphaned.length > 0) {
    const result = await prisma.questionnaireResponseV2.deleteMany({
      where: { id: { in: orphaned.map((r) => r.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned responses`);
  } else {
    console.log(`  ✓ No orphaned responses`);
  }
}

async function cleanupOrphanedCupidAssignments(existingUserIds: Set<string>) {
  console.log("\n🏹 CupidAssignment...");

  const assignments = await prisma.cupidAssignment.findMany({
    select: { id: true, cupidUserId: true, candidateId: true },
  });

  const orphaned = assignments.filter(
    (a) =>
      !existingUserIds.has(a.cupidUserId) ||
      !existingUserIds.has(a.candidateId),
  );

  if (orphaned.length > 0) {
    const result = await prisma.cupidAssignment.deleteMany({
      where: { id: { in: orphaned.map((a) => a.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned assignments`);
  } else {
    console.log(`  ✓ No orphaned assignments`);
  }
}

async function cleanupOrphanedMatches(existingUserIds: Set<string>) {
  console.log("\n💘 Match...");

  const matches = await prisma.match.findMany({
    select: { id: true, userId: true, matchedUserId: true },
  });

  const orphaned = matches.filter(
    (m) =>
      !existingUserIds.has(m.userId) || !existingUserIds.has(m.matchedUserId),
  );

  if (orphaned.length > 0) {
    const result = await prisma.match.deleteMany({
      where: { id: { in: orphaned.map((m) => m.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned matches`);
  } else {
    console.log(`  ✓ No orphaned matches`);
  }
}

async function cleanupOrphanedCompatibilityScores(
  existingUserIds: Set<string>,
) {
  console.log("\n📊 CompatibilityScore...");

  const scores = await prisma.compatibilityScore.findMany({
    select: { id: true, userId: true, targetUserId: true },
  });

  const orphaned = scores.filter(
    (s) =>
      !existingUserIds.has(s.userId) || !existingUserIds.has(s.targetUserId),
  );

  if (orphaned.length > 0) {
    const result = await prisma.compatibilityScore.deleteMany({
      where: { id: { in: orphaned.map((s) => s.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned compatibility scores`);
  } else {
    console.log(`  ✓ No orphaned compatibility scores`);
  }
}

async function cleanupOrphanedCupidProfiles(existingUserIds: Set<string>) {
  console.log("\n💘 CupidProfile...");

  const profiles = await prisma.cupidProfile.findMany({
    select: { id: true, userId: true },
  });

  const orphaned = profiles.filter((p) => !existingUserIds.has(p.userId));

  if (orphaned.length > 0) {
    const result = await prisma.cupidProfile.deleteMany({
      where: { id: { in: orphaned.map((p) => p.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned cupid profiles`);
  } else {
    console.log(`  ✓ No orphaned cupid profiles`);
  }
}

async function cleanupOrphanedTextEmbeddings(existingUserIds: Set<string>) {
  console.log("\n🔤 TextEmbedding...");

  const embeddings = await prisma.textEmbedding.findMany({
    select: { id: true, userId: true },
  });

  const orphaned = embeddings.filter((e) => !existingUserIds.has(e.userId));

  if (orphaned.length > 0) {
    const result = await prisma.textEmbedding.deleteMany({
      where: { id: { in: orphaned.map((e) => e.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned text embeddings`);
  } else {
    console.log(`  ✓ No orphaned text embeddings`);
  }
}

async function cleanupOrphanedUploads(existingUserIds: Set<string>) {
  console.log("\n📤 Upload...");

  const uploads = await prisma.upload.findMany({
    select: { id: true, userId: true },
  });

  const orphaned = uploads.filter((u) => !existingUserIds.has(u.userId));

  if (orphaned.length > 0) {
    const result = await prisma.upload.deleteMany({
      where: { id: { in: orphaned.map((u) => u.id) } },
    });
    console.log(`  ✅ Deleted ${result.count} orphaned uploads`);
  } else {
    console.log(`  ✓ No orphaned uploads`);
  }
}

async function cleanupAllOrphanedRecords() {
  console.log("🔍 Starting comprehensive orphaned records cleanup...");
  console.log("=".repeat(60));

  try {
    // Get all existing user IDs
    console.log("\n📊 Loading existing users...");
    const existingUserIds = await getAllUserIds();
    console.log(`  Found ${existingUserIds.size} existing users`);

    // Clean up each table
    await cleanupOrphanedResponses(existingUserIds);
    await cleanupOrphanedCupidAssignments(existingUserIds);
    await cleanupOrphanedMatches(existingUserIds);
    await cleanupOrphanedCompatibilityScores(existingUserIds);
    await cleanupOrphanedCupidProfiles(existingUserIds);
    await cleanupOrphanedTextEmbeddings(existingUserIds);
    await cleanupOrphanedUploads(existingUserIds);

    console.log("\n" + "=".repeat(60));
    console.log("✨ Cleanup complete! All orphaned records have been removed.");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAllOrphanedRecords()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
