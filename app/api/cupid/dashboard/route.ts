/**
 * Cupid Dashboard API
 *
 * GET /api/cupid/dashboard
 * Returns the cupid's assigned pairs and stats
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getCupidDashboard } from "@/lib/matching/cupid";
import { CURRENT_BATCH } from "@/lib/matching/config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is an approved cupid
    const cupidProfile = await prisma.cupidProfile.findUnique({
      where: { userId },
      select: { approved: true },
    });

    if (!cupidProfile?.approved) {
      return NextResponse.json(
        { error: "Not an approved cupid" },
        { status: 403 }
      );
    }

    // Get dashboard data
    const dashboard = await getCupidDashboard(userId, CURRENT_BATCH);

    if (!dashboard) {
      return NextResponse.json(
        { error: "Could not load dashboard" },
        { status: 500 }
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Error fetching cupid dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
