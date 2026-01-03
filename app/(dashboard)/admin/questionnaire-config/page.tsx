import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { QuestionnaireEditor } from "./_components/QuestionnaireEditor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Questionnaire Config | Admin | UBCupids",
  description: "Configure questionnaire questions and options",
};

export default async function QuestionnaireConfigPage() {
  const session = await getCurrentUser();

  // Middleware handles authentication, so session should always exist here
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Fetch user profile to check admin status
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isAdmin: true,
    },
  });

  // Redirect if user is not an admin
  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/admin">
        <Button variant="ghost" size="sm" className="hover:bg-slate-200">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Button>
      </Link>

      {/* Editor */}
      <QuestionnaireEditor />
    </div>
  );
}
