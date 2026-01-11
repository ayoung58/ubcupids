"use client";

import {
  Section,
  Responses,
  ResponseValue,
  ImportanceRatings,
  ImportanceLevel,
  QuestionResponse,
} from "@/src/lib/questionnaire-types";
import { Question } from "@/src/lib/questionnaire-types";
import { QuestionRendererV2 } from "./QuestionRendererV2";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SectionRendererProps {
  section: Section;
  responses: Responses;
  importance: ImportanceRatings;
  onChange: (questionId: string, value: QuestionResponse) => void;
  onImportanceChange: (questionId: string, importance: ImportanceLevel) => void;
  disabled?: boolean;
  validationErrors?: Map<string, string>; // Map of questionId -> error message
  globalQuestionStartIndex: number; // The starting index for this section's questions (0-based)
  sectionId?: string; // ID for the section element
}

export function SectionRenderer({
  section,
  responses,
  importance,
  onChange,
  onImportanceChange,
  disabled = false,
  validationErrors,
  globalQuestionStartIndex,
  sectionId,
}: SectionRendererProps) {
  return (
    <Card id={sectionId} className="mb-6 shadow-sm">
      <CardHeader className="bg-slate-50 px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl">{section.title}</CardTitle>
        {section.description && (
          <CardDescription className="text-sm md:text-base mt-2">
            {section.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6 md:space-y-8 pt-4 md:pt-6 px-4 md:px-6">
        {section.questions.map((question, idx) => {
          const globalNumber = globalQuestionStartIndex + idx + 1;
          const isFirstQuestion = globalQuestionStartIndex === 0 && idx === 0;
          return (
            <div
              key={question.id}
              className="pb-6 border-b last:border-b-0 last:pb-0"
              data-tutorial={isFirstQuestion ? "first-question" : undefined}
            >
              <QuestionRendererV2
                question={question}
                value={responses[question.id]}
                onChange={(value) => onChange(question.id, value)}
                disabled={disabled}
                validationError={validationErrors?.get(question.id)}
                questionNumber={globalNumber}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
