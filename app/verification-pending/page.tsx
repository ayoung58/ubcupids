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
              We&apos;ve sent a verification link to your UBC email address.
              Click the link in the email to activate your account.
            </p>

            <p className="text-sm text-slate-500">
              If you didn&apos;t receive the email, you can try resending it, or
              emailing support@ubcupids.org with the subject line &quot;UBCupids
              Verification&quot; for manual verification.
            </p>

            <div className="pt-4 space-y-2">
              <Link href="/resend-verification">
                <Button variant="outline" className="w-full">
                  Resend Verification Email
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
