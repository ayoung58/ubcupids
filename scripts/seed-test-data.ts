/**
 * Database Seeding Script - V2 Questionnaire
 *
 * Creates test data for the matching system with V2 questionnaire format:
 * - 250 users waiting to be matched (isBeingMatched: true)
 * - 250 cupids (isCupid: true with approved CupidProfile)
 * - 250 V2 questionnaire responses with varied, realistic data
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 *   npx tsx scripts/seed-test-data.ts --count=50  (smaller batch)
 *   npx tsx scripts/seed-test-data.ts --scenario=perfect  (test scenarios)
 *
 * Scenarios:
 *   - random (default): Diverse pool of users
 *   - perfect: 10 perfect match pairs
 *   - dealbreaker: 10 dealbreaker conflict pairs
 *   - asymmetric: 10 asymmetric pairs (one-sided importance)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  generateV2Responses,
  generatePerfectMatchPair,
  generateDealbreakerConflictPair,
  generateAsymmetricPair,
  generateDiversePool,
} from "../lib/questionnaire/v2/test-data-generator";

const prisma = new PrismaClient();

// ============================================
// Configuration
// ============================================

const DEFAULT_PASSWORD = "TestPassword123!";

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find((arg) => arg.startsWith("--count="));
const scenarioArg = args.find((arg) => arg.startsWith("--scenario="));

const NUM_USERS = countArg ? parseInt(countArg.split("=")[1], 10) : 250;
const NUM_CUPIDS = NUM_USERS; // Same number of cupids as users
const SCENARIO = scenarioArg ? scenarioArg.split("=")[1] : "random";

// ============================================
// Data Generators
// ============================================

const FIRST_NAMES_MALE = [
  "James",
  "John",
  "Michael",
  "David",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Christopher",
  "Daniel",
  "Matthew",
  "Anthony",
  "Mark",
  "Donald",
  "Steven",
  "Andrew",
  "Paul",
  "Joshua",
  "Kenneth",
  "Kevin",
  "Brian",
  "George",
  "Timothy",
  "Ronald",
  "Jason",
  "Edward",
  "Jeffrey",
  "Ryan",
  "Jacob",
  "Nicholas",
  "Gary",
  "Eric",
  "Jonathan",
  "Stephen",
  "Larry",
  "Justin",
  "Scott",
  "Brandon",
  "Benjamin",
  "Samuel",
];

const FIRST_NAMES_FEMALE = [
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
  "Lisa",
  "Nancy",
  "Betty",
  "Margaret",
  "Sandra",
  "Ashley",
  "Kimberly",
  "Emily",
  "Donna",
  "Michelle",
  "Dorothy",
  "Carol",
  "Amanda",
  "Melissa",
  "Deborah",
  "Stephanie",
  "Rebecca",
  "Sharon",
  "Laura",
  "Cynthia",
  "Kathleen",
  "Amy",
  "Angela",
  "Anna",
  "Emma",
  "Nicole",
  "Samantha",
  "Katherine",
  "Christine",
  "Rachel",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(index: number) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale
    ? randomElement(FIRST_NAMES_MALE)
    : randomElement(FIRST_NAMES_FEMALE);
  const lastName = randomElement(LAST_NAMES);
  return { firstName, lastName };
}

function generateEmail(
  firstName: string,
  lastName: string,
  index: number
): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@student.ubc.ca`;
}

function generateAge(): number {
  // Most students are 18-24
  const ages = [18, 19, 20, 21, 22, 23, 24, 25];
  const weights = [10, 20, 25, 20, 15, 5, 3, 2];
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return ages[i];
  }
  return 21;
}

// ============================================
// Database Functions
// ============================================

async function clearExistingTestData(): Promise<void> {
  console.log("🗑️  Clearing existing test data...");

  try {
    // Delete in order to respect foreign key constraints
    await prisma.questionnaireResponseV2.deleteMany({
      where: { user: { isTestUser: true } },
    });
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user: { isTestUser: true } },
          { matchedUser: { isTestUser: true } },
        ],
      },
    });
    await prisma.cupidProfile.deleteMany({
      where: { user: { isTestUser: true } },
    });
    await prisma.user.deleteMany({
      where: { isTestUser: true },
    });

    console.log("✓ Test data cleared\n");
  } catch (error) {
    console.error("Error clearing test data:", error);
    throw error;
  }
}

async function createTestUsers(hashedPassword: string): Promise<void> {
  console.log(`👥 Creating ${NUM_USERS} test match users...`);

  let createdCount = 0;

  // Generate scenario-specific users
  if (
    SCENARIO === "perfect" ||
    SCENARIO === "dealbreaker" ||
    SCENARIO === "asymmetric"
  ) {
    const pairCount = Math.min(10, Math.floor(NUM_USERS / 2));
    const pairs = [];

    for (let i = 0; i < pairCount; i++) {
      let pair;
      if (SCENARIO === "perfect") {
        pair = generatePerfectMatchPair();
      } else if (SCENARIO === "dealbreaker") {
        pair = generateDealbreakerConflictPair();
      } else {
        pair = generateAsymmetricPair();
      }
      pairs.push({ user1: pair[0], user2: pair[1] });
    }

    // Create users for pairs
    for (let i = 0; i < pairs.length; i++) {
      const { user1, user2 } = pairs[i];

      // Create first user
      const { firstName: firstName1, lastName: lastName1 } = generateName(
        i * 2
      );
      const email1 = generateEmail(firstName1, lastName1, i * 2);
      const age1 = generateAge();

      const createdUser1 = await prisma.user.create({
        data: {
          email: email1,
          password: hashedPassword,
          firstName: firstName1,
          lastName: lastName1,
          displayName: `${firstName1} ${lastName1}`,
          cupidDisplayName: `${firstName1} ${lastName1}`,
          age: age1,
          emailVerified: new Date(),
          acceptedTerms: new Date(),
          isCupid: false,
          isBeingMatched: true,
          isTestUser: true,
        },
      });

      await prisma.questionnaireResponseV2.create({
        data: {
          userId: createdUser1.id,
          responses: user1.responses as any,
          freeResponse1: user1.freeResponse1,
          freeResponse2: user1.freeResponse2,
          freeResponse3: user1.freeResponse3 || null,
          freeResponse4: user1.freeResponse4 || null,
          freeResponse5: user1.freeResponse5 || null,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      // Create second user
      const { firstName: firstName2, lastName: lastName2 } = generateName(
        i * 2 + 1
      );
      const email2 = generateEmail(firstName2, lastName2, i * 2 + 1);
      const age2 = generateAge();

      const createdUser2 = await prisma.user.create({
        data: {
          email: email2,
          password: hashedPassword,
          firstName: firstName2,
          lastName: lastName2,
          displayName: `${firstName2} ${lastName2}`,
          cupidDisplayName: `${firstName2} ${lastName2}`,
          age: age2,
          emailVerified: new Date(),
          acceptedTerms: new Date(),
          isCupid: false,
          isBeingMatched: true,
          isTestUser: true,
        },
      });

      await prisma.questionnaireResponseV2.create({
        data: {
          userId: createdUser2.id,
          responses: user2.responses as any,
          freeResponse1: user2.freeResponse1,
          freeResponse2: user2.freeResponse2,
          freeResponse3: user2.freeResponse3 || null,
          freeResponse4: user2.freeResponse4 || null,
          freeResponse5: user2.freeResponse5 || null,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      createdCount += 2;
      if (createdCount % 10 === 0) {
        process.stdout.write(`\r  Progress: ${createdCount}/${NUM_USERS}`);
      }
    }
  }

  // Fill remaining slots with diverse users
  const remaining = NUM_USERS - createdCount;
  if (remaining > 0) {
    const diversePool = generateDiversePool(remaining);

    for (let i = 0; i < diversePool.length; i++) {
      const generated = diversePool[i];
      const { firstName, lastName } = generateName(createdCount + i);
      const email = generateEmail(firstName, lastName, createdCount + i);
      const age = generateAge();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`,
          cupidDisplayName: `${firstName} ${lastName}`,
          age,
          emailVerified: new Date(),
          acceptedTerms: new Date(),
          isCupid: false,
          isBeingMatched: true,
          isTestUser: true,
        },
      });

      await prisma.questionnaireResponseV2.create({
        data: {
          userId: user.id,
          responses: generated.responses as any,
          freeResponse1: generated.freeResponse1,
          freeResponse2: generated.freeResponse2,
          freeResponse3: generated.freeResponse3 || null,
          freeResponse4: generated.freeResponse4 || null,
          freeResponse5: generated.freeResponse5 || null,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      createdCount++;
      if (createdCount % 10 === 0) {
        process.stdout.write(`\r  Progress: ${createdCount}/${NUM_USERS}`);
      }
    }
  }

  process.stdout.write(`\r  Progress: ${createdCount}/${NUM_USERS}\n`);
  console.log(`✓ Created ${createdCount} test users\n`);
}

async function createTestCupids(hashedPassword: string): Promise<void> {
  console.log(`💘 Creating ${NUM_CUPIDS} test cupids...`);

  let createdCount = 0;

  for (let i = 0; i < NUM_CUPIDS; i++) {
    const { firstName, lastName } = generateName(NUM_USERS + i);
    const email = generateEmail(firstName, lastName, NUM_USERS + i);
    const age = generateAge();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        cupidDisplayName: `${firstName} ${lastName}`,
        age,
        emailVerified: new Date(),
        acceptedTerms: new Date(),
        isCupid: true,
        isBeingMatched: false,
        isTestUser: true,
      },
    });

    await prisma.cupidProfile.create({
      data: {
        userId: user.id,
        approved: true,
      },
    });

    createdCount++;
    if (createdCount % 10 === 0) {
      process.stdout.write(`\r  Progress: ${createdCount}/${NUM_CUPIDS}`);
    }
  }

  process.stdout.write(`\r  Progress: ${createdCount}/${NUM_CUPIDS}\n`);
  console.log(`✓ Created ${createdCount} cupids\n`);
}

async function printStats(): Promise<void> {
  console.log("📊 Database Statistics:");

  const totalUsers = await prisma.user.count();
  const testUsers = await prisma.user.count({ where: { isTestUser: true } });
  const cupids = await prisma.user.count({
    where: { isCupid: true, isTestUser: true },
  });
  const matchUsers = await prisma.user.count({
    where: { isBeingMatched: true, isTestUser: true },
  });
  const questionnaires = await prisma.questionnaireResponseV2.count({
    where: { user: { isTestUser: true } },
  });
  const submitted = await prisma.questionnaireResponseV2.count({
    where: { isSubmitted: true, user: { isTestUser: true } },
  });

  console.log(`  Total Users (all): ${totalUsers}`);
  console.log(`  Test Users: ${testUsers}`);
  console.log(`  Test Match Users: ${matchUsers}`);
  console.log(`  Test Cupids: ${cupids}`);
  console.log(`  V2 Questionnaires: ${questionnaires}`);
  console.log(`  Submitted: ${submitted}`);
  console.log("");
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
  console.log("🚀 Starting V2 database seeding...\n");
  console.log(`📋 Configuration:`);
  console.log(`  Users: ${NUM_USERS}`);
  console.log(`  Cupids: ${NUM_CUPIDS}`);
  console.log(`  Scenario: ${SCENARIO}`);
  console.log("");

  try {
    // Hash the default password once
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Clear existing test data
    await clearExistingTestData();

    // Create test users
    await createTestUsers(hashedPassword);

    // Create test cupids
    await createTestCupids(hashedPassword);

    // Print stats
    await printStats();

    console.log("✅ Database seeding complete!\n");
    console.log("📋 Test Credentials:");
    console.log(`   Email format: firstname.lastnameN@student.ubc.ca`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log("");
    console.log("💡 Usage:");
    console.log("   - Go to /admin/matching");
    console.log("   - Select 'Test Users' mode");
    console.log("   - Click 'Run Matching (Dry Run)' to test");
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
