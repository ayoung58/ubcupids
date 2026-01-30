"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Users,
  Heart,
  AlertCircle,
  Beaker,
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  totalCandidates: number;
  totalCupids: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
}

interface AssignmentResult {
  totalCandidates: number;
  assignedCandidates: number;
  totalCupids: number;
  candidatesPerCupid: number;
  skippedCandidates: number;
  preferredAssignments: number;
  timestamp: string;
  preview?: boolean;
  assignments?: Array<{
    cupidId: string;
    cupidEmail: string;
    cupidDisplayName: string | null;
    candidates: Array<{
      candidateId: string;
      candidateEmail: string;
      candidateDisplayName: string | null;
      isPreferred: boolean;
      top25Matches: Array<{
        userId: string;
        email: string;
        displayName: string | null;
        score: number;
        isInitiallyVisible: boolean;
      }>;
    }>;
  }>;
}

interface AdminCupidAssignmentClientProps {
  productionStats: Stats;
  testStats: Stats;
}

export function AdminCupidAssignmentClient({
  productionStats,
  testStats,
}: AdminCupidAssignmentClientProps) {
  const router = useRouter();
  const [userType, setUserType] = useState<"test" | "production">("test");
  const [isRunning, setIsRunning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [lastResult, setLastResult] = useState<AssignmentResult | null>(null);
  const [previewData, setPreviewData] = useState<AssignmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCupids, setExpandedCupids] = useState<Set<string>>(new Set());
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(
    new Set(),
  );

  const currentStats = userType === "test" ? testStats : productionStats;

  const toggleCupid = (cupidId: string) => {
    setExpandedCupids((prev) => {
      const next = new Set(prev);
      if (next.has(cupidId)) {
        next.delete(cupidId);
      } else {
        next.add(cupidId);
      }
      return next;
    });
  };

  const toggleCandidate = (candidateId: string) => {
    setExpandedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const runPreview = async () => {
    setIsPreviewing(true);
    setError(null);
    setPreviewData(null);

    try {
      const endpoint =
        userType === "test"
          ? "/api/admin/pair-cupids-test/preview"
          : "/api/admin/pair-cupids-production/preview";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate preview");
      }

      setPreviewData(data);
      setExpandedCupids(new Set()); // Reset expanded state
      setExpandedCandidates(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsPreviewing(false);
    }
  };

  const runAssignment = async () => {
    // Confirmation for production user runs
    if (userType === "production") {
      const confirmed = window.confirm(
        "⚠️ You are about to assign PRODUCTION candidates to cupids.\n\n" +
          "This will create CupidAssignment records in the database.\n\n" +
          "Are you sure you want to proceed?",
      );
      if (!confirmed) return;
    }

    setIsRunning(true);
    setError(null);
    setLastResult(null);
    setPreviewData(null); // Clear preview when running actual

    try {
      const endpoint =
        userType === "test"
          ? "/api/admin/pair-cupids-test"
          : "/api/admin/pair-cupids-production";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber: 1 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run assignment");
      }

      setLastResult(data);

      // Refresh stats after successful assignment
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              🏹 Cupid Assignment
            </h1>
            <p className="text-slate-600 mt-1">
              Assign match candidates to cupids for personalized review
            </p>
          </div>
          <div className="ml-4">
            <Link href="/admin">
              <Button variant="ghost" className="h-10">
                ← Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* User Type Toggle */}
      <Card
        className={
          userType === "test"
            ? "border-blue-300 bg-blue-50/30"
            : "border-purple-300 bg-purple-50/30"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {userType === "test" ? (
              <>
                <Beaker className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">User Type Selection</span>
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 text-purple-600" />
                <span className="text-purple-900">User Type Selection</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={userType}
            onValueChange={(value) => {
              setUserType(value as "test" | "production");
              setLastResult(null);
              setError(null);
            }}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="test" id="test" />
              <Label
                htmlFor="test"
                className="cursor-pointer flex items-center gap-2 text-base"
              >
                <Beaker className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Test Users</span>
                <span className="text-sm text-slate-500">
                  (isTestUser=true)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="production" id="production" />
              <Label
                htmlFor="production"
                className="cursor-pointer flex items-center gap-2 text-base"
              >
                <Rocket className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Production Users</span>
                <span className="text-sm text-slate-500">
                  (isTestUser=false)
                </span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-slate-600 mt-3">
            {userType === "test" ? (
              <>
                <span className="font-medium text-blue-700">🧪 Test Mode:</span>{" "}
                Assign test candidates to cupids for testing. Safe to run
                multiple times.
              </>
            ) : (
              <>
                <span className="font-medium text-purple-700">
                  🚀 Production Mode:
                </span>{" "}
                Assign real candidates to cupids. This creates database records
                for production.
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Current Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={
            userType === "test" ? "border-blue-200" : "border-purple-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Candidates
            </CardTitle>
            <Users
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.totalCandidates}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              With completed questionnaires
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            userType === "test" ? "border-blue-200" : "border-purple-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Cupids
            </CardTitle>
            <Heart
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalCupids}</div>
            <p className="text-xs text-slate-500 mt-1">Verified and approved</p>
          </CardContent>
        </Card>

        <Card
          className={
            userType === "test" ? "border-blue-200" : "border-purple-200"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Assignments
            </CardTitle>
            <CheckCircle2
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.totalAssignments}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentStats.pendingAssignments} pending,{" "}
              {currentStats.completedAssignments} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Run Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              This will assign candidates to cupids based on:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
              <li>
                Preferred candidate assignments (if cupid specified a candidate)
              </li>
              <li>Round-robin distribution for remaining candidates</li>
              <li>
                Top 5 matches per candidate (based on candidate→match
                preference)
              </li>
              <li>Up to 25 matches can be revealed by cupid</li>
            </ul>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              <strong>Note:</strong> Running this will clear existing
              assignments for the selected user type and create new ones.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={runPreview}
              disabled={
                isPreviewing || isRunning || currentStats.totalCandidates === 0
              }
              variant="outline"
              size="lg"
              className="flex-1"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Assignment
                </>
              )}
            </Button>

            <Button
              onClick={runAssignment}
              disabled={
                isRunning || isPreviewing || currentStats.totalCandidates === 0
              }
              className="flex-1"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Assignment...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Run Assignment
                </>
              )}
            </Button>

            {currentStats.totalAssignments > 0 && (
              <Link
                href={
                  userType === "test"
                    ? "/cupid-dashboard-test"
                    : "/cupid-dashboard"
                }
                passHref
              >
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  View {userType === "test" ? "Test " : ""}Cupid Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {currentStats.totalCandidates === 0 && (
            <Alert className="bg-slate-50 border-slate-200">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertDescription className="text-sm text-slate-600">
                No candidates available. Users must complete the questionnaire
                and opt in to be matched.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview Display */}
      {previewData && previewData.preview && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Eye className="h-5 w-5 text-blue-600" />
              Assignment Preview (Not Saved to Database)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Candidates</p>
                <p className="text-2xl font-bold text-slate-900">
                  {previewData.totalCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Assigned</p>
                <p className="text-2xl font-bold text-blue-700">
                  {previewData.assignedCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Skipped</p>
                <p className="text-2xl font-bold text-slate-500">
                  {previewData.skippedCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Cupids</p>
                <p className="text-2xl font-bold text-slate-900">
                  {previewData.totalCupids}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Candidates per Cupid</p>
                <p className="text-2xl font-bold text-slate-900">
                  ~{previewData.candidatesPerCupid}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Preferred Assignments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {previewData.preferredAssignments}
                </p>
              </div>
            </div>

            {/* Assignment Details */}
            {previewData.assignments && previewData.assignments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-slate-900">
                  Cupid Assignments
                </h3>
                <div className="space-y-2">
                  {previewData.assignments.map((assignment) => (
                    <div
                      key={assignment.cupidId}
                      className="border border-slate-200 rounded-lg bg-white overflow-hidden"
                    >
                      <button
                        onClick={() => toggleCupid(assignment.cupidId)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="h-5 w-5 text-pink-500" />
                          <div className="text-left">
                            <p className="font-medium text-slate-900">
                              {assignment.cupidDisplayName ||
                                assignment.cupidEmail}
                            </p>
                            <p className="text-sm text-slate-500">
                              {assignment.candidates.length} candidate
                              {assignment.candidates.length !== 1 ? "s" : ""}
                              {assignment.candidates.some(
                                (c) => c.isPreferred,
                              ) && (
                                <span className="ml-2 text-purple-600 font-medium">
                                  (
                                  {
                                    assignment.candidates.filter(
                                      (c) => c.isPreferred,
                                    ).length
                                  }{" "}
                                  preferred)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {expandedCupids.has(assignment.cupidId) ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      {expandedCupids.has(assignment.cupidId) && (
                        <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
                          {assignment.candidates.map((candidate) => (
                            <div
                              key={candidate.candidateId}
                              className="border border-slate-200 rounded-lg bg-white overflow-hidden"
                            >
                              <button
                                onClick={() =>
                                  toggleCandidate(candidate.candidateId)
                                }
                                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <div className="text-left">
                                    <p className="font-medium text-slate-900">
                                      {candidate.candidateDisplayName ||
                                        candidate.candidateEmail}
                                      {candidate.isPreferred && (
                                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                                          Preferred
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {candidate.top25Matches.length} matches
                                      available
                                    </p>
                                  </div>
                                </div>
                                {expandedCandidates.has(
                                  candidate.candidateId,
                                ) ? (
                                  <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </button>

                              {expandedCandidates.has(
                                candidate.candidateId,
                              ) && (
                                <div className="border-t border-slate-200 p-3 bg-slate-50">
                                  <p className="text-sm font-medium text-slate-700 mb-2">
                                    Top 25 Matches (First 5 initially visible):
                                  </p>
                                  <div className="space-y-1.5">
                                    {candidate.top25Matches.map(
                                      (match, idx) => (
                                        <div
                                          key={match.userId}
                                          className={`flex items-center justify-between p-2 rounded ${
                                            match.isInitiallyVisible
                                              ? "bg-green-50 border border-green-200"
                                              : "bg-white border border-slate-200"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-500 w-6">
                                              #{idx + 1}
                                            </span>
                                            <span className="text-sm text-slate-900">
                                              {match.displayName || match.email}
                                            </span>
                                            {match.isInitiallyVisible && (
                                              <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded font-semibold">
                                                Shown
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-sm font-mono text-slate-600">
                                            {match.score.toFixed(1)}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <strong>This is a preview only.</strong> Click &quot;Run
                Assignment&quot; to actually create these assignments in the
                database.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {lastResult && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Assignment Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Candidates</p>
                <p className="text-2xl font-bold text-slate-900">
                  {lastResult.totalCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Assigned</p>
                <p className="text-2xl font-bold text-green-700">
                  {lastResult.assignedCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Skipped</p>
                <p className="text-2xl font-bold text-slate-500">
                  {lastResult.skippedCandidates}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Cupids</p>
                <p className="text-2xl font-bold text-slate-900">
                  {lastResult.totalCupids}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Candidates per Cupid</p>
                <p className="text-2xl font-bold text-slate-900">
                  ~{lastResult.candidatesPerCupid}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-600">Preferred Assignments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lastResult.preferredAssignments}
                </p>
              </div>
            </div>

            {lastResult.skippedCandidates > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-800">
                  {lastResult.skippedCandidates} candidate(s) were skipped
                  because they had no compatible matches.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/cupid-dashboard" passHref className="flex-1">
                <Button variant="default" size="lg" className="w-full">
                  View Cupid Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">
            How Cupid Assignment Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div>
            <strong>1. Preferred Candidates:</strong> If a cupid specified a
            preferred candidate email, that candidate will be assigned to them
            first (if available and eligible).
          </div>
          <div>
            <strong>2. Round-Robin Distribution:</strong> Remaining candidates
            are distributed evenly across all cupids.
          </div>
          <div>
            <strong>3. Top Matches:</strong> Each candidate gets their top 5
            matches initially, sorted by how well each match satisfies the
            candidate&apos;s preferences (candidate→match directional score).
          </div>
          <div>
            <strong>4. Expandable Matches:</strong> Cupids can reveal up to 25
            matches per candidate using the &quot;Load More&quot; feature.
          </div>
          <div>
            <strong>5. Cupid Selection:</strong> Each cupid reviews their
            assigned candidates and selects the best match for each one.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
