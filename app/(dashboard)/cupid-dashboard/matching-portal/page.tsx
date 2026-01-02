import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { CupidMatchingPortal } from "./CupidMatchingPortal";

export const metadata: Metadata = {
  title: "Matching Portal | UBCupids",
  description: "Review and approve matches between compatible users",
};

export default async function MatchingPortalPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has a CupidProfile (for match users with linked cupid accounts)
  let cupidProfile = await prisma.cupidProfile.findUnique({
    where: { userId: session.user.id },
  });

  // If no profile exists, user shouldn't access portal
  if (!cupidProfile) {
    redirect("/cupid-dashboard");
  }

  // Auto-approve the profile if not already approved
  if (!cupidProfile.approved) {
    cupidProfile = await prisma.cupidProfile.update({
      where: { userId: session.user.id },
      data: { approved: true },
    });
  }

  return <CupidMatchingPortal />;
}
