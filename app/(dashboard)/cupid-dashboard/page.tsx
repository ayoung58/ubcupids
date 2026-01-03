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
    },
  });

  // Redirect if user is not a Cupid
  if (!profile?.isCupid) {
    redirect("/dashboard");
  }

  const displayName =
    profile?.cupidDisplayName || profile?.displayName || session.user.name;

  // Check if cupids have been assigned candidates (admin has run "pair cupids")
  const totalAssignments = await prisma.cupidAssignment.count({
    where: { batchNumber: 1 },
  });

  const cupidsAssigned = totalAssignments > 0;

  // Check if matches have been revealed
  const revealedMatchCount = await prisma.match.count({
    where: {
      batchNumber: 1,
      revealedAt: { not: null },
    },
  });

  const matchesRevealed = revealedMatchCount > 0;

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
              algorithm results and revealed on February 1 & 7, 2026
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
