import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | UBCupids",
  description: "Create a new password for your UBCupids account",
};

interface ResetPasswordPageProps {
  searchParams: {
    token?: string;
  };
}

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid reset link. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <Button variant="outline">Request New Link</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer">
              💘 UBCupids
            </h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600">Create a new password</p>
        </div>

        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
