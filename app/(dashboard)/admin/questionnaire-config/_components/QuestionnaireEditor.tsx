"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ChevronRight,
  AlertCircle,
  Copy,
  Info,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types matching the questionnaire config structure
interface QuestionOption {
  value: string;
  label: string;
  hasTextInput?: boolean;
}

interface Question {
  id: string;
  type: string;
  text: string;
  required: boolean;
  hasImportance?: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  minAge?: number;
  maxAge?: number;
  maxSelections?: number;
  helpText?: string;
  rationale?: string;
  note?: string;
  // Scoring properties
  scoringMethod?:
    | "similarity"
    | "preference-match"
    | "ai-sentiment"
    | "range-overlap";
  linkedQuestionId?: string; // For "what I'm like" -> "what I look for" matching
}

interface Section {
  id: string;
  title: string;
  description?: string;
  questionsCount?: number;
  questions: Question[];
}

interface AgreementConfig {
  title: string;
  description: string;
  points: string[];
  commitments?: string[];
  reminder?: string;
  agreementText: string;
}

interface QuestionnaireConfig {
  agreement: AgreementConfig;
  sections: Section[];
}

const QUESTION_TYPES = [
  { value: "single-choice", label: "Single Choice (Radio)" },
  { value: "multi-choice", label: "Multiple Choice (Checkbox)" },
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text (Paragraph)" },
  { value: "ranking", label: "Ranking (Top 3)" },
  { value: "scale", label: "Scale (Slider)" },
  { value: "age-range", label: "Age Range" },
];

const SCORING_METHODS = [
  { value: "similarity", label: "Similarity - Match same answers" },
  {
    value: "preference-match",
    label: "Preference Match - Link to another question",
  },
  { value: "ai-sentiment", label: "AI Sentiment - Use embeddings for text" },
  { value: "range-overlap", label: "Range Overlap - For age/numeric ranges" },
];

