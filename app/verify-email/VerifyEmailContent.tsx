"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailContent() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsVerifying(false);
        return;
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err) {
      console.error("Verification error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsVerifying(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main verification page - requires code input
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Verify Your Email Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-slate-600">
            Enter the 6-digit verification code sent to your email address.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
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
                disabled={isVerifying}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500 text-center">
                Check your email inbox (and spam folder)
              </p>
            </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email Address"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCode("");
                setError(null);
                router.push("/resend-verification");
              }}
              className="w-full"
            >
              Resend Code
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500">
            Verification codes expire in 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
