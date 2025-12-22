import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

/**
 * Home Page
 *
 * Shows:
 * - Sign out success message (if ?signedout=true)
 * - Call to action (Login / Register)
 * - Brief description of UBCupids
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

  // Determine correct dashboard URL if user is logged in
  let dashboardUrl = "/dashboard";
  if (session?.user && !showSignOutMessage) {
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCupid: true },
    });
    dashboardUrl = profile?.isCupid ? "/cupid-dashboard" : "/dashboard";
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
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

        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">💘 UBCupids</h1>
          <p className="text-xl text-slate-600">
            Find your Valentine&apos;s Day match at UBC
          </p>
          <p className="text-slate-500 max-w-lg mx-auto">
            Anonymous matching service for UBC students. Complete a
            compatibility questionnaire and receive 1-3 matches for
            Valentine&apos;s Day 2026.
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex gap-4 justify-center">
          {/* Always show Login/Register buttons on sign-out page */}
          {showSignOutMessage ? (
            <>
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Login
                </Button>
              </Link>
            </>
          ) : session?.user ? (
            // User is logged in (normal state)
            <Link href={dashboardUrl}>
              <Button size="lg" className="px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            // User is logged out (normal state)
            <>
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-900">📝 Questionnaire</p>
            <p className="text-sm text-slate-600 mt-2">
              Fill out compatibility questions
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-900">🤖 Smart Matching</p>
            <p className="text-sm text-slate-600 mt-2">
              Algorithm + human cupids
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-900">💌 Match Reveal</p>
            <p className="text-sm text-slate-600 mt-2">February 1 & 7, 2026</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 pt-8">
          Only @student.ubc.ca and @alumni.ubc.ca emails accepted
        </p>
      </div>
    </div>
  );
}