export function QuestionnaireEditor() {
  const { toast } = useToast();
  const [config, setConfig] = useState<QuestionnaireConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<"sections" | "agreement">(
    "sections"
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/questionnaire-config");
      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);

      // Update questionsCount for each section
      const updatedConfig = {
        ...config,
        sections: config.sections.map((section) => ({
          ...section,
          questionsCount: section.questions.length,
        })),
      };

      const response = await fetch("/api/admin/questionnaire-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
        setHasChanges(false);
        setConfig(updatedConfig);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = useCallback(
    (updater: (prev: QuestionnaireConfig) => QuestionnaireConfig) => {
      setConfig((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        setHasChanges(true);
        return updated;
      });
    },
    []
  );

  // Find which section a question belongs to
  const findSectionByQuestionId = useCallback(
    (questionId: string): Section | undefined => {
      if (!config) return undefined;
      return config.sections.find((s) =>
        s.questions.some((q) => q.id === questionId)
      );
    },
    [config]
  );

  // Get the active question being dragged
  const activeQuestion = useMemo(() => {
    if (!activeId || !config) return null;
    for (const section of config.sections) {
      const question = section.questions.find((q) => q.id === activeId);
      if (question) return question;
    }
    return null;
  }, [activeId, config]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverSectionId(null);
      return;
    }

    // Check if hovering over a section droppable
    const overId = over.id.toString();
    if (overId.startsWith("section-droppable-")) {
      setOverSectionId(overId.replace("section-droppable-", ""));
    } else {
      // Check if hovering over a question - find its section
      const section = findSectionByQuestionId(overId);
      setOverSectionId(section?.id || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverSectionId(null);

    if (!over || !config) return;

    const activeQuestionId = active.id.toString();
    const overId = over.id.toString();

    // Find source section
    const sourceSection = findSectionByQuestionId(activeQuestionId);
    if (!sourceSection) return;

    // Determine target section
    let targetSectionId: string;
    let targetQuestionId: string | null = null;

    if (overId.startsWith("section-droppable-")) {
      // Dropped on section droppable area
      targetSectionId = overId.replace("section-droppable-", "");
    } else {
      // Dropped on another question
      const targetSection = findSectionByQuestionId(overId);
      if (!targetSection) return;
      targetSectionId = targetSection.id;
      targetQuestionId = overId;
    }

    // Moving within the same section
    if (sourceSection.id === targetSectionId) {
      const oldIndex = sourceSection.questions.findIndex(
        (q) => q.id === activeQuestionId
      );
      let newIndex: number;

      if (targetQuestionId) {
        newIndex = sourceSection.questions.findIndex(
          (q) => q.id === targetQuestionId
        );
      } else {
        // Dropped on section droppable - move to end
        newIndex = sourceSection.questions.length - 1;
      }

      if (oldIndex !== newIndex) {
        updateConfig((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sourceSection.id
              ? { ...s, questions: arrayMove(s.questions, oldIndex, newIndex) }
              : s
          ),
        }));
      }
    } else {
      // Moving to a different section
      const question = sourceSection.questions.find(
        (q) => q.id === activeQuestionId
      );
      if (!question) return;

      updateConfig((prev) => {
        const targetSection = prev.sections.find(
          (s) => s.id === targetSectionId
        );
        if (!targetSection) return prev;

        let insertIndex: number;
        if (targetQuestionId) {
          insertIndex = targetSection.questions.findIndex(
            (q) => q.id === targetQuestionId
          );
        } else {
          insertIndex = targetSection.questions.length;
        }

        return {
          ...prev,
          sections: prev.sections.map((s) => {
            if (s.id === sourceSection.id) {
              return {
                ...s,
                questions: s.questions.filter((q) => q.id !== activeQuestionId),
              };
            }
            if (s.id === targetSectionId) {
              const newQuestions = [...s.questions];
              newQuestions.splice(insertIndex, 0, question);
              return { ...s, questions: newQuestions };
            }
            return s;
          }),
        };
      });
    }
  };

  // Section operations
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  // Question operations
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const addQuestion = (sectionId: string) => {
    updateConfig((prev) => {
      const section = prev.sections.find((s) => s.id === sectionId);
      if (!section) return prev;

      const maxQNum = Math.max(
        ...prev.sections.flatMap((s) =>
          s.questions.map((q) => parseInt(q.id.replace("q", "")) || 0)
        ),
        0
      );

      const newQuestion: Question = {
        id: `q${maxQNum + 1}`,
        type: "single-choice",
        text: "New question",
        required: true,
        hasImportance: true,
        options: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ],
      };

      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? { ...s, questions: [...s.questions, newQuestion] }
            : s
        ),
      };
    });
  };

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    updates: Partial<Question>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : s
      ),
    }));
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      ),
    }));
  };

  const duplicateQuestion = (sectionId: string, questionId: string) => {
    updateConfig((prev) => {
      const section = prev.sections.find((s) => s.id === sectionId);
      if (!section) return prev;

      const question = section.questions.find((q) => q.id === questionId);
      if (!question) return prev;

      const maxQNum = Math.max(
        ...prev.sections.flatMap((s) =>
          s.questions.map((q) => parseInt(q.id.replace("q", "")) || 0)
        ),
        0
      );

      const newQuestion: Question = {
        ...question,
        id: `q${maxQNum + 1}`,
        text: `${question.text} (copy)`,
      };

      const idx = section.questions.findIndex((q) => q.id === questionId);

      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                questions: [
                  ...s.questions.slice(0, idx + 1),
                  newQuestion,
                  ...s.questions.slice(idx + 1),
                ],
              }
            : s
        ),
      };
    });
  };

  // Option operations
  const addOption = (sectionId: string, questionId: string) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== questionId) return q;
                const optionNum = (q.options?.length || 0) + 1;
                return {
                  ...q,
                  options: [
                    ...(q.options || []),
                    {
                      value: `option${optionNum}`,
                      label: `Option ${optionNum}`,
                    },
                  ],
                };
              }),
            }
          : s
      ),
    }));
  };

  const updateOption = (
    sectionId: string,
    questionId: string,
    optionIdx: number,
    updates: Partial<QuestionOption>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options?.map((opt, idx) =>
                        idx === optionIdx ? { ...opt, ...updates } : opt
                      ),
                    }
                  : q
              ),
            }
          : s
      ),
    }));
  };

  const deleteOption = (
    sectionId: string,
    questionId: string,
    optionIdx: number
  ) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options?.filter((_, idx) => idx !== optionIdx),
                    }
                  : q
              ),
            }
          : s
      ),
    }));
  };

  const moveOption = (
    sectionId: string,
    questionId: string,
    optionIdx: number,
    direction: "up" | "down"
  ) => {
    updateConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) => {
                if (q.id !== questionId || !q.options) return q;

                const newIdx =
                  direction === "up" ? optionIdx - 1 : optionIdx + 1;
                if (newIdx < 0 || newIdx >= q.options.length) return q;

                const newOptions = [...q.options];
                [newOptions[optionIdx], newOptions[newIdx]] = [
                  newOptions[newIdx],
                  newOptions[optionIdx],
                ];

                return { ...q, options: newOptions };
              }),
            }
          : s
      ),
    }));
  };

  // Agreement operations
  const updateAgreement = (updates: Partial<AgreementConfig>) => {
    updateConfig((prev) => ({
      ...prev,
      agreement: { ...prev.agreement, ...updates },
    }));
  };

  const addAgreementPoint = () => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        points: [...prev.agreement.points, "New point"],
      },
    }));
  };

  const updateAgreementPoint = (idx: number, value: string) => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        points: prev.agreement.points.map((p, i) => (i === idx ? value : p)),
      },
    }));
  };

  const deleteAgreementPoint = (idx: number) => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        points: prev.agreement.points.filter((_, i) => i !== idx),
      },
    }));
  };

  const addCommitment = () => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        commitments: [...(prev.agreement.commitments || []), "New commitment"],
      },
    }));
  };

  const updateCommitment = (idx: number, value: string) => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        commitments: prev.agreement.commitments?.map((c, i) =>
          i === idx ? value : c
        ),
      },
    }));
  };

  const deleteCommitment = (idx: number) => {
    updateConfig((prev) => ({
      ...prev,
      agreement: {
        ...prev.agreement,
        commitments: prev.agreement.commitments?.filter((_, i) => i !== idx),
      },
    }));
  };

  // Get all questions for linking
  const getAllQuestions = (): {
    id: string;
    text: string;
    sectionTitle: string;
  }[] => {
    if (!config) return [];
    return config.sections.flatMap((s) =>
      s.questions.map((q) => ({
        id: q.id,
        text: q.text,
        sectionTitle: s.title,
      }))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-slate-600">Failed to load configuration</p>
          <Button onClick={loadConfig}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            📝 Questionnaire Configuration
          </h1>
          <p className="text-sm text-slate-600">
            Edit questions, options, and scoring settings. Drag questions by the
            grip handle to reorder or move between sections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </span>
          )}
          <Button onClick={saveConfig} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "sections" ? "default" : "outline"}
          onClick={() => setActiveTab("sections")}
        >
          Questions & Sections
        </Button>
        <Button
          variant={activeTab === "agreement" ? "default" : "outline"}
          onClick={() => setActiveTab("agreement")}
        >
          Agreement Page
        </Button>
      </div>

      {/* Agreement Tab */}
      {activeTab === "agreement" && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-Questionnaire Agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={config.agreement.title}
                  onChange={(e) => updateAgreement({ title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={config.agreement.description}
                  onChange={(e) =>
                    updateAgreement({ description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Agreement Text (checkbox label)</Label>
                <Input
                  value={config.agreement.agreementText}
                  onChange={(e) =>
                    updateAgreement({ agreementText: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Reminder Message</Label>
                <Textarea
                  value={config.agreement.reminder || ""}
                  onChange={(e) =>
                    updateAgreement({ reminder: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Key Points</Label>
                <Button size="sm" variant="outline" onClick={addAgreementPoint}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Point
                </Button>
              </div>
              <div className="space-y-2">
                {config.agreement.points.map((point, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={(e) =>
                        updateAgreementPoint(idx, e.target.value)
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAgreementPoint(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Commitments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Commitments</Label>
                <Button size="sm" variant="outline" onClick={addCommitment}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Commitment
                </Button>
              </div>
              <div className="space-y-2">
                {config.agreement.commitments?.map((commitment, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={commitment}
                      onChange={(e) => updateCommitment(idx, e.target.value)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteCommitment(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {config.sections.map((section) => (
              <Card
                key={section.id}
                className={`overflow-hidden transition-colors ${
                  overSectionId === section.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
              >
                {/* Section Header */}
                <div
                  className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {section.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {section.id} • {section.questions.length} questions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(section.id) && (
                  <CardContent className="pt-4 space-y-4">
                    {/* Section Settings */}
                    <div className="grid gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Section Title</Label>
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              updateSection(section.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Section ID</Label>
                          <Input value={section.id} disabled />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={section.description || ""}
                          onChange={(e) =>
                            updateSection(section.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Questions with sortable context */}
                    <SortableContext
                      items={section.questions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className="space-y-3 min-h-[50px]"
                        id={`section-droppable-${section.id}`}
                      >
                        {section.questions.map((question) => (
                          <SortableQuestionEditor
                            key={question.id}
                            question={question}
                            sectionId={section.id}
                            isExpanded={expandedQuestions.has(question.id)}
                            onToggle={() => toggleQuestion(question.id)}
                            onUpdate={(updates) =>
                              updateQuestion(section.id, question.id, updates)
                            }
                            onDelete={() =>
                              deleteQuestion(section.id, question.id)
                            }
                            onDuplicate={() =>
                              duplicateQuestion(section.id, question.id)
                            }
                            onAddOption={() =>
                              addOption(section.id, question.id)
                            }
                            onUpdateOption={(idx, updates) =>
                              updateOption(
                                section.id,
                                question.id,
                                idx,
                                updates
                              )
                            }
                            onDeleteOption={(idx) =>
                              deleteOption(section.id, question.id, idx)
                            }
                            onMoveOption={(idx, direction) =>
                              moveOption(
                                section.id,
                                question.id,
                                idx,
                                direction
                              )
                            }
                            allQuestions={getAllQuestions()}
                          />
                        ))}
                        {section.questions.length === 0 && (
                          <div className="p-8 text-center text-slate-400 border-2 border-dashed rounded-lg">
                            Drag questions here or add a new one
                          </div>
                        )}
                      </div>
                    </SortableContext>

                    {/* Add Question Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addQuestion(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question to {section.title}
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeQuestion && (
              <div className="border rounded-lg overflow-hidden bg-white shadow-lg opacity-90">
                <div className="flex items-center gap-3 p-3 bg-primary/10">
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {activeQuestion.id}
                      </span>
                      <span className="text-xs text-slate-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        {activeQuestion.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate mt-1">
                      {activeQuestion.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// Sortable Question Editor Component
interface SortableQuestionEditorProps {
  question: Question;
  sectionId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddOption: () => void;
  onUpdateOption: (idx: number, updates: Partial<QuestionOption>) => void;
  onDeleteOption: (idx: number) => void;
  onMoveOption: (idx: number, direction: "up" | "down") => void;
  allQuestions: { id: string; text: string; sectionTitle: string }[];
}

function SortableQuestionEditor(props: SortableQuestionEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionEditorContent
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Question Editor Content
interface QuestionEditorContentProps extends SortableQuestionEditorProps {
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function QuestionEditorContent({
  question,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onMoveOption,
  allQuestions,
  dragHandleProps,
}: QuestionEditorContentProps) {
  const hasOptions =
    question.type === "single-choice" ||
    question.type === "multi-choice" ||
    question.type === "ranking";

  const isTextType = question.type === "text" || question.type === "textarea";
  const isScaleType = question.type === "scale";
  const isAgeRangeType = question.type === "age-range";

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Question Header */}
      <div className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
          </div>
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  {question.id}
                </span>
                <span className="text-xs text-slate-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  {question.type}
                </span>
                {question.required && (
                  <span className="text-xs text-red-500">*required</span>
                )}
                {question.hasImportance && (
                  <span className="text-xs text-purple-500">
                    has importance
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 truncate mt-1">
                {question.text}
              </p>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={onDuplicate}
            className="h-8 w-8"
            title="Duplicate question"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8"
            title="Delete question"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Question Content */}
      {isExpanded && (
        <div className="p-4 border-t bg-slate-50 space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Question ID</Label>
              <Input
                value={question.id}
                disabled
                className="bg-slate-100 text-slate-600"
                title="Question ID is read-only - used as database key for storing responses"
              />
              <p className="text-xs text-slate-500 mt-1">
                ID is read-only (database key)
              </p>
            </div>
            <div>
              <Label>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) => onUpdate({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Question Text</Label>
            <Textarea
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Help Text (optional)</Label>
              <Input
                value={question.helpText || ""}
                onChange={(e) =>
                  onUpdate({ helpText: e.target.value || undefined })
                }
                placeholder="Additional context for the user"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input
                value={question.note || ""}
                onChange={(e) =>
                  onUpdate({ note: e.target.value || undefined })
                }
                placeholder="Visible note under the question"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-required`}
                checked={question.required}
                onCheckedChange={(checked) => onUpdate({ required: !!checked })}
              />
              <Label htmlFor={`${question.id}-required`} className="text-sm">
                Required
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-importance`}
                checked={question.hasImportance}
                onCheckedChange={(checked) =>
                  onUpdate({ hasImportance: !!checked })
                }
              />
              <Label htmlFor={`${question.id}-importance`} className="text-sm">
                Has Importance Rating
              </Label>
            </div>
          </div>

          {/* Scoring Settings */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3">
              🎯 Scoring & Matching Settings
            </h4>
            <div className="grid gap-4">
              <div>
                <Label>Rationale (internal note for matching logic)</Label>
                <Input
                  value={question.rationale || ""}
                  onChange={(e) =>
                    onUpdate({ rationale: e.target.value || undefined })
                  }
                  placeholder="Why this question matters for matching"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scoring Method</Label>
                  <Select
                    value={question.scoringMethod || "similarity"}
                    onValueChange={(value) =>
                      onUpdate({
                        scoringMethod: value as Question["scoringMethod"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORING_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {question.scoringMethod === "preference-match" && (
                  <div>
                    <Label>
                      Linked Question (What I&apos;m Like → What I Look For)
                    </Label>
                    <Select
                      value={question.linkedQuestionId || ""}
                      onValueChange={(value) =>
                        onUpdate({ linkedQuestionId: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {allQuestions
                          .filter((q) => q.id !== question.id)
                          .map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              {q.id}: {q.text.substring(0, 50)}...
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Type-specific settings */}
          {isTextType && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={question.placeholder || ""}
                  onChange={(e) =>
                    onUpdate({ placeholder: e.target.value || undefined })
                  }
                />
              </div>
              <div>
                <Label>Min Length</Label>
                <Input
                  type="number"
                  value={question.minLength || ""}
                  onChange={(e) =>
                    onUpdate({
                      minLength: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Max Length</Label>
                <Input
                  type="number"
                  value={question.maxLength || ""}
                  onChange={(e) =>
                    onUpdate({
                      maxLength: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>
          )}

          {isScaleType && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={question.min || ""}
                  onChange={(e) =>
                    onUpdate({ min: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={question.max || ""}
                  onChange={(e) =>
                    onUpdate({ max: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <Label>Step</Label>
                <Input
                  type="number"
                  value={question.step || ""}
                  onChange={(e) =>
                    onUpdate({ step: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
            </div>
          )}

          {isAgeRangeType && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Age</Label>
                <Input
                  type="number"
                  value={question.minAge || ""}
                  onChange={(e) =>
                    onUpdate({ minAge: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
              <div>
                <Label>Max Age</Label>
                <Input
                  type="number"
                  value={question.maxAge || ""}
                  onChange={(e) =>
                    onUpdate({ maxAge: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
            </div>
          )}

          {question.type === "multi-choice" && (
            <div>
              <Label>Max Selections</Label>
              <Input
                type="number"
                value={question.maxSelections || ""}
                onChange={(e) =>
                  onUpdate({
                    maxSelections: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Leave empty for unlimited"
                className="w-48"
              />
            </div>
          )}

          {/* Options */}
          {hasOptions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Options</Label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <p className="font-semibold mb-1">
                        ⚠️ About Option Values
                      </p>
                      <p>
                        The <strong>Value</strong> field is the database key
                        stored when users select this option. Changing it will
                        break matching for users who already selected the old
                        value. Only change values before any responses are
                        collected.
                      </p>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={onAddOption}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                <AlertCircle className="h-3 w-3" />
                Value = database key (don&apos;t change after responses
                collected) • Label = displayed text
              </div>
              <div className="space-y-2">
                {question.options?.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className="flex items-center gap-2 p-2 bg-white rounded border"
                  >
                    <GripVertical className="h-4 w-4 text-slate-400" />
                    <Input
                      value={option.value}
                      onChange={(e) =>
                        onUpdateOption(optIdx, { value: e.target.value })
                      }
                      placeholder="value"
                      className="w-32 font-mono text-xs"
                      title="Database key - don't change after responses collected"
                    />
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        onUpdateOption(optIdx, { label: e.target.value })
                      }
                      placeholder="Label shown to users"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${question.id}-opt-${optIdx}-text`}
                        checked={option.hasTextInput}
                        onCheckedChange={(checked) =>
                          onUpdateOption(optIdx, {
                            hasTextInput: !!checked || undefined,
                          })
                        }
                      />
                      <Label
                        htmlFor={`${question.id}-opt-${optIdx}-text`}
                        className="text-xs whitespace-nowrap"
                      >
                        Text input
                      </Label>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMoveOption(optIdx, "up")}
                      disabled={optIdx === 0}
                      className="h-8 w-8"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMoveOption(optIdx, "down")}
                      disabled={optIdx === (question.options?.length || 0) - 1}
                      className="h-8 w-8"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDeleteOption(optIdx)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
