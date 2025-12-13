"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { AgreementConfig } from "@/src/lib/questionnaire-types";
import { Card, CardContent } from "@/components/ui/card";

interface InfoPanelProps {
  agreement: AgreementConfig;
}

export function InfoPanel({ agreement }: InfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group"
          aria-expanded={isExpanded}
          aria-controls="info-panel-content"
        >
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="font-medium text-blue-900">
              {isExpanded
                ? "Hide Questionnaire Info"
                : "Show Questionnaire Info"}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div
            id="info-panel-content"
            className="mt-4 space-y-4 text-sm text-slate-700 animate-in slide-in-from-top-2 duration-200"
          >
            {/* Key Points */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                📋 Key Information
              </h3>
              <ul className="space-y-1.5 list-disc list-inside">
                {agreement.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Commitments */}
            {agreement.commitments && agreement.commitments.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  🤝 Your Commitments
                </h3>
                <ul className="space-y-1.5 list-disc list-inside">
                  {agreement.commitments.map((commitment, idx) => (
                    <li key={idx}>{commitment}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reminder */}
            {agreement.reminder && (
              <div className="bg-pink-50 border border-pink-200 rounded-md p-3">
                <p className="text-pink-900 italic">{agreement.reminder}</p>
              </div>
            )}

            {/* Importance Explainer */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <h3 className="font-semibold text-slate-900 mb-2">
                ⭐ About Importance Ratings
              </h3>
              <p className="mb-2">
                Most personality and preference questions have an importance
                selector. This helps emphasize certain questions over others in
                matching.
              </p>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>
                  <strong>Not Important</strong> - Minimal impact on matching
                </li>
                <li>
                  <strong>Somewhat Important</strong> - Lower priority
                </li>
                <li>
                  <strong>Important</strong> (default) - Standard weight for
                  matching
                </li>
                <li>
                  <strong>Very Important</strong> - Higher priority in matching
                </li>
                <li>
                  <strong>Deal Breaker</strong> - Must match with your partner
                </li>
              </ul>
              <p className="mt-2 text-xs text-slate-600">
                💡 You don&apos;t need to adjust every question - only change
                importance for questions that really matter to you. Leaving
                everything as &quot;Important&quot; means all questions are
                equally weighted.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
