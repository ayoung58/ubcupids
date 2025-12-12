"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export function ProgressBar({
  value,
  totalQuestions,
  answeredQuestions,
}: ProgressBarProps) {
  return (
    <div className="sticky top-0 bg-white z-10 py-4 border-b shadow-sm">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Your Progress
          </span>
          <span className="text-sm text-gray-600">
            {answeredQuestions} of {totalQuestions} questions answered
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Progress value={value} className="h-2.5 flex-1" />
          <span className="text-sm font-bold text-primary min-w-[45px] text-right">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
}
