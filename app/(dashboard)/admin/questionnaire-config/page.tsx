import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

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

      {/* Placeholder Content */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-2xl px-4">
          <div className="flex justify-center">
            <div className="p-4 bg-pink-100 rounded-full">
              <Settings className="h-12 w-12 text-pink-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Questionnaire Configuration
          </h1>

          <p className="text-lg text-slate-600">
            Coming soon: V2 Question Management
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-900 mb-2 font-medium">
              📝 Note for Admins:
            </p>
            <p className="text-sm text-blue-800">
              The questionnaire configuration system is being rebuilt for V2.
              The new system will support the split-screen format with
              preferences, importance levels, and dealbreakers.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              For now, questions are defined in{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
                lib/questionnaire/v2/config.ts
              </code>
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Current questionnaire version:{" "}
            <span className="font-semibold text-pink-600">V2.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}
