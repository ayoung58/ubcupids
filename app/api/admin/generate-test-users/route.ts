import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

/**
 * Generate Test Users
 * POST /api/admin/generate-test-users
 *
 * Creates 250 verified test users for development/testing
 */
export async function POST(request: NextRequest) {
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

    const COUNT = 250;
    const hashedPassword = await hashPassword("TestPassword123!");

    const usersToCreate = [];

    for (let i = 0; i < COUNT; i++) {
      const firstName = `Test${i}`;
      const lastName = `User${i}`;
      const email = `test${i}@student.ubc.ca`;
      const isCupid = i % 5 === 0; // Every 5th user is a cupid

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

    return NextResponse.json({
      message: `Generated ${created} test users`,
      created,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}
