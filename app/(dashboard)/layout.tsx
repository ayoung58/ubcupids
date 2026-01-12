import Link from "next/link";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ProfileButton } from "./dashboard/_components/ProfileButton";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session?.user) {
    return null; // Or redirect, but since it's layout, maybe handle in pages
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isCupid: true,
      isBeingMatched: true,
      profilePicture: true,
      needsQuestionnaireUpdate: true,
    },
  });

  return (
    <DashboardLayoutClient
      firstName={session.user.name?.split(" ")[0] || ""}
      lastName={session.user.name?.split(" ")[1] || ""}
      profilePicture={profile?.profilePicture || ""}
      isCupid={profile?.isCupid}
      isBeingMatched={profile?.isBeingMatched}
      needsQuestionnaireUpdate={profile?.needsQuestionnaireUpdate ?? false}
    >
      {children}
    </DashboardLayoutClient>
  );
}
