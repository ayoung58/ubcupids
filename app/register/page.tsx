import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

/**
 * Registration Page
 *
 * URL: /register
 *
 * Features:
 * - UBC email validation (@student.ubc.ca, @alumni.ubc.ca)
 * - Password strength validation
 * - Terms & Conditions acceptance
 * - Redirect to verification pending page after registration
 *
 * Public page (no authentication required)
 */

export const metadata: Metadata = {
  title: "Sign Up | UBCupids",
  description: "Create your UBCupids account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; linking?: string }>;
}) {
  const params = await searchParams;
  const accountType =
    params.type === "cupid" || params.type === "match" ? params.type : "match";

  const isLinking = params.linking === "true";

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
          <p className="mt-2 text-sm text-slate-600">
            {isLinking
              ? `Link your ${accountType === "cupid" ? "Cupid" : "Match"} account`
              : `Create your ${accountType === "cupid" ? "Cupid" : "Match"} account to get started`}
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm accountType={accountType} isLinking={isLinking} />

        {/* Footer Links */}
        <div className="text-center text-sm">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
