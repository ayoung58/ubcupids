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
  X,
  XCircle,
  Plus,
  FileText,
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
import {
  QuestionnaireV2Display,
  FreeResponseDisplay,
} from "@/components/cupid/QuestionnaireV2Display";
import { CupidPortalTutorial } from "./CupidPortalTutorial";
import type {
  Responses,
  ImportanceRatings,
} from "@/src/lib/questionnaire-types";
import { ALL_QUESTIONS } from "@/lib/questionnaire/v2/config";

/**
 * CupidMatchingPortal Component
 *
 * Allows cupids to review candidate profiles and select matches from potential matches.
 * Updated to use V2 questionnaire display with collapsible sections and free response tab.
 */

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
  rejectedMatches: string[];
  revealedCount: number;
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

interface CupidMatchingPortalProps {
  cupidPortalTutorialCompleted?: boolean;
}

export function CupidMatchingPortal({
  cupidPortalTutorialCompleted = false,
}: CupidMatchingPortalProps) {
  const [dashboard, setDashboard] = useState<CupidDashboard | null>(null);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // V2 Questionnaire State
  const [candidateResponses, setCandidateResponses] = useState<any | null>(
    null,
  );
  const [candidateFreeResponses, setCandidateFreeResponses] = useState<
    any | null
  >(null);
  const [candidateShowFreeResponse, setCandidateShowFreeResponse] =
    useState(true);
  const [matchResponses, setMatchResponses] = useState<any | null>(null);
  const [matchFreeResponses, setMatchFreeResponses] = useState<any | null>(
    null,
  );
  const [matchShowFreeResponse, setMatchShowFreeResponse] = useState(true);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);

  // Tab state - now includes free response
  const [candidateTab, setCandidateTab] = useState<
    "profile" | "questionnaire" | "freeResponse"
  >("profile");
  const [matchTab, setMatchTab] = useState<
    "profile" | "questionnaire" | "freeResponse"
  >("profile");

  // Questionnaire section collapse state (persists across tab switches)
  const [candidateSection1Collapsed, setCandidateSection1Collapsed] =
    useState(true);
  const [candidateSection2Collapsed, setCandidateSection2Collapsed] =
    useState(true);
  const [matchSection1Collapsed, setMatchSection1Collapsed] = useState(true);
  const [matchSection2Collapsed, setMatchSection2Collapsed] = useState(true);

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [rejectedMatches, setRejectedMatches] = useState<Set<string>>(
    new Set(),
  );
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [matchToReject, setMatchToReject] = useState<string | null>(null);
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [revealedMatchCount, setRevealedMatchCount] = useState(5); // Start by showing 5 matches
  const [matchesRevealed, setMatchesRevealed] = useState(false); // Track if admin has revealed matches

  useEffect(() => {
    fetchDashboard();
    checkMatchesRevealed();
  }, []);

  const checkMatchesRevealed = async () => {
    try {
      const res = await fetch("/api/admin/batch-status");
      if (res.ok) {
        const data = await res.json();
        setMatchesRevealed(!!data.revealedAt);
      }
    } catch (err) {
      console.error("Failed to check match reveal status:", err);
    }
  };

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

  // Reset match index to 0 when switching between match candidates
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [currentAssignmentIndex]);

  const loadQuestionnaireData = async () => {
    if (!currentAssignment) return;

    setLoadingQuestionnaires(true);
    try {
      // Load candidate questionnaire V2
      const candidateRes = await fetch(
        `/api/questionnaire/v2/view?userId=${currentAssignment.candidate.userId}`,
      );
      if (candidateRes.ok) {
        const candidateData = await candidateRes.json();
        setCandidateResponses(candidateData.responses);
        setCandidateFreeResponses({
          freeResponse1: candidateData.freeResponse1,
          freeResponse2: candidateData.freeResponse2,
          freeResponse3: candidateData.freeResponse3,
          freeResponse4: candidateData.freeResponse4,
          freeResponse5: candidateData.freeResponse5,
        });
        setCandidateShowFreeResponse(
          candidateData.showFreeResponseToMatches ?? true,
        );
      } else {
        console.error(
          `Failed to load candidate questionnaire: ${candidateRes.status}`,
          await candidateRes.text(),
        );
        setCandidateResponses(null);
        setCandidateFreeResponses(null);
      }

      // Load match questionnaire V2
      const currentMatch =
        currentAssignment.potentialMatches[currentMatchIndex];
      if (currentMatch) {
        const matchRes = await fetch(
          `/api/questionnaire/v2/view?userId=${currentMatch.userId}`,
        );
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatchResponses(matchData.responses);
          setMatchFreeResponses({
            freeResponse1: matchData.freeResponse1,
            freeResponse2: matchData.freeResponse2,
            freeResponse3: matchData.freeResponse3,
            freeResponse4: matchData.freeResponse4,
            freeResponse5: matchData.freeResponse5,
          });
          setMatchShowFreeResponse(matchData.showFreeResponseToMatches ?? true);
        } else {
          console.error(
            `Failed to load match questionnaire for ${currentMatch.userId}: ${matchRes.status}`,
            await matchRes.text(),
          );
          setMatchResponses(null);
          setMatchFreeResponses(null);
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
        "Please provide brief rationale for your match! Your match will be able to see this, and they'd appreciate it!",
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
            (a) => a.assignmentId !== currentAssignment.assignmentId,
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
      // Clear previous match data and start loading immediately
      setMatchResponses(null);
      setMatchFreeResponses(null);
      setLoadingQuestionnaires(true);
    } else if (direction === "next" && currentMatchIndex < visibleCount - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
      // Clear previous match data and start loading immediately
      setMatchResponses(null);
      setMatchFreeResponses(null);
      setLoadingQuestionnaires(true);
    }
  };

  const navigateAssignment = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentAssignmentIndex((i) => Math.max(0, i - 1));
    } else if (direction === "next") {
      setCurrentAssignmentIndex((i) =>
        Math.min((dashboard?.pendingAssignments?.length || 1) - 1, i + 1),
      );
    }
    // Reset matches and tabs after assignment changes
    setCurrentMatchIndex(0);
    setCandidateTab("profile");
    setCandidateSection1Collapsed(true);
    setCandidateSection2Collapsed(true);
    setMatchTab("profile");
    setMatchSection1Collapsed(true);
    setMatchSection2Collapsed(true);
    // Clear previous data and start loading immediately
    setCandidateResponses(null);
    setCandidateFreeResponses(null);
    setMatchResponses(null);
    setMatchFreeResponses(null);
    setLoadingQuestionnaires(true);
  };

  const handleRejectMatch = async () => {
    if (!matchToReject || !currentAssignment) return;

    // Check if this is the last remaining match
    const remainingMatches = currentAssignment.potentialMatches.filter(
      (m) => !rejectedMatches.has(m.userId) && m.userId !== matchToReject,
    );

    if (remainingMatches.length === 0) {
      setError(
        "This is the last potential match for this match candidate. You cannot reject it.",
      );
      setShowRejectDialog(false);
      setMatchToReject(null);
      return;
    }

    try {
      // Persist rejection to database
      const res = await fetch("/api/cupid/reject-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: currentAssignment.assignmentId,
          rejectedUserId: matchToReject,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject match");
      }

      // Mark as rejected in local state
      setRejectedMatches((prev) => new Set(prev).add(matchToReject));
      setShowRejectDialog(false);
      setMatchToReject(null);

      // If this was the selected match, deselect it
      if (selectedMatchId === matchToReject) {
        setSelectedMatchId(null);
      }

      // Always go to the first available match after rejecting
      setCurrentMatchIndex(0);
    } catch (err) {
      console.error("Failed to reject match:", err);
      setError(err instanceof Error ? err.message : "Failed to reject match");
      setShowRejectDialog(false);
      setMatchToReject(null);
    }
  };

  const currentAssignment =
    dashboard?.pendingAssignments[currentAssignmentIndex];

  // Debug logging
  useEffect(() => {
    if (dashboard) {
      console.log("[CupidMatchingPortal] Dashboard data:", {
        totalAssigned: dashboard.totalAssigned,
        pending: dashboard.pending,
        reviewed: dashboard.reviewed,
        pendingAssignmentsLength: dashboard.pendingAssignments?.length,
        currentAssignmentIndex,
        currentAssignment: currentAssignment
          ? {
              assignmentId: currentAssignment.assignmentId,
              candidateName: currentAssignment.candidate?.firstName,
              potentialMatchesCount: currentAssignment.potentialMatches?.length,
            }
          : null,
      });
    }
  }, [dashboard, currentAssignmentIndex, currentAssignment]);

  // Load rejected matches from current assignment and load revealed count from backend
  useEffect(() => {
    if (currentAssignment) {
      setRejectedMatches(new Set(currentAssignment.rejectedMatches || []));
      setRevealedMatchCount(currentAssignment.revealedCount || 5);
    }
  }, [currentAssignment]);

  // Filter out rejected matches and limit to revealed count
  const allAvailableMatches =
    currentAssignment?.potentialMatches.filter(
      (m) => !rejectedMatches.has(m.userId),
    ) || [];

  const visibleMatches = allAvailableMatches.slice(0, revealedMatchCount);
  const remainingMatches = allAvailableMatches.length - visibleMatches.length;

  const currentMatch = visibleMatches[currentMatchIndex];

  // Debug logging for matches
  useEffect(() => {
    console.log("[CupidMatchingPortal] Match data:", {
      allAvailableMatchesCount: allAvailableMatches.length,
      visibleMatchesCount: visibleMatches.length,
      currentMatchIndex,
      currentMatch: currentMatch
        ? {
            userId: currentMatch.userId,
            name: currentMatch.profile?.firstName,
          }
        : null,
      revealedMatchCount,
    });
  }, [
    allAvailableMatches.length,
    visibleMatches.length,
    currentMatchIndex,
    currentMatch,
    revealedMatchCount,
  ]);

  const handleRevealMore = async () => {
    if (!currentAssignment) return;

    const newCount = Math.min(
      revealedMatchCount + 5,
      allAvailableMatches.length,
    );

    try {
      // Update backend first
      const response = await fetch("/api/cupid/update-revealed-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: currentAssignment.assignmentId,
          revealedCount: newCount,
        }),
      });

      if (response.ok) {
        // Update local state only if backend update succeeds
        setRevealedMatchCount(newCount);
        // Update the current assignment in the dashboard state
        setDashboard((prev) =>
          prev
            ? {
                ...prev,
                pendingAssignments: prev.pendingAssignments.map((assignment) =>
                  assignment.assignmentId === currentAssignment.assignmentId
                    ? { ...assignment, revealedCount: newCount }
                    : assignment,
                ),
              }
            : null,
        );
      } else {
        console.error("Failed to update revealed count");
      }
    } catch (error) {
      console.error("Error updating revealed count:", error);
    }
  };

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

  if (!dashboard || dashboard.totalAssigned === 0 || dashboard.pending === 0) {
    const isAllDone =
      dashboard && dashboard.pending === 0 && dashboard.totalAssigned > 0;

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
                  You&apos;ve reviewed all assigned match candidates. Great
                  work, Cupid! 💘
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
                  Match Candidates Are Filling Out Questionnaires
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
    <div className="min-h-screen bg-slate-50 p-2 sm:p-4">
      {/* Tutorial for first-time cupid users */}
      <CupidPortalTutorial initialCompleted={cupidPortalTutorialCompleted} />

      <div className="max-w-[1800px] mx-auto space-y-2 sm:space-y-3">
        <BackButton />

        {/* Collapsible Info Panel */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {!isInfoCollapsed && (
            <div className="space-y-0">
              <div data-tutorial="stats-header">
                <StatsHeader dashboard={dashboard} />
              </div>

              {/* Candidate Navigation */}
              <div
                className="flex items-center justify-between p-4 border-t border-slate-200"
                data-tutorial="candidate-nav"
              >
                <Button
                  variant="outline"
                  onClick={() => navigateAssignment("prev")}
                  disabled={currentAssignmentIndex === 0 || !!selectedMatchId}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous Match Candidate
                </Button>
                <span className="text-slate-700 font-semibold">
                  Match Candidate {currentAssignmentIndex + 1} of{" "}
                  {dashboard?.pendingAssignments?.length || 0}
                </span>
                <Button
                  variant="outline"
                  onClick={() => navigateAssignment("next")}
                  disabled={
                    currentAssignmentIndex ===
                      (dashboard?.pendingAssignments?.length || 1) - 1 ||
                    !!selectedMatchId
                  }
                >
                  Next Match Candidate
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
                              (m) => m.userId === selectedMatchId,
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
                    {/* Compatibility Scores Button - Commented out for production */}
                    {/* <Button
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
                    </Button> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevealMore}
                      disabled={remainingMatches === 0}
                      className="flex items-center gap-2"
                      data-tutorial="generate-more"
                    >
                      <Plus className="h-4 w-4" />
                      {remainingMatches === 0
                        ? "No more compatible matches"
                        : remainingMatches <= 5
                          ? `Reveal ${remainingMatches} More ${remainingMatches === 1 ? "Match" : "Matches"}`
                          : "Reveal 5 More Matches"}
                    </Button>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!selectedMatchId || isSubmitting}
                      data-tutorial="confirm-button"
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
                Match Candidate {currentAssignmentIndex + 1} of{" "}
                {dashboard?.pendingAssignments?.length || 0}
                {selectedMatchId && (
                  <span className="ml-2 text-green-600">• Match selected</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {/* Confirm Selection Button */}
                {selectedMatchId && (
                  <Button
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    className="h-7 px-2 text-xs"
                    disabled={isSubmitting}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Confirm
                  </Button>
                )}
                {/* Reveal More Button */}
                {visibleMatches.length < allAvailableMatches.length && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRevealMore}
                    className="h-7 px-2 text-xs"
                  >
                    +{Math.min(remainingMatches, 5)}
                  </Button>
                )}
                {/* Previous Match Candidate */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateAssignment("prev")}
                  disabled={currentAssignmentIndex === 0 || !!selectedMatchId}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                {/* Next Match Candidate */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateAssignment("next")}
                  disabled={
                    currentAssignmentIndex ===
                      (dashboard?.pendingAssignments?.length || 1) - 1 ||
                    !!selectedMatchId
                  }
                  className="h-7 px-2"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
            className="w-full py-2 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-200"
            aria-label={
              isInfoCollapsed ? "Expand info panel" : "Collapse info panel"
            }
            data-tutorial="collapse-button"
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
              You&apos;ve rejected all potential matches for this match
              candidate. Please move to the next match candidate.
            </p>
          </Card>
        )}
        {currentAssignment && currentMatch && (
          <div
            className={`grid grid-cols-2 gap-3 ${isInfoCollapsed ? "h-[calc(100vh-140px)]" : "h-[calc(100vh-380px)]"}`}
            data-tutorial="split-view"
          >
            {/* Left: Candidate */}
            <Card className="border-2 border-blue-400 overflow-hidden flex flex-col">
              <CardHeader className="bg-blue-50 border-b border-blue-200 flex-shrink-0 py-2.5 px-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-600">
                      Your Match Candidate
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {currentAssignment.candidate.firstName}
                    </div>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2" data-tutorial="view-tabs">
                  <Button
                    variant={candidateTab === "profile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCandidateTab("profile")}
                    className="flex-1"
                  >
                    Profile
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
                  <Button
                    variant={
                      candidateTab === "freeResponse" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setCandidateTab("freeResponse")}
                    className="flex-1"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Free Response
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {candidateTab === "profile" ? (
                  <ProfileDisplay profile={currentAssignment.candidate} />
                ) : candidateTab === "freeResponse" ? (
                  loadingQuestionnaires ? (
                    <LoadingQuestionnairesSkeleton />
                  ) : (
                    <FreeResponseDisplay
                      responses={candidateFreeResponses}
                      showFreeResponse={candidateShowFreeResponse}
                    />
                  )
                ) : loadingQuestionnaires ? (
                  <LoadingQuestionnairesSkeleton />
                ) : (
                  <QuestionnaireV2Display
                    responses={candidateResponses}
                    showFreeResponse={candidateShowFreeResponse}
                    section1Collapsed={candidateSection1Collapsed}
                    setSection1Collapsed={setCandidateSection1Collapsed}
                    section2Collapsed={candidateSection2Collapsed}
                    setSection2Collapsed={setCandidateSection2Collapsed}
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
                className={`border-b flex-shrink-0 py-2.5 px-4 ${
                  selectedMatchId === currentMatch.userId
                    ? "bg-pink-100 border-pink-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-600">
                        Match {currentMatchIndex + 1} of {visibleMatches.length}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {currentMatch.profile.firstName}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    data-tutorial="match-nav"
                  >
                    {/* Compatibility score hidden in production */}
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
                          data-tutorial="reject-button"
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
                          data-tutorial="select-button"
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Select
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2">
                  <Button
                    variant={matchTab === "profile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMatchTab("profile")}
                    className="flex-1"
                  >
                    Profile
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
                  <Button
                    variant={
                      matchTab === "freeResponse" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setMatchTab("freeResponse")}
                    className="flex-1"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Free Response
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {matchTab === "profile" ? (
                  <ProfileDisplay profile={currentMatch.profile} />
                ) : matchTab === "freeResponse" ? (
                  loadingQuestionnaires ? (
                    <LoadingQuestionnairesSkeleton />
                  ) : (
                    <FreeResponseDisplay
                      responses={matchFreeResponses}
                      showFreeResponse={matchShowFreeResponse}
                    />
                  )
                ) : loadingQuestionnaires ? (
                  <LoadingQuestionnairesSkeleton />
                ) : (
                  <QuestionnaireV2Display
                    responses={matchResponses}
                    showFreeResponse={matchShowFreeResponse}
                    section1Collapsed={matchSection1Collapsed}
                    setSection1Collapsed={setMatchSection1Collapsed}
                    section2Collapsed={matchSection2Collapsed}
                    setSection2Collapsed={setMatchSection2Collapsed}
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
                    (m) => m.userId === selectedMatchId,
                  )?.profile.firstName
                }
              </strong>{" "}
              as the match for{" "}
              <strong>{currentAssignment?.candidate.firstName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4" data-tutorial="rationale-input">
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
                    (m) => m.userId === matchToReject,
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
          Welcome, {dashboard.cupidName}! Select the best match for each match
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
          {profile.firstName}
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
  responses: Record<string, any> | null;
  importance: ImportanceRatings | null;
}) {
  if (!responses) {
    return (
      <div className="p-6 text-center text-slate-500">
        No questionnaire data available
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {ALL_QUESTIONS.map((question) => (
        <div key={question.id} className="space-y-0">
          <div className="px-4 py-4 space-y-4">
            {(() => {
              const response =
                responses[question.id] || responses[question.id.toUpperCase()];
              const importanceValue =
                importance?.[question.id] ||
                importance?.[question.id.toUpperCase()];

              if (!response) return null;

              return (
                <div
                  key={question.id}
                  className="bg-slate-50 p-3 rounded-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">
                      {question.questionText}
                    </p>
                    {importanceValue && (
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
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatResponse(
  response:
    | {
        answer?:
          | string
          | string[]
          | number
          | { value: string; text: string }
          | { minAge: number; maxAge: number; userAge?: number }
          | { min: number; max: number; userAge?: number }
          | undefined;
        preference?: any;
        importance?: string;
        dealbreaker?: boolean;
      }
    | undefined,
): string {
  if (response === undefined || response === null) return "No answer";

  const answer = response.answer;
  if (answer === undefined || answer === null) return "No answer";

  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "object" && answer !== null) {
    if (
      ("minAge" in answer && "maxAge" in answer) ||
      ("min" in answer && "max" in answer)
    ) {
      const min = (answer as any).minAge || (answer as any).min;
      const max = (answer as any).maxAge || (answer as any).max;
      return `${min} - ${max} years old`;
    }
    if ("value" in answer && "text" in answer) {
      return (answer as any).text;
    }
    return "No preference";
  }
  return String(answer);
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
