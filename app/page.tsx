import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, BookOpen, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { HomepageTimeline } from "@/components/homepage/HomepageTimeline";
import { SIGNUP_DEADLINE } from "@/lib/matching/config";

export const dynamic = "force-dynamic";

/**
 * Home Page
 *
 * Shows:
 * - Sign out success message (if ?signedout=true)
 * - Call to action (Login / Register)
 * - Brief description of UBCupids
 * - Timeline showing how the matching process works
 */

interface HomePageProps {
  searchParams: Promise<{
    signedout?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getCurrentUser();
  const { signedout } = await searchParams;

  // IMPORTANT: Show sign-out message even if session still exists
  // (JWT cookie might not be cleared immediately in browser)
  const showSignOutMessage = signedout === "true";

  // Check if signups are closed
  const now = new Date();
  const signupsClosed = now > SIGNUP_DEADLINE;

  // Determine correct dashboard URL(s) if user is logged in
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dashboardUrl = "/dashboard";
  let userExists = false;
  let isCupid = false;
  let isMatchUser = false;
  if (session?.user && !showSignOutMessage) {
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCupid: true, isBeingMatched: true },
    });
    if (profile) {
      userExists = true;
      isCupid = profile.isCupid;
      isMatchUser = profile.isBeingMatched;
      // Default URL if they only have one role
      // dashboardUrl = profile.isCupid ? "/cupid-dashboard" : "/dashboard"; // Unused
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Navigation Links */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 relative min-h-[72px]">
          {/* Navigation Links */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Link
              href="/statistics"
              className="px-4 py-2 text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-md transition-colors font-medium"
            >
              📊 Statistics
            </Link>
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
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex items-start justify-center px-4 py-12 sm:py-16 gap-6 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="max-w-2xl w-full space-y-8 text-center">
          {/* Sign Out Success Message - Show regardless of session state */}
          {showSignOutMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You&apos;ve been signed out successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Content */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900">💘 UBCupids</h1>
            <p className="text-xl text-slate-600">
              Find your Valentine&apos;s Day match at UBC
            </p>
            <p className="text-slate-500 max-w-lg mx-auto">
              Anonymous matsching service for UBC students. <br />
              Complete a compatibility questionnaire to match with someone for
              Valentine&apos;s Day 2026, help create romance as a Cupid, or
              both!
            </p>

            <p className="text-slate-500 max-w-lg mx-auto">
              Sign ups are now closed for 2026!
            </p>
          </div>

          {/* Call to Action */}
          <div className="flex gap-4 justify-center">
            {/* Always show Login/Register buttons on sign-out page */}
            {showSignOutMessage ? (
              <>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Login
                  </Button>
                </Link>
              </>
            ) : userExists ? (
              // User is logged in and exists in database
              <>
                {isCupid && isMatchUser ? (
                  // User has both roles - stack vertically on mobile, side by side on desktop
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link href="/dashboard">
                      <Button
                        size="lg"
                        className="px-6 bg-black hover:bg-gray-800 text-white w-full sm:w-auto"
                      >
                        Go to Match Dashboard
                      </Button>
                    </Link>
                    <Link href="/cupid-dashboard">
                      <Button
                        size="lg"
                        className="px-6 bg-white hover:bg-gray-50 text-black border-2 border-gray-400 w-full sm:w-auto"
                      >
                        Go to Cupid Dashboard
                      </Button>
                    </Link>
                  </div>
                ) : isCupid ? (
                  // User is only a cupid
                  <div className="flex flex-col items-center gap-2">
                    <Link href="/cupid-dashboard">
                      <Button size="lg" className="px-8">
                        Go to Cupid Dashboard
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // User is only a match user
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8">
                      Go to Match Dashboard
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              // User is logged out (normal state)
              <>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">📝 Questionnaire</p>
              <p className="text-sm text-slate-600 mt-2">
                To be matched, fill out a compatibility questionnaire by Jan.
                31st
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">💘 Cupid Matching</p>
              <p className="text-sm text-slate-600 mt-2">
                Human cupids match-make from Feb. 1-7th
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">💌 Match Reveal</p>
              <p className="text-sm text-slate-600 mt-2">
                Algorithm and Cupid matches revealed on February 8th, 2026
              </p>
            </div>
          </div>

          {/* UBC Email Note */}
          <p className="text-xs text-slate-500 pt-4">
            Only @student.ubc.ca and @alumni.ubc.ca emails accepted
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <HomepageTimeline />
    </div>
  );
}
