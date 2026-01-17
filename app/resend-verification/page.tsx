import { Metadata } from "next";
import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

/**
 * Resend Verification Email Page
 *
 * Allows users to request new verification email if:
 * - Original email went to spam
 * - Token expired (24 hours)
 * - Email was accidentally deleted
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resend Verification Email | UBCupids",
  description: "Request a new verification email",
};

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Resend Verification Email
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email to receive a new verification code
          </p>
        </div>

        {/* Resend Form */}
        <ResendVerificationForm />

        {/* Footer Link */}
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
