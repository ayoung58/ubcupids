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
  searchParams: {
    verified?: string;
    error?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { verified, error } = searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">💘 UBCupids</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your account</p>
        </div>

        {/* Success Messages */}
        {verified === "true" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Email verified successfully! You can now log in.
            </AlertDescription>
          </Alert>
        )}

        {verified === "already" && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your email is already verified. You can log in below.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {error === "invalid_token" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Invalid verification link. Please request a new one.
            </AlertDescription>
          </Alert>
        )}

        {error === "token_expired" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Verification link expired. Please request a new one below.
            </AlertDescription>
          </Alert>
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
