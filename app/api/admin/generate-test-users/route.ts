import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 * Generate Test Users
 * POST /api/admin/generate-test-users
 *
 * Creates test users for development/testing
 * Body: { count: number, userType: "match" | "cupid" }
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const count = body.count || 125;
    const userType = body.userType || "match"; // "match" or "cupid"

    const hashedPassword = await hashPassword("TestPassword123!");

    // Get current test user count to ensure unique emails
    const existingTestUsers = await prisma.user.count({
      where: { isTestUser: true },
    });

    const usersToCreate = [];

    for (let i = 0; i < count; i++) {
      const userIndex = existingTestUsers + i;
      const firstName =
        userType === "cupid" ? `Cupid${userIndex}` : `Match${userIndex}`;
      const lastName = `Test`;
      const email = `test${userIndex}@student.ubc.ca`;
      const isCupid = userType === "cupid";

      usersToCreate.push({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        cupidDisplayName: `${firstName} ${lastName}`,
        age: 18 + (i % 10), // Ages 18-27
        emailVerified: new Date(), // Already verified
        acceptedTerms: new Date(),
        isCupid,
        isBeingMatched: !isCupid, // Cupids don't get matched by default
        isTestUser: true, // Mark as test user for easy cleanup
      });
    }

    // Create users in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    let created = 0;

    for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
      const batch = usersToCreate.slice(i, i + BATCH_SIZE);
      await prisma.user.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
    }

    // If creating cupids, also create CupidProfile records
    if (userType === "cupid") {
      const createdUsers = await prisma.user.findMany({
        where: {
          email: { in: usersToCreate.map((u) => u.email) },
        },
        select: { id: true },
      });

      const cupidProfiles = createdUsers.map((u) => ({
        userId: u.id,
        approved: true,
      }));

      await prisma.cupidProfile.createMany({
        data: cupidProfiles,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      message: `Generated ${created} test ${userType} users`,
      created,
      userType,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}
