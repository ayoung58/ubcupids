"use client";

import {
  Section,
  Responses,
  ResponseValue,
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
  onChange: (questionId: string, value: ResponseValue) => void;
  disabled?: boolean;
}

export function SectionRenderer({
  section,
  responses,
  onChange,
  disabled = false,
}: SectionRendererProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-2xl">{section.title}</CardTitle>
        {section.description && (
          <CardDescription className="text-base mt-2">
            {section.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {section.questions.map((question) => (
          <div
            key={question.id}
            className="pb-6 border-b last:border-b-0 last:pb-0"
          >
            <QuestionRenderer
              question={question}
              value={responses[question.id]}
              onChange={(value) => onChange(question.id, value)}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
