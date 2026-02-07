import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Cupid Dashboard | UBCupids",
  description: "Your Cupid dashboard - Help create matches",
};

export default async function CupidDashboardPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user profile for display name
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      cupidDisplayName: true,
      isCupid: true,
      isBeingMatched: true,
      isTestUser: true,
    },
  });

  // Redirect if user is not a Cupid
  if (!profile?.isCupid) {
    redirect("/dashboard");
  }

  const displayName =
    profile?.cupidDisplayName || profile?.displayName || session.user.name;

  // Get matching batch status
  const batch = await prisma.matchingBatch.findUnique({
    where: { batchNumber: 1 },
  });

  // Check if cupids have been assigned candidates (admin has run "pair cupids")
  // For production users: also check if date is >= Feb 1, 2026
  // CRITICAL: Must filter by PRODUCTION assignments only for production cupids
  const totalAssignments = await prisma.cupidAssignment.count({
    where: {
      batchNumber: 1,
      cupidUser: {
        isTestUser: profile?.isTestUser ?? false,
      },
      candidate: {
        isTestUser: profile?.isTestUser ?? false, // Match candidate type to cupid type
      },
    },
  });

  const isProductionCupid = !profile?.isTestUser;
  const currentDate = new Date();
  const launchDate = new Date("2026-02-01T00:00:00.000Z");

  // Production cupids can only access portal if:
  // 1. Date is >= Feb 1, 2026 AND
  // 2. They have PRODUCTION assignments in the database (not test assignments)
  const cupidsAssigned = isProductionCupid
    ? currentDate >= launchDate && totalAssignments > 0
    : totalAssignments > 0; // Test users can access anytime if assigned

  // Check if matches have been revealed (use batch.revealedAt for consistency)
  const matchesRevealed = batch?.revealedAt !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          🏹 Cupid Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Welcome, {displayName}!</p>
      </div>

      {/* Main Action Card */}
      <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader>
          <CardTitle className="text-2xl">Create Matches 💘</CardTitle>
          <p className="text-slate-600">
            {cupidsAssigned
              ? "Browse profiles and create meaningful connections"
              : "Questionnaires are still being filled out!"}
          </p>
          <p className="text-slate-600">
            <span className="text-sm">
              <span className="text-sm flex-shrink-0">💡</span>
              <strong>Tip:</strong> Be sure to look at the free response
              questions; the algorithm doesn&apos;t use these to score and
              match!
            </span>
          </p>
        </CardHeader>
        <CardContent>
          {matchesRevealed ? (
            <Button size="lg" className="w-full md:w-auto" disabled>
              <Target className="mr-2 h-5 w-5" />
              Matches have now been revealed to match users. Thank you cupids!
            </Button>
          ) : cupidsAssigned ? (
            <Link href="/cupid-dashboard/matching-portal">
              <Button size="lg" className="w-full md:w-auto">
                <Target className="mr-2 h-5 w-5" />
                Go to Matching Portal
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="w-full md:w-auto" disabled>
              <Target className="mr-2 h-5 w-5" />
              Questionnaires are still being filled out!
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feedback Card */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-purple-700 mb-2">
                📝 Help Us Improve!
              </h3>
              <p className="text-purple-600 text-sm">
                {matchesRevealed
                  ? "Help us improve the experience by providing feedback! You'll have a chance to win 1 of 3 $10 Amazon gift cards!"
                  : "Feedback forms open when matches are revealed on Feb 8th"}
              </p>
            </div>
            {matchesRevealed ? (
              <Button
                asChild
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <a
                  href="https://forms.gle/AFEKuToXGNMtqeKJ7"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Provide Feedback
                </a>
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="border-purple-300 bg-white text-purple-400 cursor-not-allowed opacity-60"
              >
                Provide Feedback
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Cupid Mode Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
              1
            </div>
            <p>
              <strong>Browse Profiles:</strong> View anonymized questionnaire
              responses from users who opted in to be matched
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
              2
            </div>
            <p>
              <strong>Create Matches:</strong> Use your intuition to pair
              compatible people based on their responses
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
              3
            </div>
            <p>
              <strong>Make Magic:</strong> Your matches will be combined with
              algorithm results and revealed on February 8, 2026
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
