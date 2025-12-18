import Link from "next/link";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ProfileButton } from "./dashboard/_components/ProfileButton";

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
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          <div className="text-center">
            <Link href="/">
              <h1 className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
                💘 UBCupids
              </h1>
            </Link>
          </div>
          <div className="absolute top-4 right-4">
            <ProfileButton
              firstName={session.user.name?.split(" ")[0] || ""}
              lastName={session.user.name?.split(" ")[1] || ""}
              profilePicture={profile?.profilePicture || ""}
              isCupid={profile?.isCupid}
              isBeingMatched={profile?.isBeingMatched}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
