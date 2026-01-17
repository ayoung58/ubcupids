"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, User } from "lucide-react";

interface UserInfo {
  email: string;
  displayName: string;
  isVerified: boolean;
  verifiedAt: string | null;
}

export function ManualVerifyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setUserInfo(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/manual-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify user");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setUserInfo(data.user);
      setEmail(""); // Clear form
    } catch (err) {
      console.error("Manual verification error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Verify User Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Alert */}
        {success && userInfo && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-medium">
                Successfully verified {userInfo.displayName}
              </p>
              <p className="text-sm mt-1">Email: {userInfo.email}</p>
              {userInfo.verifiedAt && (
                <p className="text-xs mt-1">
                  Verified at: {new Date(userInfo.verifiedAt).toLocaleString()}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@student.ubc.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">
              Enter the exact email address to verify
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify User"
            )}
          </Button>
        </form>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> This will immediately verify the user&apos;s
            email address, allowing them to log in. Use this only when users
            cannot receive verification emails.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
