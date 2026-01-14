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
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const allConsentsGiven = consent1 && consent2 && consent3;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome to the UBCupids Questionnaire!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">
              Before You Begin
            </h3>

            <div className="prose prose-sm text-slate-700 space-y-3">
              <p>
                This questionnaire will take approximately{" "}
                <strong>15-20 minutes</strong> to complete. Your responses will
                be used to find compatible matches for Valentine&apos;s Day
                2026.
              </p>

              <h4 className="font-semibold text-slate-900 mt-4">
                What to Expect:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  36 questions about your values, lifestyle, and personality
                </li>
                <li>
                  For each question, you&apos;ll share your own answer and your
                  preferences for a match
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

              <h4 className="font-semibold text-slate-900 mt-4">
                Important Information:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  You can take breaks and return later - your progress is saved
                </li>
                <li>Once submitted, you cannot edit your responses</li>
                <li>
                  You&apos;ll be able to view (but not edit) your responses
                  after submission
                </li>
                <li>
                  Matches will be revealed on <strong>February 7, 2026</strong>
                </li>
                <li>
                  Use dealbreakers sparingly - they immediately exclude
                  potential matches
                </li>
              </ul>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg text-slate-900">
              Please Confirm:
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={consent1}
                  onCheckedChange={(checked) => setConsent1(checked === true)}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">
                  I understand that if I receive a match, I am expected to reach
                  out and make contact with my match(es) in good faith.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={consent2}
                  onCheckedChange={(checked) => setConsent2(checked === true)}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">
                  I understand that my responses will be shared with my
                  match(es) and will be used by our matching algorithm to find
                  compatible partners.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={consent3}
                  onCheckedChange={(checked) => setConsent3(checked === true)}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">
                  I commit to responding to my matches if contacted, and to
                  treating all matches with respect and courtesy.
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={onConsent}
              disabled={!allConsentsGiven}
              className="flex-1"
            >
              {allConsentsGiven
                ? "Start Questionnaire"
                : "Please check all boxes to continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
