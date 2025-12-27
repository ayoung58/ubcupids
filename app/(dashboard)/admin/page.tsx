import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./_components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | UBCupids",
  description: "Admin control panel",
};

export default async function AdminDashboardPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
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

  // Get current batch status
  const batches = await prisma.matchingBatch.findMany({
    orderBy: { batchNumber: "asc" },
  });

  const batch1 = batches.find((b) => b.batchNumber === 1);
  const batch2 = batches.find((b) => b.batchNumber === 2);

  // Determine current active batch (default to 1 if no batches exist)
  let currentBatch = 1;
  if (batch2 && batch2.status !== "pending") {
    currentBatch = 2;
  } else if (batch1 && batch1.status !== "pending") {
    currentBatch = 1;
  }

  const displayName =
    profile?.displayName || `${profile?.firstName} ${profile?.lastName}`;

  return (
    <AdminDashboardClient
      adminName={displayName}
      currentBatch={currentBatch}
      batch1Status={batch1?.status || "pending"}
      batch2Status={batch2?.status || "pending"}
    />
  );
}
