import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { AdminMatchingClient } from "./_components/AdminMatchingClient";

export const metadata: Metadata = {
  title: "Matching Algorithm | Admin Dashboard | UBCupids",
  description: "Run and manage the matching algorithm",
};

interface Stats {
  totalUsers: number;
  totalMatches: number;
  unmatchedUsers: number;
}

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

  // Get statistics for PRODUCTION users (isTestUser=false)
  const productionUsers = await prisma.user.count({
    where: {
      isTestUser: false,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  const productionMatches = await prisma.match.count({
    where: {
      matchType: "algorithm",
      batchNumber: 1,
      user: {
        isTestUser: false,
      },
    },
  });

  const productionUnmatchedUsers = await prisma.user.count({
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

  // Get statistics for TEST users (isTestUser=true)
  const testUsers = await prisma.user.count({
    where: {
      isTestUser: true,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  const testMatches = await prisma.match.count({
    where: {
      matchType: "algorithm",
      batchNumber: 1,
      user: {
        isTestUser: true,
      },
    },
  });

  const testUnmatchedUsers = await prisma.user.count({
    where: {
      isTestUser: true,
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

  const productionStats: Stats = {
    totalUsers: productionUsers,
    totalMatches: Math.floor(productionMatches / 2), // Bidirectional, so divide by 2
    unmatchedUsers: productionUnmatchedUsers,
  };

  const testStats: Stats = {
    totalUsers: testUsers,
    totalMatches: Math.floor(testMatches / 2), // Bidirectional, so divide by 2
    unmatchedUsers: testUnmatchedUsers,
  };

  // Get recent matching runs from MatchingRun table (if exists)
  // For now, we'll just pass null and create the table later
  const recentRuns = null;

  return (
    <AdminMatchingClient
      productionStats={productionStats}
      testStats={testStats}
      recentRuns={recentRuns}
    />
  );
}
