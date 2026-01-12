import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { QuestionnaireV2 } from "@/components/questionnaire/v2/QuestionnaireV2";
import { QuestionnaireResponses } from "@/types/questionnaire-v2";

/**
 * Check if questionnaire is open
 */
function isQuestionnaireOpen(): boolean {
  const now = new Date();
  const openingDate = new Date('2026-01-16T00:00:00.000Z'); // January 16, 2026, 00:00 UTC
  return now >= openingDate;
}

/**
 * Fetch QuestionnaireResponseV2 data from database
 * Phase 5 will add save/autosave functionality
 */
async function getQuestionnaireV2Data(userId: string) {
  const response = await prisma.questionnaireResponseV2.findUnique({
    where: { userId },
    select: {
      responses: true,
      freeResponse1: true,
      freeResponse2: true,
      freeResponse3: true,
      freeResponse4: true,
      freeResponse5: true,
      isSubmitted: true,
    },
  });

  if (!response) {
    return {
      responses: {},
      isSubmitted: false,
    };
  }

  // Parse JSONB responses
  let parsedResponses: Partial<QuestionnaireResponses> = {};
  if (response.responses) {
    try {
      parsedResponses = response.responses as Partial<QuestionnaireResponses>;
    } catch (error) {
      console.error("Failed to parse questionnaire responses:", error);
    }
  }

  return {
    responses: parsedResponses,
    isSubmitted: response.isSubmitted,
  };
}

async function QuestionnairePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if questionnaire is open
  if (!isQuestionnaireOpen()) {
    redirect("/dashboard");
  }

  // Fetch questionnaire data
  const data = await getQuestionnaireV2Data(session.user.id);

  // Fetch tutorial completion status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { questionnaireTutorialCompleted: true },
  });

  return (
    <QuestionnaireV2
      initialResponses={data.responses}
      isSubmitted={data.isSubmitted}
      tutorialCompleted={user?.questionnaireTutorialCompleted ?? false}
    />
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading questionnaire...</div>}
    >
      <QuestionnairePage />
    </Suspense>
  );
}
