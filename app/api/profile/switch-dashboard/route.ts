import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Switch Dashboard API Endpoint
 *
 * POST /api/profile/switch-dashboard
 *
 * Updates the user's lastActiveDashboard preference
 * for users who have both Cupid and Match accounts.
 *
 * Request body:
 * {
 *   dashboard: "cupid" | "match"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dashboard } = body;

    if (dashboard !== "cupid" && dashboard !== "match") {
      return NextResponse.json(
        { error: "Invalid dashboard type" },
        { status: 400 }
      );
    }

    // Update the user's last active dashboard preference
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastActiveDashboard: dashboard,
      },
    });

    return NextResponse.json(
      {
        success: true,
        dashboard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Switch Dashboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to switch dashboard" },
      { status: 500 }
    );
  }
}
