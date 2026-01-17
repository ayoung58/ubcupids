import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/manual-verify
 *
 * Manually verify a user's email address
 * Admin-only endpoint
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getCurrentUser();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get email from request
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found with that email address" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          error: "User is already verified",
          user: {
            email: user.email,
            displayName: user.displayName,
            isVerified: true,
            verifiedAt: user.emailVerified.toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Verify the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete any pending verification tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        isVerified: true,
        verifiedAt: updatedUser.emailVerified?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Manual verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
