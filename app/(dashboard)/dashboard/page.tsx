import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react"; // Import icon
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | UBCupids",
  description: "Your UBCupids dashboard",
};

export default async function DashboardPage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {session.user.name}!
            </h1>
            <p className="text-slate-600 mt-1">{session.user.email}</p>
          </div>

          {/* Logout Button */}
          <form action="/api/auth/signout" method="POST">
            <input
              type="hidden"
              name="callbackUrl"
              value="/login?signedout=true"
            />
            <Button type="submit" variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Fill out your compatibility questionnaire
              </p>
              <Link href="/questionnaire">
                <Button className="w-full">Start</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                View your Valentine&apos;s Day matches
              </p>
              <Link href="/matches">
                <Button className="w-full" variant="outline">
                  View Matches
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Upload date receipt for prize draw
              </p>
              <Link href="/submit-proof">
                <Button className="w-full" variant="outline">
                  Upload
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>✅ Account created and verified</p>
            <p>⏳ Complete your questionnaire (opens January 15)</p>
            <p>⏳ Matches revealed February 1 & 7, 2026</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
