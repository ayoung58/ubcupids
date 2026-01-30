import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { AdminCupidAssignmentClient } from "./_components/AdminCupidAssignmentClient";

export const metadata: Metadata = {
  title: "Cupid Assignment | Admin Dashboard | UBCupids",
  description: "Assign candidates to cupids for match review",
};

interface Stats {
  totalCandidates: number;
  totalCupids: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
}

export default async function AdminCupidAssignmentPage() {
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

  // Get statistics for PRODUCTION users
  const productionCandidates = await prisma.user.count({
    where: {
      isTestUser: false,
      isBeingMatched: true,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  const productionCupids = await prisma.user.count({
    where: {
      isTestUser: false,
      OR: [{ isCupid: true }, { cupidProfile: { isNot: null } }],
      emailVerified: { not: null },
    },
  });

  const productionAssignments = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      candidate: {
        isTestUser: false,
      },
    },
  });

  const productionPending = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      selectedMatchId: null,
      candidate: {
        isTestUser: false,
      },
    },
  });

  const productionCompleted = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      selectedMatchId: { not: null },
      candidate: {
        isTestUser: false,
      },
    },
  });

  // Get statistics for TEST users
  const testCandidates = await prisma.user.count({
    where: {
      isTestUser: true,
      isBeingMatched: true,
      questionnaireResponseV2: {
        isSubmitted: true,
      },
    },
  });

  const testCupids = await prisma.user.count({
    where: {
      isTestUser: true,
      OR: [{ isCupid: true }, { cupidProfile: { isNot: null } }],
      emailVerified: { not: null },
    },
  });

  const testAssignments = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      candidate: {
        isTestUser: true,
      },
    },
  });

  const testPending = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      selectedMatchId: null,
      candidate: {
        isTestUser: true,
      },
    },
  });

  const testCompleted = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      selectedMatchId: { not: null },
      candidate: {
        isTestUser: true,
      },
    },
  });

  const productionStats: Stats = {
    totalCandidates: productionCandidates,
    totalCupids: productionCupids,
    totalAssignments: productionAssignments,
    pendingAssignments: productionPending,
    completedAssignments: productionCompleted,
  };

  const testStats: Stats = {
    totalCandidates: testCandidates,
    totalCupids: testCupids,
    totalAssignments: testAssignments,
    pendingAssignments: testPending,
    completedAssignments: testCompleted,
  };

  return (
    <AdminCupidAssignmentClient
      productionStats={productionStats}
      testStats={testStats}
    />
  );
}
