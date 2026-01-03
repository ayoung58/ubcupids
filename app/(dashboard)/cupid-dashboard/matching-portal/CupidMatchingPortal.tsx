"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Heart,
  AlertCircle,
  Target,
  Eye,
  EyeOff,
  X,
  XCircle,
  Plus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import questionnaireConfig from "@/src/data/questionnaire-config.json";
import type {
  Responses,
  ImportanceRatings,
} from "@/src/lib/questionnaire-types";

// Types
interface CupidProfileView {
  userId: string;
  firstName: string;
  age: number;
  summary: string;
  keyTraits: string[];
  lookingFor: string;
  highlights: string[];
  bio?: string | null;
  interests?: string | null;
  major?: string | null;
  profilePicture?: string | null;
}

interface PotentialMatch {
  userId: string;
  score: number;
  profile: CupidProfileView;
}

interface CupidCandidateAssignment {
  assignmentId: string;
  cupidUserId: string;
  candidate: CupidProfileView;
  potentialMatches: PotentialMatch[];
  selectedMatchId: string | null;
  selectionReason: string | null;
}

interface CupidDashboard {
  cupidId: string;
  cupidName: string;
  totalAssigned: number;
  reviewed: number;
  pending: number;
  pendingAssignments: CupidCandidateAssignment[];
}

