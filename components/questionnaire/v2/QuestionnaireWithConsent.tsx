"use client";

import React, { useState, useEffect } from "react";
import { QuestionnaireConsent } from "@/components/questionnaire/v2/QuestionnaireConsent";
import { QuestionnaireV2 } from "@/components/questionnaire/v2/QuestionnaireV2";
import { QuestionnaireResponses } from "@/types/questionnaire-v2";

interface QuestionnaireWithConsentProps {
  initialResponses: Partial<QuestionnaireResponses>;
  isSubmitted: boolean;
  tutorialCompleted: boolean;
  hasStarted: boolean; // If they have any saved responses
}

export function QuestionnaireWithConsent({
  initialResponses,
  isSubmitted,
  tutorialCompleted,
  hasStarted,
}: QuestionnaireWithConsentProps) {
  const [consentGiven, setConsentGiven] = useState(hasStarted || isSubmitted);

  if (!consentGiven) {
    return <QuestionnaireConsent onConsent={() => setConsentGiven(true)} />;
  }

  return (
    <QuestionnaireV2
      initialResponses={initialResponses}
      isSubmitted={isSubmitted}
      tutorialCompleted={tutorialCompleted}
    />
  );
}
