import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./_components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | UBCupids",
  description: "Admin control panel",
};

export default async function AdminDashboardPage() {
  const session = await getCurrentUser();

  // Middleware handles authentication, so session should always exist here
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Fetch user profile to check admin status
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
    },
  });

  // Redirect if user is not an admin
  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  // Get matching batch status (single batch system - always batch 1)
  const batch = await prisma.matchingBatch.findUnique({
    where: { batchNumber: 1 },
  });

  // Check matching state
  const matchCount = await prisma.match.count({
    where: { batchNumber: 1 },
  });
  const assignmentCount = await prisma.cupidAssignment.count({
    where: { batchNumber: 1 },
  });
  const revealedCount = await prisma.match.count({
    where: { batchNumber: 1, revealedAt: { not: null } },
  });

  // Only mark as revealed if batch revealedAt is set AND there are matches
  const hasRevealed = batch?.revealedAt !== null && matchCount > 0;

  const displayName =
    profile?.displayName || `${profile?.firstName} ${profile?.lastName}`;

  return (
    <AdminDashboardClient
      adminName={displayName}
      matchingStatus={batch?.status || "pending"}
      matchingState={{
        hasMatches: matchCount > 0,
        hasAssignments: assignmentCount > 0,
        hasRevealed: hasRevealed,
      }}
    />
  );
}