export function CupidMatchingPortal() {
  const [dashboard, setDashboard] = useState<CupidDashboard | null>(null);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [candidateResponses, setCandidateResponses] =
    useState<Responses | null>(null);
  const [candidateImportance, setCandidateImportance] =
    useState<ImportanceRatings | null>(null);
  const [matchResponses, setMatchResponses] = useState<Responses | null>(null);
  const [matchImportance, setMatchImportance] =
    useState<ImportanceRatings | null>(null);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [candidateTab, setCandidateTab] = useState<"profile" | "questionnaire">(
    "profile"
  );
  const [matchTab, setMatchTab] = useState<"profile" | "questionnaire">(
    "profile"
  );
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [rejectedMatches, setRejectedMatches] = useState<Set<string>>(
    new Set()
  );
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [matchToReject, setMatchToReject] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/cupid/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError("Failed to load assignments. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (currentAssignment) {
        await loadQuestionnaireData();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAssignmentIndex, currentMatchIndex, dashboard]);

  const loadQuestionnaireData = async () => {
    if (!currentAssignment) return;

    setLoadingQuestionnaires(true);
    try {
      // Load candidate questionnaire
      const candidateRes = await fetch(
        `/api/questionnaire/view?userId=${currentAssignment.candidate.userId}`
      );
      if (candidateRes.ok) {
        const candidateData = await candidateRes.json();
        setCandidateResponses(candidateData.responses);
        setCandidateImportance(candidateData.importance);
      } else {
        console.error(
          `Failed to load candidate questionnaire: ${candidateRes.status}`,
          await candidateRes.text()
        );
        setCandidateResponses(null);
        setCandidateImportance(null);
      }

      // Load match questionnaire
      const currentMatch =
        currentAssignment.potentialMatches[currentMatchIndex];
      if (currentMatch) {
        const matchRes = await fetch(
          `/api/questionnaire/view?userId=${currentMatch.userId}`
        );
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatchResponses(matchData.responses);
          setMatchImportance(matchData.importance);
        } else {
          console.error(
            `Failed to load match questionnaire for ${currentMatch.userId}: ${matchRes.status}`,
            await matchRes.text()
          );
          setMatchResponses(null);
          setMatchImportance(null);
        }
      }
    } catch (err) {
      console.error("Error loading questionnaire data:", err);
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  const submitSelection = async () => {
    if (!dashboard || !currentAssignment || !selectedMatchId) return;

    // Validate rationale is provided
    if (!reason || reason.trim().length === 0) {
      setRationaleError(
        "Please provide brief rationale for your match! Your match will be able to see this, and they'd appreciate it!"
      );
      return;
    }

    setRationaleError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cupid/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: currentAssignment.assignmentId,
          selectedMatchId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit selection");
      }

      setDashboard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pendingAssignments: prev.pendingAssignments.filter(
            (a) => a.assignmentId !== currentAssignment.assignmentId
          ),
          reviewed: prev.reviewed + 1,
          pending: prev.pending - 1,
        };
      });

      setSelectedMatchId(null);
      setReason("");
      setCurrentMatchIndex(0);

      if (currentAssignmentIndex >= dashboard.pendingAssignments.length - 1) {
        setCurrentAssignmentIndex(Math.max(0, currentAssignmentIndex - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateMatch = (direction: "prev" | "next") => {
    if (!currentAssignment) return;

    const visibleCount = visibleMatches.length;
    if (direction === "prev" && currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    } else if (direction === "next" && currentMatchIndex < visibleCount - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const handleRejectMatch = async () => {
    if (!matchToReject || !currentAssignment) return;

    // Mark as rejected
    setRejectedMatches((prev) => new Set(prev).add(matchToReject));
    setShowRejectDialog(false);
    setMatchToReject(null);

    // If this was the selected match, deselect it
    if (selectedMatchId === matchToReject) {
      setSelectedMatchId(null);
    }

    // Navigate to next non-rejected match, or loop to beginning
    const visibleMatches = currentAssignment.potentialMatches.filter(
      (m) => !rejectedMatches.has(m.userId) && m.userId !== matchToReject
    );

    if (visibleMatches.length === 0) {
      // All matches rejected - stay on current but show empty state
      return;
    }

    // Find next match that isn't rejected
    let nextIndex = currentMatchIndex + 1;
    while (nextIndex < currentAssignment.potentialMatches.length) {
      const match = currentAssignment.potentialMatches[nextIndex];
      if (
        !rejectedMatches.has(match.userId) &&
        match.userId !== matchToReject
      ) {
        setCurrentMatchIndex(nextIndex);
        return;
      }
      nextIndex++;
    }

    // If no next match, go to first non-rejected match
    for (let i = 0; i < currentAssignment.potentialMatches.length; i++) {
      const match = currentAssignment.potentialMatches[i];
      if (
        !rejectedMatches.has(match.userId) &&
        match.userId !== matchToReject
      ) {
        setCurrentMatchIndex(i);
        return;
      }
    }
  };

  const handleLoadMoreMatches = async () => {
    if (!currentAssignment || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch("/api/cupid/load-more", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: currentAssignment.assignmentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load more matches");
      }

      const data = await res.json();

      // Update the current assignment with new matches
      setDashboard((prev) => {
        if (!prev) return null;
        const updatedAssignments = prev.pendingAssignments.map((assignment) => {
          if (assignment.assignmentId === currentAssignment.assignmentId) {
            return {
              ...assignment,
              potentialMatches: data.potentialMatches,
            };
          }
          return assignment;
        });
        return {
          ...prev,
          pendingAssignments: updatedAssignments,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more matches"
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const currentAssignment =
    dashboard?.pendingAssignments[currentAssignmentIndex];

  // Filter out rejected matches
  const visibleMatches =
    currentAssignment?.potentialMatches.filter(
      (m) => !rejectedMatches.has(m.userId)
    ) || [];

  const currentMatch = visibleMatches[currentMatchIndex];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-700">{error}</h2>
              <Button onClick={fetchDashboard} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboard || dashboard.pendingAssignments.length === 0) {
    const isAllDone = dashboard && dashboard.reviewed > 0;

    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton />
          <StatsHeader dashboard={dashboard} />
          {isAllDone ? (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-700">All Done!</h2>
                <p className="text-green-600 mt-2">
                  You&apos;ve reviewed all assigned candidates. Great work,
                  Cupid! 💘
                </p>
                <Link href="/cupid-dashboard">
                  <Button className="mt-6">Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold text-blue-700">
                  Candidates Are Filling Out Questionnaires
                </h2>
                <p className="text-blue-600 mt-2">
                  Cupids will receive assignments on January 31st! Stay tuned
                  till then! ⏳
                </p>
                <Link href="/cupid-dashboard">
                  <Button className="mt-6">Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-[1800px] mx-auto space-y-4">
        <BackButton />

        {/* Collapsible Info Panel */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {!isInfoCollapsed && (
            <div className="space-y-0">
              <StatsHeader dashboard={dashboard} />

              {/* Candidate Navigation */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentAssignmentIndex((i) => Math.max(0, i - 1))
                  }
                  disabled={currentAssignmentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Candidate
                </Button>
                <span className="text-slate-700 font-semibold">
                  Candidate {currentAssignmentIndex + 1} of{" "}
                  {dashboard.pendingAssignments.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentAssignmentIndex((i) =>
                      Math.min(dashboard.pendingAssignments.length - 1, i + 1)
                    )
                  }
                  disabled={
                    currentAssignmentIndex ===
                    dashboard.pendingAssignments.length - 1
                  }
                >
                  Next Candidate
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Confirm Selection Area */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-t border-pink-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {selectedMatchId ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">
                          Match selected:{" "}
                          {
                            currentAssignment?.potentialMatches.find(
                              (m) => m.userId === selectedMatchId
                            )?.profile.firstName
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMatchId(null)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Undo
                        </Button>
                      </div>
                    ) : (
                      <span className="text-slate-600">
                        Select a match from the right panel to continue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScores(!showScores)}
                      className="flex items-center gap-2"
                    >
                      {showScores ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {showScores ? "Hide" : "Show"} Compatibility Score
                    </Button>
                    {currentAssignment &&
                      currentAssignment.potentialMatches.length < 25 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMoreMatches}
                          disabled={isLoadingMore}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {isLoadingMore
                            ? "Loading..."
                            : `Generate 5 More (limit: 25 total users)`}
                        </Button>
                      )}
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!selectedMatchId || isSubmitting}
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Confirm Selection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed state - minimal header */}
          {isInfoCollapsed && (
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Candidate {currentAssignmentIndex + 1} of{" "}
                {dashboard.pendingAssignments.length}
                {selectedMatchId && (
                  <span className="ml-2 text-green-600">• Match selected</span>
                )}
              </span>
            </div>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
            className="w-full py-2 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-200"
            aria-label={
              isInfoCollapsed ? "Expand info panel" : "Collapse info panel"
            }
          >
            {isInfoCollapsed ? (
              <ChevronDown className="h-5 w-5 text-slate-600" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Split Screen */}
        {currentAssignment && visibleMatches.length === 0 && (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              No More Matches Available
            </h3>
            <p className="text-slate-600 mt-2">
              You&apos;ve rejected all potential matches for this candidate.
              {currentAssignment.potentialMatches.length < 25 && (
                <span>
                  {" "}
                  Try loading more matches or move to the next candidate.
                </span>
              )}
            </p>
          </Card>
        )}
        {currentAssignment && currentMatch && (
          <div
            className={`grid grid-cols-2 gap-3 ${isInfoCollapsed ? "h-[calc(100vh-140px)]" : "h-[calc(100vh-380px)]"}`}
          >
            {/* Left: Candidate */}
            <Card className="border-2 border-blue-400 overflow-hidden flex flex-col">
              <CardHeader className="bg-blue-50 border-b border-blue-200 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                  Your Candidate: {currentAssignment.candidate.firstName},{" "}
                  {currentAssignment.candidate.age}
                </CardTitle>
                {/* Tabs */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={candidateTab === "profile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCandidateTab("profile")}
                    className="flex-1"
                  >
                    Profile Info
                  </Button>
                  <Button
                    variant={
                      candidateTab === "questionnaire" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setCandidateTab("questionnaire")}
                    className="flex-1"
                  >
                    Questionnaire
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {candidateTab === "profile" ? (
                  <ProfileDisplay profile={currentAssignment.candidate} />
                ) : loadingQuestionnaires ? (
                  <LoadingQuestionnairesSkeleton />
                ) : (
                  <QuestionnaireDisplay
                    responses={candidateResponses}
                    importance={candidateImportance}
                  />
                )}
              </CardContent>
            </Card>

            {/* Right: Potential Match */}
            <Card
              className={`overflow-hidden flex flex-col border-2 ${
                selectedMatchId === currentMatch.userId
                  ? "border-pink-500 bg-pink-50"
                  : "border-slate-300"
              }`}
            >
              <CardHeader
                className={`border-b flex-shrink-0 ${
                  selectedMatchId === currentMatch.userId
                    ? "bg-pink-100 border-pink-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-600">
                        Match {currentMatchIndex + 1} of {visibleMatches.length}
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {currentMatch.profile.firstName},{" "}
                        {currentMatch.profile.age}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {showScores && (
                      <span className="text-sm font-medium text-pink-600 mr-2">
                        {currentMatch.score.toFixed(1)}%
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMatch("prev")}
                      disabled={currentMatchIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMatch("next")}
                      disabled={currentMatchIndex === visibleMatches.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {selectedMatchId === currentMatch.userId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-pink-500 text-pink-700 bg-pink-100 hover:bg-pink-200"
                        onClick={() => setSelectedMatchId(null)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setMatchToReject(currentMatch.userId);
                            setShowRejectDialog(true);
                          }}
                          disabled={selectedMatchId !== null}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Not a Match
                        </Button>
                        <Button
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600 text-white"
                          onClick={() =>
                            setSelectedMatchId(currentMatch.userId)
                          }
                          disabled={selectedMatchId !== null}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Select
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={matchTab === "profile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMatchTab("profile")}
                    className="flex-1"
                  >
                    Profile Info
                  </Button>
                  <Button
                    variant={
                      matchTab === "questionnaire" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setMatchTab("questionnaire")}
                    className="flex-1"
                  >
                    Questionnaire
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {matchTab === "profile" ? (
                  <ProfileDisplay profile={currentMatch.profile} />
                ) : loadingQuestionnaires ? (
                  <LoadingQuestionnairesSkeleton />
                ) : (
                  <QuestionnaireDisplay
                    responses={matchResponses}
                    importance={matchImportance}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Match Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to select{" "}
              <strong>
                {
                  currentAssignment?.potentialMatches.find(
                    (m) => m.userId === selectedMatchId
                  )?.profile.firstName
                }
              </strong>{" "}
              as the match for{" "}
              <strong>{currentAssignment?.candidate.firstName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label
              htmlFor="dialog-reason"
              className="text-sm font-medium text-red-600"
            >
              Rationale (Required):
            </Label>
            <Textarea
              id="dialog-reason"
              placeholder="Why is this the best match? (required)"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (rationaleError) setRationaleError(null);
              }}
              className={`mt-2 min-h-[100px] ${rationaleError ? "border-red-500" : ""}`}
            />
            {rationaleError && (
              <p className="text-sm text-red-600 mt-2">{rationaleError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirmDialog(false);
                setRationaleError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                submitSelection();
              }}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              disabled={isSubmitting || !reason || reason.trim().length === 0}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove This Candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove{" "}
              <strong>
                {
                  currentAssignment?.potentialMatches.find(
                    (m) => m.userId === matchToReject
                  )?.profile.firstName
                }
              </strong>{" "}
              as a potential match for your candidate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRejectDialog(false);
                setMatchToReject(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectMatch}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackButton() {
  return (
    <Link href="/cupid-dashboard">
      <Button variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
    </Link>
  );
}

function StatsHeader({ dashboard }: { dashboard: CupidDashboard | null }) {
  if (!dashboard) return null;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          🎯 Matching Portal
        </h1>
        <p className="text-slate-600">
          Welcome, {dashboard.cupidName}! Select the best match for each
          candidate.
        </p>
      </div>
      <div className="flex gap-3 text-sm">
        <div className="bg-slate-50 px-3 py-2 rounded-lg">
          <span className="text-slate-500">Pending: </span>
          <span className="font-bold text-orange-600">{dashboard.pending}</span>
        </div>
        <div className="bg-slate-50 px-3 py-2 rounded-lg">
          <span className="text-slate-500">Reviewed: </span>
          <span className="font-bold text-green-600">{dashboard.reviewed}</span>
        </div>
      </div>
    </div>
  );
}

function ProfileDisplay({ profile }: { profile: CupidProfileView }) {
  return (
    <div className="p-6 space-y-6">
      {/* Profile Picture */}
      {profile.profilePicture && (
        <div className="flex justify-center">
          <img
            src={profile.profilePicture}
            alt={profile.firstName}
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
          />
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-lg text-slate-900">
          {profile.firstName}, {profile.age}
        </h3>
        {profile.major && (
          <p className="text-sm text-slate-600">📚 {profile.major}</p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <span>✍️</span>
            About Me
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Interests */}
      {profile.interests && (
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <span>🎯</span>
            Interests & Hobbies
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {profile.interests}
          </p>
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
        <h4 className="font-semibold text-blue-900 flex items-center gap-2">
          <span>🤖</span>
          AI-Generated Summary
        </h4>
        <p className="text-sm text-blue-800">{profile.summary}</p>

        {profile.keyTraits && profile.keyTraits.length > 0 && (
          <div>
            <p className="text-xs font-medium text-blue-700 mb-2">
              Key Traits:
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.keyTraits.map((trait, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.lookingFor && (
          <div>
            <p className="text-xs font-medium text-blue-700 mb-1">
              Looking For:
            </p>
            <p className="text-sm text-blue-800">{profile.lookingFor}</p>
          </div>
        )}
      </div>

      {/* Question Highlights */}
      {profile.highlights && profile.highlights.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">Key Responses</h4>
          {profile.highlights.map((highlight: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-lg space-y-1">
              <p className="text-xs font-medium text-slate-600">
                {highlight.question}
              </p>
              <p className="text-sm text-slate-900">{highlight.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionnaireDisplay({
  responses,
  importance,
}: {
  responses: Responses | null;
  importance: ImportanceRatings | null;
}) {
  if (!responses) {
    return (
      <div className="text-center text-slate-500">
        No questionnaire data available
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {questionnaireConfig.sections.map((section) => (
        <div key={section.id} className="space-y-0">
          <div className="sticky top-0 bg-white border-b border-slate-200 py-3 px-4 z-10">
            <h3 className="font-bold text-slate-800">{section.title}</h3>
          </div>
          <div className="px-4 py-4 space-y-4">
            {section.questions.map((question) => {
              const response =
                responses[question.id] || responses[question.id.toUpperCase()];
              const importanceValue =
                importance?.[question.id] ||
                importance?.[question.id.toUpperCase()];

              if (!response) return null;

              return (
                <div
                  key={question.id}
                  className="bg-slate-50 p-3 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">
                      {question.text}
                    </p>
                    {question.hasImportance && importanceValue && (
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded whitespace-nowrap">
                        Importance: {importanceValue}/5
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-900">
                    {formatResponse(response)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatResponse(
  response:
    | string
    | string[]
    | number
    | { value: string; text: string }
    | { minAge: number; maxAge: number }
    | undefined
): string {
  if (response === undefined || response === null) return "No answer";
  if (Array.isArray(response)) {
    return response.join(", ");
  }
  if (typeof response === "object" && response !== null) {
    if ("minAge" in response && "maxAge" in response) {
      return `${response.minAge} - ${response.maxAge} years old`;
    }
    return JSON.stringify(response);
  }
  return String(response);
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    </div>
  );
}

function LoadingQuestionnairesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
