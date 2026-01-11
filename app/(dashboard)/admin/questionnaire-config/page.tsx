import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
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

      {/* Questionnaire V2 Configuration - Coming Soon */}
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Questionnaire Configuration
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800 font-medium mb-2">
            ⚙️ Configuration Editor Under Development
          </p>
          <p className="text-blue-700 text-sm">
            The questionnaire configuration editor is being redesigned to
            support the new split-screen format with preferences, importance
            ratings, and dealbreaker logic. This feature will be available after
            the V2 revamp is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
