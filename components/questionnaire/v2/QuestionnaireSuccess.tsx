"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function QuestionnaireSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">
            Questionnaire Submitted Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-lg text-slate-700">
            Thank you for completing the UBCupids questionnaire! 🎉
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Our matching algorithm will analyze your responses to find
                  compatible partners
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Matches will be revealed on <strong>February 8, 2026</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  You&apos;ll receive an email notification when matches are
                  available
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  You can view your responses anytime from your dashboard
                  (read-only)
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-amber-900 mb-2">
              Important Reminders:
            </h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Your responses are now locked and cannot be edited</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  If you receive a match, please reach out to them in good faith
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Treat all matches with respect and courtesy</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              Return to Dashboard
            </Button>
          </div>

          <p className="text-sm text-slate-500 pt-2">
            Questions? Contact us at{" "}
            <a
              href="mailto:support@ubcupids.com"
              className="text-pink-600 hover:underline"
            >
              support@ubcupids.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
