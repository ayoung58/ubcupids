"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

/**
 * Registration Form Component
 *
 * Features:
 * - Client-side validation (UBC email format, password strength)
 * - Real-time password strength indicator
 * - Terms & Conditions checkbox
 * - Error handling (duplicate email, validation errors)
 * - Success state with verification instructions
 *
 * Security:
 * - Validates UBC email before submission
 * - Password never sent to client (hashed server-side)
 * - Rate limiting handled by API (Phase 3.5)
 */

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Add styles for custom validation
  const customValidationStyles = `
    input:invalid:not(:placeholder-shown) {
      border-color: #ef4444;
      border-width: 2px;
    }
    input:invalid:not(:placeholder-shown):focus {
      ring-color: #ef4444;
    }
  `;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    age: "",
    major: "",
    acceptedTerms: false,
  });

  // Password strength validation (client-side preview)
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
    if (!formData.acceptedTerms) {
      setError("You must accept the Terms and Conditions");
      setTermsError(true);
      setIsLoading(false);
      return;
    }

    // UBC email validation
    const ubcEmailRegex =
      /^[a-zA-Z0-9._%+-]+@(student\.ubc\.ca|alumni\.ubc\.ca)$/i;
    if (!ubcEmailRegex.test(formData.email)) {
      setError("Please use your @student.ubc.ca or @alumni.ubc.ca email");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from server
        if (data.details) {
          // Password validation errors
          setError(data.details.join(", "));
        } else {
          setError(data.error || "Registration failed");
        }
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);

      // Redirect to verification pending page after 2 seconds
      setTimeout(() => {
        router.push("/verification-pending");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
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
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Account created successfully!</p>
              <p className="mt-1">
                Check your email for a verification link. Redirecting...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <style>{customValidationStyles}</style>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Name Fields (Side by Side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              UBC Email <span className="text-red-500">*</span>
            </Label>
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
            <p className="text-xs text-slate-500">
              Must be @student.ubc.ca or @alumni.ubc.ca
            </p>
          </div>

          {/* Password Field with Strength Indicator */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
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

          {/* Age Field (Required) */}
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2">
              Age <span className="text-red-500">*</span>
              <div className="group relative inline-block">
                <AlertCircle className="h-4 w-4 text-slate-400 cursor-help" />
                <div className="invisible group-hover:visible absolute left-0 top-6 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                  We collect your age to improve matches and ensure everyone is
                  comfortable. Please use your real age.
                </div>
              </div>
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="18"
              max="100"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Major Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="major">Major (Optional)</Label>
            <Input
              id="major"
              type="text"
              placeholder="Professional Cupid Studies"
              value={formData.major}
              onChange={(e) =>
                setFormData({ ...formData, major: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptedTerms}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, acceptedTerms: checked as boolean });
                if (checked) {
                  setTermsError(false);
                }
              }}
              disabled={isLoading}
              className={termsError ? "border-red-500 border-2" : ""}
            />
            <Label
              htmlFor="terms"
              className={`text-sm leading-none cursor-pointer ${
                termsError ? "text-red-600" : ""
              }`}
            >
              I accept the{" "}
              <a href="/terms" className="underline hover:text-slate-900">
                Terms and Conditions
              </a>{" "}
              (placeholder for now)
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
