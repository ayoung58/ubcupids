import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password | UBCupids",
  description: "Create a new password for your UBCupids account",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const { code: rawCode } = params;
  const code = rawCode ? decodeURIComponent(rawCode) : undefined;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid reset code. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <Button variant="outline">Request New Code</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================
  // VALIDATE CODE STATUS
  // ============================================
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: code },
  });

  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invalid reset code. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <Button variant="outline">Request New Code</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if code expired
  if (resetToken.expires < new Date()) {
    // Delete expired code
    await prisma.passwordResetToken.delete({
      where: { token: code },
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Reset code has expired. Please request a new one.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link href="/forgot-password">
                  <Button variant="outline">Request New Code</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if code already used
  if (resetToken.used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The reset code has already been used. Please request a new
                  one.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link href="/login">
                  <Button variant="outline">Go to Login</Button>
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

        <ResetPasswordForm code={code} />
      </div>
    </div>
  );
}
