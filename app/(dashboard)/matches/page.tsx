import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { MatchesDisplay } from "./MatchesDisplay";

export const metadata: Metadata = {
  title: "My Matches | UBCupids",
  description: "View your UBCupids matches",
};

export default async function MatchesPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user completed their questionnaire
  const questionnaireV2 = await prisma.questionnaireResponseV2.findUnique({
    where: { userId: session.user.id },
    select: { isSubmitted: true },
  });

  const isSubmitted = questionnaireV2?.isSubmitted ?? false;

  // If questionnaire not submitted, redirect back to dashboard
  if (!isSubmitted) {
    redirect("/dashboard");
  }

  return <MatchesDisplay />;
}
