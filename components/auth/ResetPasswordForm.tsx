"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [backUrl, setBackUrl] = useState("/login");
  const [backLabel, setBackLabel] = useState("Back to login");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Detect where user came from
  useEffect(() => {
    const referrer = document.referrer;
    if (referrer.includes("/dashboard") || referrer.includes("/profile")) {
      setBackUrl("/dashboard");
      setBackLabel("Back to dashboard");
    }
  }, []);

  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    if (passedChecks === 4)
      return { strength: "Strong", color: "text-green-600" };
    if (passedChecks >= 2)
      return { strength: "Medium", color: "text-yellow-600" };
    return { strength: "Weak", color: "text-red-600" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setError(data.details.join(", "));
        } else {
          setError(data.error || "Failed to reset password");
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const passwordStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-medium">Password reset successfully!</p>
              <p className="mt-1 text-sm">Redirecting to login...</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
            {passwordStrength && (
              <p className={`text-xs ${passwordStrength.color}`}>
                Strength: {passwordStrength.strength}
              </p>
            )}
            <p className="text-xs text-slate-500">
              At least 8 characters, 1 uppercase, 1 lowercase, 1 number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
