import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Matching Portal | UBCupids",
  description: "Create matches between compatible users",
};

export default async function MatchingPortalPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  // Verify user is a Cupid
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isCupid: true },
  });

  if (!profile?.isCupid) {
    redirect("/dashboard");
  }

  // TODO: Fetch users who are eligible for matching
  // For now, this is a bare bones placeholder

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/cupid-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            🎯 Matching Portal
          </h1>
          <p className="text-slate-600 mt-1">
            Browse profiles and create meaningful connections
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Matching Portal - Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              The matching portal is currently under development. When ready, it
              will allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Browse anonymized user questionnaire responses</li>
              <li>View compatibility indicators and shared interests</li>
              <li>Create match proposals between compatible users</li>
              <li>Track your matching success rate and statistics</li>
              <li>See your proposed matches get approved by the algorithm</li>
            </ul>
            <div className="pt-4">
              <p className="text-sm text-slate-600">
                This feature will be available before the matching period
                begins. Stay tuned!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No profiles available yet</p>
                <p className="text-sm mt-2">
                  Users will appear here after completing the questionnaire
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips for Cupids</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong className="text-slate-900">
                  Look for complementary traits
                </strong>
                <p className="text-slate-600">
                  Sometimes opposites attract! Balance is key.
                </p>
              </div>
              <div>
                <strong className="text-slate-900">
                  Consider shared values
                </strong>
                <p className="text-slate-600">
                  Common life goals and values create strong foundations.
                </p>
              </div>
              <div>
                <strong className="text-slate-900">Trust your intuition</strong>
                <p className="text-slate-600">
                  You&apos;re here because you understand human connections!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
