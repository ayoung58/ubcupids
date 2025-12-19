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

  // Verify user is an approved Cupid
  const cupidProfile = await prisma.cupidProfile.findUnique({
    where: { userId: session.user.id },
    select: { approved: true },
  });

  if (!cupidProfile?.approved) {
    redirect("/cupid-dashboard");
  }

  return <CupidMatchingPortal />;
}
