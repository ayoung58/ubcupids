"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function ResendVerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification email");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setRemaining(data.remaining);
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p>
                  Verification code sent! Check your inbox and spam folder for
                  your 6-digit code. In order to receive emails more easily,
                  please whitelist support@ubcupids.org
                </p>
                <p className="text-sm mt-2">
                  If you haven&apos;t received a verification code, please email{" "}
                  <a
                    href="mailto:support@ubcupids.org?subject=UBCupids%20Verification"
                    className="font-medium underline hover:text-green-900"
                  >
                    support@ubcupids.org
                  </a>{" "}
                  using your ubc email with the subject &quot;UBCupids
                  Verification&quot; and you can be manually verified.
                </p>
                {remaining !== null && (
                  <p className="text-xs mt-1">
                    {remaining} attempt{remaining !== 1 ? "s" : ""} remaining in
                    this 15-minute window.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
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
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>

          {/* Rate Limit Info */}
          <p className="text-xs text-slate-500 text-center">
            Limited to 3 attempts per 15 minutes
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
