"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProfileButton } from "./dashboard/_components/ProfileButton";

interface DashboardLayoutClientProps {
  firstName: string;
  lastName: string;
  profilePicture: string;
  isCupid?: boolean;
  isBeingMatched?: boolean;
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  firstName,
  lastName,
  profilePicture,
  isCupid,
  isBeingMatched,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isQuestionnairePage = pathname === "/questionnaire";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Hidden on questionnaire page */}
      {!isQuestionnairePage && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 relative">
            <div className="text-center">
              <Link href="/" data-tutorial="logo">
                <h1 className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
                  💘 UBCupids
                </h1>
              </Link>
            </div>
            <div className="absolute top-4 right-4">
              <ProfileButton
                firstName={firstName}
                lastName={lastName}
                profilePicture={profilePicture}
                isCupid={isCupid}
                isBeingMatched={isBeingMatched}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isQuestionnairePage ? "" : "max-w-7xl mx-auto px-4 py-6"}>
        {children}
      </div>
    </div>
  );
}
