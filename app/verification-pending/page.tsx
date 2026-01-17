import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Verification Pending Page
 *
 * Shown after successful registration
 * Instructs user to check email
 * Provides link to resend verification email
 */

export const metadata: Metadata = {
  title: "Verify Your Email | UBCupids",
  description: "Check your email to verify your account",
};

export default function VerificationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-600">
              We&apos;ve sent a 6-digit verification code to your UBC email
              address. Enter this code on the verification page to activate your
              account.
            </p>

            <p className="text-sm text-slate-500">
              Didn&apos;t receive the email? Check your spam folder or request a
              new code.
            </p>

            <div className="pt-6 space-y-3">
              <Link href="/verify-email">
                <Button className="w-full pb-3">Enter Verification Code</Button>
              </Link>

              <Link href="/resend-verification">
                <Button variant="outline" className="w-full">
                  Resend Verification Code
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
