import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Heart, Target, Users } from "lucide-react";

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

  // TODO: Fetch Cupid-specific stats (matches created, etc.)
  const matchesCreated = 0; // Placeholder

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          🏹 Cupid Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Welcome, {displayName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Matches Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {matchesCreated}
            </p>
            <p className="text-sm text-slate-600 mt-1">Total matches made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-500" />
              Active Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">0</p>
            <p className="text-sm text-slate-600 mt-1">
              Pending match proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">--%</p>
            <p className="text-sm text-slate-600 mt-1">Accepted matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Card */}
      <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader>
          <CardTitle className="text-2xl">Create Matches 💘</CardTitle>
          <p className="text-slate-600">
            Browse profiles and create meaningful connections
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/cupid-dashboard/matching-portal">
            <Button size="lg" className="w-full md:w-auto">
              <Target className="mr-2 h-5 w-5" />
              Go to Matching Portal
            </Button>
          </Link>
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

      {/* Quick Links */}
      <div className="flex gap-4">
        <Link href="/profile">
          <Button variant="outline">Manage Profile</Button>
        </Link>
        {profile?.isBeingMatched && (
          <Link href="/dashboard">
            <Button variant="outline">View Match Dashboard</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
