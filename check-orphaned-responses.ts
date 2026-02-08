import { prisma } from "./lib/prisma";

async function checkOrphanedRecords() {
  console.log("Checking for orphaned QuestionnaireResponseV2 records...");

  // Find orphaned records
  const orphanedRecords = await prisma.$queryRaw<
    Array<{ id: string; userId: string }>
  >`
    SELECT qr.id, qr."userId" 
    FROM "QuestionnaireResponseV2" qr
    LEFT JOIN "User" u ON qr."userId" = u.id
    WHERE u.id IS NULL
  `;

  if (orphanedRecords.length === 0) {
    console.log("✅ No orphaned records found!");
    return;
  }

  console.log(`⚠️  Found ${orphanedRecords.length} orphaned records:`);
  orphanedRecords.forEach((record) => {
    console.log(`   - Record ID: ${record.id}, User ID: ${record.userId}`);
  });

  console.log("\nDeleting orphaned records...");

  const result = await prisma.$executeRaw`
    DELETE FROM "QuestionnaireResponseV2"
    WHERE "userId" NOT IN (SELECT id FROM "User")
  `;

  console.log(`✅ Deleted ${result} orphaned QuestionnaireResponseV2 records`);

  await prisma.$disconnect();
}

checkOrphanedRecords().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
