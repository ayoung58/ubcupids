import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getQuestionnaireConfig } from "@/src/lib/questionnaire-utils";
import { QuestionnaireForm } from "./_components/QuestionnaireForm";
import { QuestionnaireLoading } from "./_components/QuestionnaireLoading";
import { Responses, ImportanceRatings } from "@/src/lib/questionnaire-types";

async function getQuestionnaireData(userId: string) {
  const existingResponse = await prisma.questionnaireResponse.findUnique({
    where: { userId },
  });

  return {
    responses: existingResponse?.responses || {},
    importance: existingResponse?.importance || {},
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
      initialResponses={data.responses as Responses}
      initialImportance={data.importance as ImportanceRatings}
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
