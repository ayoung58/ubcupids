/**
 * Match Request Response API
 *
 * POST /api/matches/respond
 * Accept or decline a match request (cupid_received matches only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { matchId, action } = body;

    if (!matchId || !action) {
      return NextResponse.json(
        { error: "matchId and action are required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user: {
          select: { id: true, firstName: true, email: true },
        },
        matchedUser: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify this is a cupid_received match for the current user
    if (match.matchType !== "cupid_received" || match.userId !== userId) {
      return NextResponse.json(
        { error: "Can only respond to match requests sent to you" },
        { status: 403 }
      );
    }

    // Verify match is still pending
    if (match.status !== "pending") {
      return NextResponse.json(
        { error: `Match request has already been ${match.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    // Update the match status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    });

    // If accepted, also update the corresponding cupid_sent match
    // (the match from the other person's perspective)
    if (action === "accept") {
      // Find the corresponding cupid_sent match
      const correspondingMatch = await prisma.match.findFirst({
        where: {
          userId: match.matchedUserId,
          matchedUserId: match.userId,
          matchType: "cupid_sent",
          batchNumber: match.batchNumber,
        },
      });

      if (correspondingMatch) {
        await prisma.match.update({
          where: { id: correspondingMatch.id },
          data: {
            status: "accepted",
            respondedAt: new Date(),
          },
        });
      }
    } else {
      // If declined, update corresponding cupid_sent match status to declined
      const correspondingMatch = await prisma.match.findFirst({
        where: {
          userId: match.matchedUserId,
          matchedUserId: match.userId,
          matchType: "cupid_sent",
          batchNumber: match.batchNumber,
        },
      });

      if (correspondingMatch) {
        await prisma.match.update({
          where: { id: correspondingMatch.id },
          data: {
            status: "declined",
            respondedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Match request ${action}ed successfully`,
      match: {
        id: updatedMatch.id,
        status: updatedMatch.status,
        respondedAt: updatedMatch.respondedAt,
      },
    });
  } catch (error) {
    console.error("Error responding to match request:", error);
    return NextResponse.json(
      { error: "Failed to respond to match request" },
      { status: 500 }
    );
  }
}
