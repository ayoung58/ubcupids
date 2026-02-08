"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface CupidInfo {
  id: string;
  name: string;
  alreadySent: boolean;
  status?: string; // 'accepted' or 'declined'
}

interface CupidFeedbackSectionProps {
  userCupid: CupidInfo | null;
  otherCupids: CupidInfo[];
}

export function CupidFeedbackSection({
  userCupid,
  otherCupids,
}: CupidFeedbackSectionProps) {
  // State for each cupid's feedback form
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMessageChange = (cupidId: string, value: string) => {
    setMessages((prev) => ({ ...prev, [cupidId]: value }));
    // Clear error when user starts typing
    if (errors[cupidId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[cupidId];
        return newErrors;
      });
    }
  };

  const getWordCount = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const handleSubmit = async (cupidId: string) => {
    const message = messages[cupidId]?.trim();

    if (!message) {
      setErrors((prev) => ({
        ...prev,
        [cupidId]: "Please enter a message before sending.",
      }));
      return;
    }

    const wordCount = getWordCount(message);
    if (wordCount > 300) {
      setErrors((prev) => ({
        ...prev,
        [cupidId]: `Message is too long (${wordCount} words). Please keep it under 300 words.`,
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [cupidId]: true }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[cupidId];
      return newErrors;
    });

    try {
      const response = await fetch("/api/cupid-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cupidId,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send feedback");
      }

      setSuccess((prev) => ({ ...prev, [cupidId]: true }));
      setMessages((prev) => ({ ...prev, [cupidId]: "" }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [cupidId]:
          error instanceof Error
            ? error.message
            : "Failed to send feedback. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [cupidId]: false }));
    }
  };

  const renderFeedbackForm = (cupid: CupidInfo) => {
    const message = messages[cupid.id] || "";
    const wordCount = getWordCount(message);
    const isLoading = loading[cupid.id];
    const hasSent = success[cupid.id] || cupid.alreadySent;
    const error = errors[cupid.id];

    return (
      <div key={cupid.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900">
              {cupid.name}{" "}
              {cupid.status && (
                <span className="text-sm font-normal text-slate-600">
                  (
                  {cupid.status === "accepted"
                    ? "You accepted their match"
                    : "You passed on their match"}
                  )
                </span>
              )}
            </h3>
          </div>
          {hasSent && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Sent
            </span>
          )}
        </div>

        {hasSent ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm text-center">
              Thank you for your feedback! Your message has been sent to{" "}
              {cupid.name}.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-1">
              <Textarea
                placeholder="Share how your match went, or let them know you'd like to stay in touch by including your contact info..."
                value={message}
                onChange={(e) => handleMessageChange(cupid.id, e.target.value)}
                disabled={isLoading}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Maximum 300 words</span>
                <span
                  className={wordCount > 300 ? "text-red-600 font-medium" : ""}
                >
                  {wordCount} / 300 words
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleSubmit(cupid.id)}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </>
        )}
      </div>
    );
  };

  // Don't show anything if there are no cupids
  if (!userCupid && otherCupids.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Let the cupid{otherCupids.length > 0 || userCupid ? "(s)" : ""} know
          about your match!
        </CardTitle>
        <p className="text-sm text-slate-600">
          You can send one message per cupid, and the email will be sent through
          the messages@ubcupids.org email address.
          <br />
          Feel free to include contact info if you&apos;d like to continue the
          conversation! 💌
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {userCupid && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
              Your Cupid
            </h2>
            {renderFeedbackForm(userCupid)}
          </div>
        )}

        {otherCupids.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
              Matches Received from Other Cupids
            </h2>
            <div className="space-y-6">
              {otherCupids.map((cupid) => renderFeedbackForm(cupid))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
