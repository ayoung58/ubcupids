"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Mail, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resendCount, setResendCount] = useState(0);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset code");
        setIsLoading(false);
        return;
      }

      // Success - move to code input step
      setStep("code");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to reset password page with code
      router.push(`/reset-password?code=${encodeURIComponent(code)}`);
    } catch (err) {
      console.error("Verification error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCount >= 3) {
      setError("Maximum resend attempts reached. Please try again later.");
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsResending(false);
        return;
      }

      setResendCount(resendCount + 1);
      setCode(""); // Clear the code input
      setError(null);
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Email input step
  if (step === "email") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@student.ubc.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                We&apos;ll send a 6-digit reset code to this email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Code input step
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Enter Reset Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-center text-slate-600 text-sm">
          We&apos;ve sent a 6-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Reset Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              maxLength={6}
              required
              disabled={isLoading}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 text-center">
              Check your email inbox (and spam folder)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={isResending || resendCount >= 3}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                `Resend Code ${resendCount > 0 ? `(${3 - resendCount} left)` : ""}`
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Email
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
