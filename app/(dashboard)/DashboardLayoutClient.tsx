"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
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
              <Link href="/" data-tutorial="logo" className="inline-block">
                <h1 className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
                  💘 UBCupids
                </h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Link
                href="/user-guide"
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Guide</span>
              </Link>
              <Link
                href="/privacy"
                className="px-4 py-2 text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors font-medium"
              >
                Privacy
              </Link>
              <a
                href="mailto:support@ubcupids.org"
                className="px-4 py-2 text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors font-medium"
              >
                Contact
              </a>
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
      <div className={isQuestionnairePage ? "" : "max-w-7xl mx-auto px-4 py-4"}>
        {children}
      </div>
    </div>
  );
}
