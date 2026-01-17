import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardTutorial } from "./_components/DashboardTutorial";

async function getQuestionnaireStatus(userId: string) {
  try {
    // Check V2 questionnaire first
    const questionnaireV2 = await prisma.questionnaireResponseV2.findUnique({
      where: { userId },
      select: { isSubmitted: true, responses: true },
    });

    if (questionnaireV2) {
      if (questionnaireV2.isSubmitted) return "completed";
      if (
        questionnaireV2.responses &&
        Object.keys(questionnaireV2.responses).length > 0
      )
        return "in-progress";
    }

    // Fallback to V1 for backwards compatibility
    const questionnaire = await prisma.questionnaireResponse.findUnique({
      where: { userId },
      select: { isSubmitted: true, responses: true },
    });

    if (!questionnaire) return "not-started";
    if (questionnaire.isSubmitted) return "completed";
    if (
      questionnaire.responses &&
      Object.keys(questionnaire.responses).length > 0
    )
      return "in-progress";
    return "not-started";
  } catch (error) {
    console.error("Error checking questionnaire status:", error);
    return "not-started";
  }
}

function isQuestionnaireOpen(): boolean {
  const now = new Date();
  const openingDate = new Date("2026-01-16T00:00:00.000Z"); // January 16, 2026, 00:00 UTC
  return now >= openingDate;
}

async function isQuestionnaireOpenForUser(userId: string): Promise<boolean> {
  const now = new Date();
  const openingDate = new Date("2026-01-16T00:00:00.000Z"); // January 16, 2026, 00:00 UTC

  // Check if user is a test user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isTestUser: true },
  });

  // Allow test users to access before the opening date
  if (user?.isTestUser) {
    return true;
  }

  return now >= openingDate;
}

export const metadata: Metadata = {
  title: "Dashboard | UBCupids",
  description: "Your UBCupids dashboard",
};

export default async function DashboardPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  const questionnaireStatus = await getQuestionnaireStatus(session.user.id);
  const questionnaireOpen = await isQuestionnaireOpenForUser(session.user.id);

  // Fetch user profile for display name and account types
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      isCupid: true,
      isBeingMatched: true,
      lastActiveDashboard: true,
      dashboardTutorialCompleted: true,
    },
  });

  // Redirect cupids who are NOT being matched to cupid dashboard
  // (Users with both accounts can access either dashboard)
  if (profile?.isCupid && !profile?.isBeingMatched) {
    redirect("/cupid-dashboard");
  }

  const displayName = profile?.displayName || session.user.name;

  // Check if matches have been revealed
  const batch = await prisma.matchingBatch.findUnique({
    where: { batchNumber: 1 },
    select: { revealedAt: true },
  });
  const matchesRevealed = batch?.revealedAt !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tutorial for match users */}
      {profile?.isBeingMatched && (
        <DashboardTutorial
          initialCompleted={profile.dashboardTutorialCompleted}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {displayName}!
        </h1>
        <p className="text-slate-600 mt-1">{session.user.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-tutorial="questionnaire-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Questionnaire</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between min-h-[120px] pt-2">
            {!questionnaireOpen && (
              <p className="text-sm text-amber-600 mb-2 font-medium">
                Questionnaires opening on January 16
              </p>
            )}
            <p className="text-sm text-slate-600 mb-2">
              {questionnaireStatus === "completed"
                ? "You've filled out your questionnaire! Matches to be revealed soon! 🎉"
                : "Fill out your compatibility questionnaire"}
            </p>
            {questionnaireOpen ? (
              <Link href="/questionnaire">
                <Button className="w-full">
                  {questionnaireStatus === "in-progress"
                    ? "Continue"
                    : questionnaireStatus === "completed"
                      ? "View Response"
                      : "Start"}
                </Button>
              </Link>
            ) : (
              <Button className="w-full" disabled>
                {questionnaireStatus === "in-progress"
                  ? "Continue"
                  : questionnaireStatus === "completed"
                    ? "View Response"
                    : "Start"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card data-tutorial="matches-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Matches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between min-h-[120px] pt-2">
            <p className="text-sm text-slate-600 mb-2">
              View your Valentine&apos;s Day matches
            </p>
            {questionnaireStatus === "completed" ? (
              <Link href="/matches">
                <Button className="w-full" variant="outline">
                  View Matches
                </Button>
              </Link>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Complete Questionnaire First
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between min-h-[120px] pt-2">
            <p className="text-sm text-slate-600 mb-2">
              {matchesRevealed
                ? "Help us improve! You'll have a chance to win 1 of 2 $20 Amazon gift cards!"
                : "Feedback forms open when matches are revealed on Feb 8th"}
            </p>
            {matchesRevealed ? (
              <Link
                href="https://syk3gprmktl.typeform.com/to/GhBJoEjn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full" variant="outline">
                  Provide Feedback
                </Button>
              </Link>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Provide Feedback
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>✅ Account created and verified</p>
          <p>
            {questionnaireStatus === "completed"
              ? "✅ Questionnaire completed"
              : "⏳ Complete your questionnaire (opens January 16)"}
          </p>
          <p>⏳ Matches revealed February 8, 2026</p>
        </CardContent>
      </Card>
    </div>
  );
}
