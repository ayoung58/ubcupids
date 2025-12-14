"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Login Form Component
 *
 * Features:
 * - Client-side form validation
 * - Loading state during authentication
 * - Error handling (invalid credentials, unverified email)
 * - Redirect to dashboard on success
 * - Link to resend verification email
 *
 * Security:
 * - Uses NextAuth signIn() (handles CSRF protection)
 * - Doesn't reveal if email exists (generic error messages)
 */

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Attempt login via NextAuth
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        // Check for specific error types
        if (result.error === "EmailNotVerified") {
          // Email is in database but not verified
          setError("Please verify your email or resend the verification link");
        } else if (result.error === "TooManyAttempts") {
          // NEW: Handle rate limit error
          setError(
            "Too many failed login attempts. Please try again in 15 minutes or reset your password."
          );
        } else {
          // User doesn't exist or password is wrong (combined for security)
          setError(
            'Incorrect email or password. Please sign up or click "Forgot Your Password?" if you forgot your password'
          );
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh server components to load session
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@student.ubc.ca"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              {/* NEW: Forgot Password Link */}
              <Link
                href="/forgot-password"
                className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          {/* Resend Verification Link */}
          <p className="text-xs text-center text-slate-600">
            Didn&apos;t receive verification email?{" "}
            <Link
              href="/resend-verification"
              className="font-medium text-slate-900 hover:underline"
            >
              Resend
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
