import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        firstName: true,
        isCupid: true,
        isTestUser: true,
      },
    });

    if (!profile?.isCupid) {
      return NextResponse.json(
        { error: "Not a cupid", profile },
        { status: 403 },
      );
    }

    // Get assignments
    const totalAssignments = await prisma.cupidAssignment.count({
      where: {
        batchNumber: 1,
        cupidUser: {
          id: session.user.id,
        },
      },
    });

    const isProductionCupid = !profile.isTestUser;
    const currentDate = new Date();
    const launchDate = new Date("2026-02-01T00:00:00.000Z");

    const cupidsAssigned = isProductionCupid
      ? currentDate >= launchDate && totalAssignments > 0
      : totalAssignments > 0;

    return NextResponse.json({
      user: {
        email: profile.email,
        name: profile.firstName,
        isCupid: profile.isCupid,
        isTestUser: profile.isTestUser,
      },
      debug: {
        isProductionCupid,
        currentDate: currentDate.toISOString(),
        launchDate: launchDate.toISOString(),
        dateCheck: currentDate >= launchDate,
        totalAssignments,
        assignmentCheck: totalAssignments > 0,
        cupidsAssigned,
      },
      accessResult: cupidsAssigned
        ? "✅ CAN ACCESS CUPID PORTAL"
        : "❌ CANNOT ACCESS - " +
          (isProductionCupid
            ? currentDate < launchDate
              ? "Portal not open yet (date gate)"
              : "No assignments (assignment gate)"
            : "No assignments (assignment gate)"),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
