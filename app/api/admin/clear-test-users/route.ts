import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Clear Test Users
 * POST /api/admin/clear-test-users
 *
 * Deletes all users marked as isTestUser = true
 * This is safe because only generated test users have this flag
 */
export async function POST() {
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

    // Count test users before deletion
    const testUserCount = await prisma.user.count({
      where: { isTestUser: true },
    });

    if (testUserCount === 0) {
      return NextResponse.json({
        message: "No test users found to delete",
        deleted: 0,
      });
    }

    // Delete all test users (cascade will handle related records)
    const result = await prisma.user.deleteMany({
      where: { isTestUser: true },
    });

    return NextResponse.json({
      message: `Deleted ${result.count} test users`,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error clearing test users:", error);
    return NextResponse.json(
      { error: "Failed to clear test users" },
      { status: 500 }
    );
  }
}
