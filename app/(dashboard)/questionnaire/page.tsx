import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { decryptJSON } from "@/lib/encryption";
import { getQuestionnaireConfig } from "@/src/lib/questionnaire-utils";
import { QuestionnaireForm } from "./_components/QuestionnaireForm";
import { QuestionnaireLoading } from "./_components/QuestionnaireLoading";
import { Responses, ImportanceRatings } from "@/src/lib/questionnaire-types";

async function getQuestionnaireData(userId: string) {
  const existingResponse = await prisma.questionnaireResponse.findUnique({
    where: { userId },
  });

  // Decrypt responses and importance if they exist
  let responses: Responses = {};
  let importance: ImportanceRatings = {};

  if (existingResponse?.responses) {
    try {
      responses = decryptJSON<Responses>(existingResponse.responses);
    } catch (error) {
      console.error("Failed to decrypt responses:", error);
      // If decryption fails for submitted questionnaire, this is a critical error
      // Don't silently return empty - the data exists but can't be read
      if (existingResponse.isSubmitted) {
        throw new Error(
          "Unable to decrypt submitted questionnaire data. Please contact support."
        );
      }
      // For drafts, we can start fresh
      responses = {};
    }
  }

  if (existingResponse?.importance) {
    try {
      importance = decryptJSON<ImportanceRatings>(existingResponse.importance);
    } catch (error) {
      console.error("Failed to decrypt importance:", error);
      // Importance ratings are optional, so we can continue without them
      importance = {};
    }
  }

  return {
    responses,
    importance,
    isSubmitted: existingResponse?.isSubmitted || false,
  };
}

async function QuestionnairePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getQuestionnaireData(session.user.id);
  const config = getQuestionnaireConfig();

  return (
    <QuestionnaireForm
      initialResponses={data.responses}
      initialImportance={data.importance}
      isSubmitted={data.isSubmitted}
      config={config}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<QuestionnaireLoading />}>
      <QuestionnairePage />
    </Suspense>
  );
}
