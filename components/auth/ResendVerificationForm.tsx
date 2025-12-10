'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Resend Verification Form
 * 
 * Features:
 * - Client-side rate limiting (3 attempts per 15 minutes)
 * - UBC email validation
 * - Success/error states
 * - Countdown timer between attempts
 */

export function ResendVerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Rate limiting: 3 attempts per 15 minutes
  const MAX_ATTEMPTS = 3;
  const COOLDOWN_MINUTES = 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Check rate limit
    if (attemptCount >= MAX_ATTEMPTS) {
      setError(`Too many attempts. Please wait ${COOLDOWN_MINUTES} minutes.`);
      return;
    }

    // Check cooldown
    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email');
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setAttemptCount(attemptCount + 1);

      // Start 60-second cooldown
      setCooldownSeconds(60);
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Reset attempt count after 15 minutes
      setTimeout(() => {
        setAttemptCount(0);
      }, COOLDOWN_MINUTES * 60 * 1000);

    } catch (err) {
      console.error('Resend verification error:', err);
      setError('An unexpected error occurred. Please try again.');
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
                Verification email sent! Check your inbox.
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
              disabled={isLoading || cooldownSeconds > 0}
            />
          </div>

          {/* Rate Limit Info */}
          <p className="text-xs text-slate-500">
            {attemptCount > 0 && (
              <>Attempts remaining: {MAX_ATTEMPTS - attemptCount}</>
            )}
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || cooldownSeconds > 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldownSeconds > 0 ? (
              `Wait ${cooldownSeconds}s`
            ) : (
              'Send Verification Email'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}