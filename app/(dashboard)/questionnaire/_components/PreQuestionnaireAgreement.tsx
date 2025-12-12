"use client";

import { AgreementConfig } from "@/src/lib/questionnaire-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle2, Heart } from "lucide-react";

interface PreQuestionnaireAgreementProps {
  agreement: AgreementConfig;
  onAgree: () => void;
}

export function PreQuestionnaireAgreement({
  agreement,
  onAgree,
}: PreQuestionnaireAgreementProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex justify-center">
            <div className="bg-pink-100 p-4 rounded-full">
              <Heart className="h-12 w-12 text-pink-500" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {agreement.title}
          </CardTitle>
          <CardDescription className="text-base">
            {agreement.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* What to Expect */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              What to expect:
            </h3>
            <ul className="space-y-2 ml-7">
              {agreement.points.map((point, index) => (
                <li key={index} className="text-sm text-blue-800">
                  • {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Commitments */}
          <div className="bg-pink-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-pink-900">
              By continuing, I agree to:
            </h3>
            <ul className="space-y-2 ml-3">
              {agreement.commitments?.map((commitment, index) => (
                <li
                  key={index}
                  className="text-sm text-pink-800 flex items-start gap-2"
                >
                  <span className="text-pink-500 font-bold">✓</span>
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reminder */}
          {agreement.reminder && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-800 italic">
                💡 {agreement.reminder}
              </p>
            </div>
          )}

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <Checkbox
              id="agreement"
              checked={hasAgreed}
              onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
              className="mt-0.5"
            />
            <Label
              htmlFor="agreement"
              className="text-sm font-medium cursor-pointer leading-relaxed"
            >
              {agreement.agreementText}
            </Label>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onAgree}
            disabled={!hasAgreed}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Continue to Questionnaire →
          </Button>

          <p className="text-xs text-center text-gray-500">
            You can save your progress at any time and come back later
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
