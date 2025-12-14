import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

/**
 * Login Page
 *
 * URL: /login
 *
 * Query params handled:
 * - ?verified=true → Show "Email verified" success message
 * - ?verified=already → Show "Already verified" message
 * - ?error=invalid_token → Show "Invalid verification link" error
 * - ?error=token_expired → Show "Verification link expired" error
 *
 * Public page (no authentication required)
 */

export const metadata: Metadata = {
  title: "Login | UBCupids",
  description: "Log in to your UBCupids account",
};

interface LoginPageProps {
  searchParams: Promise<{
    verified?: string;
    error?: string;
    signedout?: string;
    reset?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { verified, error, signedout, reset } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
              💘 UBCupids
            </h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600">Sign in to your account</p>
        </div>

        {/* Success Messages */}
        {signedout === "true" && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              You have successfully signed out.
            </p>
          </div>
        )}

        {verified === "true" && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Email verified successfully! You can now log in.
            </p>
          </div>
        )}

        {verified === "already" && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Your email is already verified. You can log in below.
            </p>
          </div>
        )}

        {/* Password Reset Success */}
        {reset === "success" && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Password reset successfully! You can now log in with your new
              password.
            </p>
          </div>
        )}

        {/* Error Messages */}
        {error === "invalid_token" && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Invalid verification link. Please request a new one.
            </p>
          </div>
        )}

        {error === "token_expired" && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Verification link expired. Please request a new one below.
            </p>
          </div>
        )}

        {/* Login Form */}
        <LoginForm />

        {/* Footer Links */}
        <div className="text-center text-sm">
          <p className="text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
