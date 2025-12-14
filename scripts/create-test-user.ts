import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

/**
 * Creates a verified test user for manual testing
 *
 * Usage: npx tsx scripts/create-test-user.ts
 *
 * Test credentials:
 * - Email: test@student.ubc.ca
 * - Password: Test1234
 *
 * - Test authentication before building registration UI
 * - Quickly reset test account during development
 * - Simulates already-verified user (emailVerified = now())
 */
async function main() {
  console.log("🔧 Creating test user...");

  const testEmail = "test@student.ubc.ca";
  const testPassword = "Test1234";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log("⚠️  Test user already exists");
    console.log("   Deleting old user...");
    await prisma.user.delete({
      where: { email: testEmail },
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(testPassword);

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      major: "Professional Cupid Studies",
      age: 25, // Required age field
      emailVerified: new Date(), // Pre-verified for testing
      acceptedTerms: new Date(), // Pre-accepted for testing
    },
  });

  console.log("✅ Test user created successfully!");
  console.log("");
  console.log("   📧 Email: test@student.ubc.ca");
  console.log("   🔒 Password: Test1234");
  console.log("   🆔 User ID:", user.id);
  console.log("");
  console.log("You can now log in at: http://localhost:3000/api/auth/signin");
}

main()
  .catch((e) => {
    console.error("❌ Error creating test user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
