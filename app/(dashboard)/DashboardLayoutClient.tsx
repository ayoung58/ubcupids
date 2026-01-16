"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ProfileButton } from "./dashboard/_components/ProfileButton";
import { QuestionnaireUpdateBanner } from "@/components/dashboard/QuestionnaireUpdateBanner";

interface DashboardLayoutClientProps {
  firstName: string;
  lastName: string;
  profilePicture: string;
  isCupid?: boolean;
  isBeingMatched?: boolean;
  needsQuestionnaireUpdate?: boolean;
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  firstName,
  lastName,
  profilePicture,
  isCupid,
  isBeingMatched,
  needsQuestionnaireUpdate,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isQuestionnairePage = pathname === "/questionnaire";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Hidden on questionnaire page */}
      {!isQuestionnairePage && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 relative min-h-[72px]">
            {/* Navigation Links - Left (hidden on small screens) */}
            <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 items-center gap-2">
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

            {/* Logo - Absolutely Centered */}
            <div
              className="flex justify-center items-center"
              data-tutorial="logo"
            >
              <Link
                href="/"
                className="text-3xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
              >
                💘 UBCupids
              </Link>
            </div>

            {/* Profile Button - Right */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ProfileButton
                firstName={firstName}
                lastName={lastName}
                profilePicture={profilePicture}
                isCupid={isCupid}
                isBeingMatched={isBeingMatched}
              />
            </div>

            {/* Mobile Navigation - Below logo on small screens */}
            <div className="lg:hidden flex justify-center items-center gap-2 mt-4 flex-wrap">
              <Link
                href="/user-guide"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Guide</span>
              </Link>
              <Link
                href="/privacy"
                className="px-3 py-1.5 text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors font-medium"
              >
                Privacy
              </Link>
              <a
                href="mailto:support@ubcupids.org"
                className="px-3 py-1.5 text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors font-medium"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Update Banner - Shows when user needs to complete V2 */}
      {!isQuestionnairePage && needsQuestionnaireUpdate && (
        <QuestionnaireUpdateBanner show={needsQuestionnaireUpdate} />
      )}

      {/* Main Content */}
      <div className={isQuestionnairePage ? "" : "max-w-7xl mx-auto px-4 py-4"}>
        {children}
      </div>
    </div>
  );
}
