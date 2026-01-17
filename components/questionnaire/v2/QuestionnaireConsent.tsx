"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface QuestionnaireConsentProps {
  onConsent: () => void;
}

export function QuestionnaireConsent({ onConsent }: QuestionnaireConsentProps) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full relative">
        <Card className="border-2 border-pink-100 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to the UBCupids Questionnaire!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Information Section */}
            <div className="space-y-4 px-6">
              <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                Before You Begin
              </h3>

              <div className="prose prose-sm text-slate-700 space-y-3">
                <p className="bg-pink-50 border-l-4 border-pink-400 p-3 rounded-r">
                  This questionnaire will take approximately{" "}
                  <strong>15-20 minutes</strong> to complete. Your responses
                  will be used to find compatible matches for Valentine&apos;s
                  Day 2026.
                </p>

                <h4 className="font-semibold text-slate-900 mt-4 flex items-center gap-2">
                  <span className="text-purple-500">💫</span>
                  What to Expect:
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    39 questions about your values, lifestyle, and personality
                  </li>
                  <li>
                    For each question, you&apos;ll share your own answer and
                    your preferences for a match
                  </li>
                  <li>
                    Rate how important each preference is to you (with optional
                    dealbreakers)
                  </li>
                  <li>
                    5 free-response questions to showcase your personality (2
                    required, 3 optional)
                  </li>
                  <li>Your responses are automatically saved as you go</li>
                </ul>

                <h4 className="font-semibold text-slate-900 mt-4 flex items-center gap-2">
                  <span className="text-pink-500">📋</span>
                  Important Information:
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    You can take breaks and return later - your progress is
                    saved
                  </li>
                  <li>
                    You&apos;ll be able to view (but not edit) your responses
                    after submission
                  </li>
                  <li>
                    Matches will be revealed on{" "}
                    <strong className="text-pink-600">February 8, 2026</strong>
                  </li>
                  <li>
                    Use dealbreakers sparingly - they immediately exclude
                    potential matches
                  </li>
                </ul>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="space-y-4 border-t-2 border-pink-100 pt-6 bg-gradient-to-br from-pink-50/50 to-purple-50/50 p-6 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-1 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I understand and agree that:
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      If I receive a match, I am expected to reach out and make
                      contact with my match(es) in good faith
                    </li>
                    <li>
                      My responses will be shared with my match(es) and will be
                      used by the matching algorithm to find compatible partners
                    </li>
                    <li>
                      I commit to responding to my matches if contacted, and to
                      treating all matches with respect and courtesy
                    </li>
                  </ul>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex-1 border-2 hover:border-pink-300 hover:bg-pink-50"
              >
                Go Back
              </Button>
              <Button
                onClick={onConsent}
                disabled={!consent}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold shadow-lg disabled:shadow-none transition-all"
              >
                {consent
                  ? "Start Questionnaire ✨"
                  : "Please check the box to continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
