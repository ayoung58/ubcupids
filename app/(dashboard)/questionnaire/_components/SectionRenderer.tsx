"use client";

import {
  Section,
  Responses,
  ResponseValue,
  ImportanceRatings,
  ImportanceLevel,
} from "@/src/lib/questionnaire-types";
import { QuestionRenderer } from "./QuestionRenderer";
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
  onChange: (questionId: string, value: ResponseValue) => void;
  onImportanceChange: (questionId: string, importance: ImportanceLevel) => void;
  disabled?: boolean;
  validationErrors?: Map<string, string>; // Map of questionId -> error message
}

export function SectionRenderer({
  section,
  responses,
  importance,
  onChange,
  onImportanceChange,
  disabled = false,
  validationErrors,
}: SectionRendererProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="bg-slate-50 px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl">{section.title}</CardTitle>
        {section.description && (
          <CardDescription className="text-sm md:text-base mt-2">
            {section.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6 md:space-y-8 pt-4 md:pt-6 px-4 md:px-6">
        {section.questions.map((question) => (
          <div
            key={question.id}
            className="pb-6 border-b last:border-b-0 last:pb-0"
          >
            <QuestionRenderer
              question={question}
              value={responses[question.id]}
              onChange={(value) => onChange(question.id, value)}
              importance={importance[question.id] || 3}
              onImportanceChange={(imp) => onImportanceChange(question.id, imp)}
              disabled={disabled}
              validationError={validationErrors?.get(question.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
