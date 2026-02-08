import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardTutorial } from "./_components/DashboardTutorial";
import { CupidFeedbackSection } from "@/components/dashboard/CupidFeedbackSection";

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

async function getCupidFeedbackData(userId: string) {
  // Check if user has a cupid who matched them
  const cupidAssignment = await prisma.cupidAssignment.findFirst({
    where: {
      candidateId: userId,
      selectedMatchId: { not: null },
    },
    include: {
      cupidUser: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
        },
      },
    },
  });

  // Find all cupids who matched this user (cupid_sent matches)
  // User could be either the userId (primary candidate) or matchedUserId (the match)
  // Include both accepted and declined (passed) matches
  const cupidMatches = await prisma.match.findMany({
    where: {
      OR: [
        {
          userId: userId,
          matchType: "cupid_sent",
          status: { in: ["accepted", "declined"] },
        },
        {
          matchedUserId: userId,
          matchType: "cupid_sent",
          status: { in: ["accepted", "declined"] },
        },
      ],
    },
    select: {
      cupidId: true,
      status: true,
      userId: true,
      matchedUserId: true,
    },
  });

  // Build map of cupid IDs to their match status from the perspective of the current user
  const cupidMatchStatusMap = new Map<string, string>();
  cupidMatches.forEach((match) => {
    if (match.cupidId && match.cupidId !== cupidAssignment?.cupidUserId) {
      // Determine if current user was the one who responded to the match
      // If matchedUserId is current user, they were the one who responded
      const isUserResponder = match.matchedUserId === userId;
      if (isUserResponder) {
        cupidMatchStatusMap.set(match.cupidId, match.status);
      }
    }
  });

  // Get unique cupid IDs
  const cupidIds = Array.from(cupidMatchStatusMap.keys());

  // Get cupid details
  const otherCupids = await prisma.user.findMany({
    where: {
      id: { in: cupidIds },
    },
    select: {
      id: true,
      displayName: true,
      firstName: true,
    },
  });

  // Check which cupids have already received feedback
  const sentFeedback = await prisma.cupidFeedback.findMany({
    where: {
      senderId: userId,
      cupidId: {
        in: [cupidAssignment?.cupidUserId, ...cupidIds].filter(
          (id): id is string => id !== undefined,
        ),
      },
    },
    select: {
      cupidId: true,
    },
  });

  const sentCupidIds = new Set(sentFeedback.map((f) => f.cupidId));

  // Format data for component
  const userCupid = cupidAssignment
    ? {
        id: cupidAssignment.cupidUserId,
        name:
          cupidAssignment.cupidUser.displayName ||
          cupidAssignment.cupidUser.firstName,
        alreadySent: sentCupidIds.has(cupidAssignment.cupidUserId),
      }
    : null;

  const otherCupidsData = otherCupids.map((cupid) => ({
    id: cupid.id,
    name: cupid.displayName || cupid.firstName,
    alreadySent: sentCupidIds.has(cupid.id),
    status: cupidMatchStatusMap.get(cupid.id) || "accepted",
  }));

  return {
    userCupid,
    otherCupids: otherCupidsData,
  };
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

  // Get cupid feedback data
  const cupidFeedbackData = await getCupidFeedbackData(session.user.id);

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
            {questionnaireStatus === "completed" ? (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  View your Valentine&apos;s Day matches
                </p>
                <Link href="/matches">
                  <Button className="w-full" variant="outline">
                    View Matches
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  Sorry, your questionnaire was not submitted by the deadline,
                  so you have not been matched
                </p>
                <Button className="w-full" variant="outline" disabled>
                  Complete Questionnaire First
                </Button>
              </>
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
                ? "Help us improve the experience by providing feedback! Fill this out by Feb. 21st, and you'll have a chance to win 1 of 3 $10 Amazon gift cards!"
                : "Feedback forms open when matches are revealed on Feb 8th. Fill this out by Feb. 21st and you'll have a chance to win 1 of 3 $10 Amazon gift cards!"}
            </p>
            {matchesRevealed ? (
              <Link
                href="https://forms.gle/AFEKuToXGNMtqeKJ7"
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

      {/* Cupid Feedback Section */}
      {(cupidFeedbackData.userCupid ||
        cupidFeedbackData.otherCupids.length > 0) && (
        <CupidFeedbackSection
          userCupid={cupidFeedbackData.userCupid}
          otherCupids={cupidFeedbackData.otherCupids}
        />
      )}

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
