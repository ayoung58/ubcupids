import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { AdminMatchingClient } from "./_components/AdminMatchingClient";

export const metadata: Metadata = {
  title: "Matching Algorithm | Admin Dashboard | UBCupids",
  description: "Run and manage the matching algorithm",
};

export default async function AdminMatchingPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isAdmin: true,
    },
  });

  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  // Get statistics
  const totalUsers = await prisma.user.count({
    where: {
      isTestUser: false,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  const totalMatches = await prisma.match.count({
    where: {
      matchType: "algorithm",
      batchNumber: 1,
    },
  });

  const unmatchedUsers = await prisma.user.count({
    where: {
      isTestUser: false,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
      AND: [
        {
          matchesGiven: {
            none: {
              matchType: "algorithm",
              batchNumber: 1,
            },
          },
        },
        {
          matchesReceived: {
            none: {
              matchType: "algorithm",
              batchNumber: 1,
            },
          },
        },
      ],
    },
  });

  // Get recent matching runs from MatchingRun table (if exists)
  // For now, we'll just pass null and create the table later
  const recentRuns = null;

  return (
    <AdminMatchingClient
      initialStats={{
        totalUsers,
        totalMatches: totalMatches / 2, // Bidirectional records
        unmatchedUsers,
      }}
      recentRuns={recentRuns}
    />
  );
}
