/**
 * QuestionnaireV2Display Component
 *
 * Displays V2 questionnaire responses for cupid review
 * - Split-screen format (answer + preference + importance)
 * - Collapsible sections for Section 1 (Lifestyle) and Section 2 (Personality)
 * - Separate tab for free response questions
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, X } from "lucide-react";
import {
  ALL_QUESTIONS,
  FREE_RESPONSE_QUESTIONS,
} from "@/lib/questionnaire/v2/config";
import { Section } from "@/types/questionnaire-v2";

interface QuestionnaireV2DisplayProps {
  responses: any; // V2 responses object
  showFreeResponse?: boolean; // Whether to show free response (based on user preference)
  section1Collapsed?: boolean;
  setSection1Collapsed?: (collapsed: boolean) => void;
  section2Collapsed?: boolean;
  setSection2Collapsed?: (collapsed: boolean) => void;
}

export function QuestionnaireV2Display({
  responses,
  showFreeResponse = true,
  section1Collapsed: section1CollapsedProp,
  setSection1Collapsed: setSection1CollapsedProp,
  section2Collapsed: section2CollapsedProp,
  setSection2Collapsed: setSection2CollapsedProp,
}: QuestionnaireV2DisplayProps) {
  // Use local state as fallback if props not provided
  const [localSection1Collapsed, setLocalSection1Collapsed] = useState(true);
  const [localSection2Collapsed, setLocalSection2Collapsed] = useState(true);

  // Use controlled state if provided, otherwise use local state
  const section1Collapsed = section1CollapsedProp ?? localSection1Collapsed;
  const setSection1Collapsed =
    setSection1CollapsedProp ?? setLocalSection1Collapsed;
  const section2Collapsed = section2CollapsedProp ?? localSection2Collapsed;
  const setSection2Collapsed =
    setSection2CollapsedProp ?? setLocalSection2Collapsed;

  if (!responses) {
    return (
      <div className="p-6 text-center text-slate-500">
        No questionnaire data available
      </div>
    );
  }

  const section1Questions = ALL_QUESTIONS.filter(
    (q) => q.section === Section.SECTION_1,
  );
  const section2Questions = ALL_QUESTIONS.filter(
    (q) => q.section === Section.SECTION_2,
  );

  return (
    <div className="divide-y divide-slate-200">
      {/* Section 1: Lifestyle */}
      <div className="pb-4">
        <button
          onClick={() => setSection1Collapsed(!section1Collapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              Section 1: Lifestyle / Surface Compatibility
            </span>
            <span className="text-sm text-slate-500">
              ({section1Questions.length} questions)
            </span>
          </div>
          {section1Collapsed ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {!section1Collapsed && (
          <div className="px-4 space-y-4">
            {section1Questions.map((question) => (
              <QuestionResponseDisplay
                key={question.id}
                question={question}
                response={responses[question.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Personality */}
      <div className="pt-4">
        <button
          onClick={() => setSection2Collapsed(!section2Collapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              Section 2: Personality / Interaction Style
            </span>
            <span className="text-sm text-slate-500">
              ({section2Questions.length} questions)
            </span>
          </div>
          {section2Collapsed ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {!section2Collapsed && (
          <div className="px-4 space-y-4 pb-4">
            {section2Questions.map((question) => (
              <QuestionResponseDisplay
                key={question.id}
                question={question}
                response={responses[question.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionResponseDisplayProps {
  question: any;
  response: any;
}

function QuestionResponseDisplay({
  question,
  response,
}: QuestionResponseDisplayProps) {
  if (!response) {
    return null;
  }

  const { answer, preference, importance, dealbreaker } = response;

  // Format answer for display
  const formatAnswer = (value: any): string => {
    if (value === undefined || value === null) return "Not answered";
    if (Array.isArray(value)) {
      if (value.length === 0) return "None selected";
      return value.join(", ");
    }
    if (typeof value === "object") {
      if ("minAge" in value && "maxAge" in value) {
        return `${value.minAge} - ${value.maxAge} years`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Format preference for display (handles age range objects)
  const formatPreference = (value: any): string => {
    if (value === undefined || value === null) return "No preference";
    if (typeof value === "object" && "minAge" in value && "maxAge" in value) {
      return `${value.minAge} - ${value.maxAge} years`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "No preference";
      return value.join(", ");
    }
    return String(value);
  };

  // Get likert scale label if question has likert config
  const getLikertLabel = (): string => {
    if (
      question.likertConfig &&
      question.likertConfig.minLabel &&
      question.likertConfig.maxLabel
    ) {
      return ` (${question.likertConfig.min} - ${question.likertConfig.minLabel}; ${question.likertConfig.max} - ${question.likertConfig.maxLabel})`;
    }
    return "";
  };

  // Get importance badge
  const getImportanceBadge = () => {
    if (dealbreaker) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          <AlertCircle className="h-3 w-3" />
          Dealbreaker
        </span>
      );
    }

    if (!importance) return null;

    const importanceColors: Record<string, string> = {
      NOT_IMPORTANT: "bg-slate-100 text-slate-600 border-slate-200",
      SOMEWHAT_IMPORTANT: "bg-blue-100 text-blue-700 border-blue-200",
      IMPORTANT: "bg-purple-100 text-purple-700 border-purple-200",
      VERY_IMPORTANT: "bg-pink-100 text-pink-700 border-pink-200",
    };

    const importanceLabels: Record<string, string> = {
      NOT_IMPORTANT: "Not Important",
      SOMEWHAT_IMPORTANT: "Somewhat Important",
      IMPORTANT: "Important",
      VERY_IMPORTANT: "Very Important",
    };

    const colorClass =
      importanceColors[importance] || importanceColors.SOMEWHAT_IMPORTANT;
    const label = importanceLabels[importance] || importance;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  // Check if preference is "doesn't matter" or null
  const isNoPreference =
    preference === null ||
    preference === undefined ||
    preference === "doesnt_matter" ||
    (Array.isArray(preference) && preference.length === 0);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="mb-2">
        <p className="text-sm font-medium text-slate-700">
          {question.questionText}
          {getLikertLabel()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: User's Answer */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Their Answer
          </p>
          <p className="text-sm text-slate-900">{formatAnswer(answer)}</p>
        </div>

        {/* Right: User's Preference + Importance */}
        <div className="space-y-2 md:border-l md:pl-4 border-slate-200">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase">
              What They're Looking For
            </p>
            {isNoPreference ? (
              <p className="text-sm text-slate-400 italic flex items-center gap-1">
                <X className="h-3 w-3" />
                Doesn't matter / No preference
              </p>
            ) : (
              <p className="text-sm text-slate-900">
                {formatPreference(preference)}
              </p>
            )}
          </div>

          {/* Importance Badge */}
          <div>{getImportanceBadge()}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Free Response Display Component
 */
export function FreeResponseDisplay({
  responses,
  showFreeResponse,
}: {
  responses: any;
  showFreeResponse: boolean;
}) {
  if (!responses) {
    return (
      <div className="p-6 text-center text-slate-500">
        No free response data available
      </div>
    );
  }

  if (!showFreeResponse) {
    return (
      <div className="p-6 text-center text-slate-500 space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto text-slate-400" />
        <p>This user has chosen not to share their free response answers.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {FREE_RESPONSE_QUESTIONS.map((question) => {
        const response = responses[question.id];

        if (!response) return null;

        return (
          <div
            key={question.id}
            className="border border-slate-200 rounded-lg p-4 bg-white"
          >
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-700">
                {question.questionText}
              </p>
              {!question.required && (
                <span className="text-xs text-slate-500 italic">Optional</span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-sm text-slate-900 whitespace-pre-wrap">
                {response || (
                  <span className="text-slate-400 italic">Not answered</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
