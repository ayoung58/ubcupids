"use client";

import {
  Section,
  Responses,
  QuestionResponse,
  Question,
} from "@/src/lib/questionnaire-types";
import { QuestionRendererV2 } from "./QuestionRendererV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SectionRendererV2Props {
  section: Section;
  responses: Responses;
  onResponseChange: (
    questionId: string,
    updatedResponse: QuestionResponse
  ) => void;
  validationErrors: Map<string, string>;
  isSubmitted: boolean;
  sectionProgress: number;
}

export function SectionRendererV2({
  section,
  responses,
  onResponseChange,
  validationErrors,
  isSubmitted,
  sectionProgress,
}: SectionRendererV2Props) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{section.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {sectionProgress}% complete
          </div>
        </div>
        {section.description && (
          <p className="text-muted-foreground mt-2">{section.description}</p>
        )}
        <Progress value={sectionProgress} className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-8">
        {section.questions.map((question: Question) => {
          const response = responses[question.id] as
            | QuestionResponse
            | undefined;
          const error = validationErrors.get(question.id);

          return (
            <QuestionRendererV2
              key={question.id}
              question={question}
              value={response}
              onChange={(updatedResponse: QuestionResponse) =>
                onResponseChange(question.id, updatedResponse)
              }
              disabled={isSubmitted}
              validationError={error}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
