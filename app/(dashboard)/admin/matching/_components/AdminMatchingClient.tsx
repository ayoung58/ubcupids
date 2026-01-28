"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Play,
  Users,
  Heart,
  AlertCircle,
  Clock,
  BarChart3,
  Beaker,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  totalMatches: number;
  unmatchedUsers: number;
}

interface MatchingRunResult {
  runId: string;
  timestamp: string;
  userCount: number;
  matchesCreated: number;
  unmatchedCount: number;
  executionTimeMs: number;
  diagnostics?: {
    phase1_filteredPairs: number;
    phase2to6_pairScoresCalculated: number;
    phase2to6_averageRawScore: number;
    phase7_eligiblePairs: number;
    phase7_failedAbsolute: number;
    phase7_failedRelativeA: number;
    phase7_failedRelativeB: number;
    phase7_perfectionists: string[];
    phase8_matchesCreated: number;
    phase8_unmatchedUsers: number;
    phase8_averageMatchScore: number;
    phase8_medianMatchScore: number;
    phase8_minMatchScore: number;
    phase8_maxMatchScore: number;
    scoreDistribution: Record<string, number>;
    samplePairBreakdowns?: Array<{
      userAId: string;
      userAEmail: string;
      userBId: string;
      userBEmail: string;
      averageSimilarity: number;
      finalPairScore: number;
      scoreAtoB: number;
      scoreBtoA: number;
      questionCount: number;
      questions: Array<{
        questionId: string;
        userA: {
          answer: any;
          preference: any;
          importance?: string;
        };
        userB: {
          answer: any;
          preference: any;
          importance?: string;
        };
        similarityScore: number;
      }>;
    }>;
    actualMatches?: Array<{
      userAId: string;
      userAEmail: string;
      userBId: string;
      userBEmail: string;
      pairScore: number;
      scoreAtoB: number;
      scoreBtoA: number;
      averageSimilarity: number;
      questionCount: number;
      questions: Array<{
        questionId: string;
        userA: {
          answer: any;
          preference: any;
          importance?: string;
        };
        userB: {
          answer: any;
          preference: any;
          importance?: string;
        };
        similarityScore: number;
      }>;
    }>;
  };
}

interface AdminMatchingClientProps {
  productionStats: Stats;
  testStats: Stats;
}

export function AdminMatchingClient({
  productionStats,
  testStats,
}: AdminMatchingClientProps) {
  const router = useRouter();
  const [userType, setUserType] = useState<"test" | "production">("test");
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MatchingRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  // Get the current stats based on selected user type
  const currentStats = userType === "test" ? testStats : productionStats;

  const runMatching = async (dryRun: boolean = false) => {
    // Confirmation for production user runs (not dry run)
    if (userType === "production" && !dryRun) {
      const confirmed = window.confirm(
        "⚠️ You are about to run matching for PRODUCTION users.\n\n" +
          "This will create Match records in the database that affect real users.\n\n" +
          "Are you sure you want to proceed?",
      );
      if (!confirmed) return;
    }

    setIsRunning(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch("/api/admin/matching/v2/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          includeDiagnostics: true,
          isTestUser: userType === "test",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run matching");
      }

      setLastResult(data);
      setCurrentPairIndex(0); // Reset to first pair when new results come in

      // Refresh stats if not dry run
      if (!dryRun) {
        router.refresh();
      }
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
        <h1 className="text-3xl font-bold text-slate-900">
          🎯 Matching Algorithm V2.2
        </h1>
        <p className="text-slate-600 mt-1">
          Run the global matching algorithm and view diagnostics
        </p>
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
              setLastResult(null); // Clear results when switching
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
                Match test users separately for development and testing. Safe to
                run multiple times.
              </>
            ) : (
              <>
                <span className="font-medium text-purple-700">
                  🚀 Production Mode:
                </span>{" "}
                Match real users. This will create database records that affect
                production data.
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
              Eligible Users
            </CardTitle>
            <Users
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">
              With completed V2 questionnaires
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
              Current Matches
            </CardTitle>
            <Heart
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.totalMatches}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active algorithm matches
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
              Unmatched Users
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${userType === "test" ? "text-blue-500" : "text-purple-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.unmatchedUsers}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Below quality threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Run Matching Algorithm</span>
            {userType === "test" && (
              <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Test Mode
              </span>
            )}
            {userType === "production" && (
              <span className="text-sm font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                Production Mode
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => runMatching(true)}
              disabled={isRunning || currentStats.totalUsers < 2}
              variant="outline"
              className={`flex-1 ${userType === "test" ? "border-blue-300 hover:bg-blue-50" : "border-purple-300 hover:bg-purple-50"}`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dry Run (Preview)
                </>
              )}
            </Button>

            <Button
              onClick={() => runMatching(false)}
              disabled={isRunning || currentStats.totalUsers < 2}
              className={`flex-1 ${userType === "test" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Matching {userType === "production" && "(Production)"}
                </>
              )}
            </Button>
          </div>

          {currentStats.totalUsers < 2 && (
            <Alert
              className={
                userType === "test"
                  ? "border-blue-200 bg-blue-50"
                  : "border-purple-200 bg-purple-50"
              }
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Need at least 2 {userType === "test" ? "test" : "production"}{" "}
                users with completed questionnaires to run matching
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-slate-600">
            <p className="font-medium mb-2">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Dry Run:</strong> Preview results without saving to
                database
              </li>
              <li>
                <strong>Production Run:</strong> Creates matches and overwrites
                existing algorithm matches
              </li>
              <li>
                Uses 8-phase algorithm: hard filters → global optimization
              </li>
              <li>
                Quality-focused: users may remain unmatched if below threshold
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {lastResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Matching Results</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>{new Date(lastResult.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Users</div>
                <div className="text-2xl font-bold">{lastResult.userCount}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Matches</div>
                <div className="text-2xl font-bold text-green-700">
                  {lastResult.matchesCreated}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-sm text-amber-600 mb-1">Unmatched</div>
                <div className="text-2xl font-bold text-amber-700">
                  {lastResult.unmatchedCount}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Time</div>
                <div className="text-2xl font-bold text-blue-700">
                  {(lastResult.executionTimeMs / 1000).toFixed(2)}s
                </div>
              </div>
            </div>

            {/* Match Rate */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Match Rate</span>
                <span className="text-sm text-slate-600">
                  {(
                    ((lastResult.matchesCreated * 2) / lastResult.userCount) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {lastResult.matchesCreated} matches ={" "}
                {lastResult.matchesCreated * 2} matched users
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-rose-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((lastResult.matchesCreated * 2) / lastResult.userCount) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Diagnostics Toggle */}
            {lastResult.diagnostics &&
              (() => {
                const diagnostics = lastResult.diagnostics;
                return (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      className="w-full"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {showDiagnostics ? "Hide" : "Show"} Detailed Diagnostics
                    </Button>

                    {showDiagnostics && (
                      <div className="border rounded-lg p-4 space-y-6">
                        {/* Phase Breakdown */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">
                            Algorithm Phase Breakdown
                          </h3>
                          <div className="space-y-2">
                            <DiagnosticRow
                              label="Phase 1: Hard Filters (Dealbreakers)"
                              value={`${diagnostics.phase1_filteredPairs} pairs blocked`}
                              color="red"
                            />
                            <DiagnosticRow
                              label="Phase 2-6: Pair Scoring"
                              value={`${diagnostics.phase2to6_pairScoresCalculated} pairs scored`}
                              subvalue={`Avg: ${(diagnostics.phase2to6_averageRawScore ?? 0).toFixed(1)}/100`}
                              color="blue"
                            />
                            <DiagnosticRow
                              label="Phase 7: Eligibility Filtering"
                              value={`${diagnostics.phase7_eligiblePairs} eligible pairs`}
                              subvalue={`Failed: ${diagnostics.phase7_failedAbsolute ?? 0} absolute, ${(diagnostics.phase7_failedRelativeA ?? 0) + (diagnostics.phase7_failedRelativeB ?? 0)} relative`}
                              color="amber"
                            />
                            <DiagnosticRow
                              label="Phase 8: Global Matching (Blossom)"
                              value={`${diagnostics.phase8_matchesCreated} matches created`}
                              subvalue={`${diagnostics.phase8_unmatchedUsers} unmatched`}
                              color="green"
                            />
                          </div>
                        </div>

                        {/* Match Quality */}
                        <div>
                          <h3 className="font-semibold text-lg mb-3">
                            Match Quality Metrics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <QualityMetric
                              label="Average"
                              value={diagnostics.phase8_averageMatchScore.toFixed(
                                1,
                              )}
                            />
                            <QualityMetric
                              label="Median"
                              value={diagnostics.phase8_medianMatchScore.toFixed(
                                1,
                              )}
                            />
                            <QualityMetric
                              label="Minimum"
                              value={diagnostics.phase8_minMatchScore.toFixed(
                                1,
                              )}
                            />
                            <QualityMetric
                              label="Maximum"
                              value={diagnostics.phase8_maxMatchScore.toFixed(
                                1,
                              )}
                            />
                          </div>
                        </div>

                        {/* Score Distribution */}
                        {diagnostics.scoreDistribution && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3">
                              Score Distribution
                            </h3>
                            <div className="space-y-2">
                              {Object.entries(diagnostics.scoreDistribution)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([range, count]) => (
                                  <div
                                    key={range}
                                    className="flex items-center gap-3"
                                  >
                                    <span className="text-sm w-24 text-slate-600">
                                      {range}
                                    </span>
                                    <div className="flex-1 bg-slate-200 rounded-full h-6 relative">
                                      <div
                                        className="bg-rose-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                                        style={{
                                          width: `${(count / diagnostics.phase2to6_pairScoresCalculated) * 100}%`,
                                        }}
                                      >
                                        <span className="text-xs font-medium text-white">
                                          {count}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Perfectionists */}
                        {diagnostics.phase7_perfectionists.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3">
                              Perfectionists
                              <span className="text-sm font-normal text-slate-600 ml-2">
                                (Users with no eligible matches despite having
                                pair scores)
                              </span>
                            </h3>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-amber-800">
                                {diagnostics.phase7_perfectionists.length} users
                                rejected all potential matches due to quality
                                thresholds
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Sample Pair Breakdown */}
                        {diagnostics.samplePairBreakdowns &&
                          diagnostics.samplePairBreakdowns.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-3">
                                Sample Pair Analysis
                                <span className="text-sm font-normal text-slate-600 ml-2">
                                  (Question-by-question breakdown for manual
                                  verification)
                                </span>
                              </h3>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                {/* Navigation Controls */}
                                {diagnostics.samplePairBreakdowns.length >
                                  1 && (
                                  <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentPairIndex((prev) =>
                                          prev === 0
                                            ? (diagnostics.samplePairBreakdowns
                                                ?.length || 1) - 1
                                            : prev - 1,
                                        )
                                      }
                                      disabled={
                                        !diagnostics.samplePairBreakdowns ||
                                        diagnostics.samplePairBreakdowns
                                          .length <= 1
                                      }
                                    >
                                      <ChevronLeft className="w-4 h-4 mr-1" />
                                      Previous
                                    </Button>
                                    <span className="text-sm font-medium text-slate-700">
                                      Pair {currentPairIndex + 1} of{" "}
                                      {diagnostics.samplePairBreakdowns.length}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentPairIndex((prev) =>
                                          prev ===
                                          (diagnostics.samplePairBreakdowns
                                            ?.length || 1) -
                                            1
                                            ? 0
                                            : prev + 1,
                                        )
                                      }
                                      disabled={
                                        !diagnostics.samplePairBreakdowns ||
                                        diagnostics.samplePairBreakdowns
                                          .length <= 1
                                      }
                                    >
                                      Next
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  </div>
                                )}

                                {(() => {
                                  const currentPair =
                                    diagnostics.samplePairBreakdowns?.[
                                      currentPairIndex
                                    ];

                                  if (!currentPair) {
                                    return (
                                      <div className="text-gray-500">
                                        No pair data available
                                      </div>
                                    );
                                  }

                                  return (
                                    <>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">
                                            User A:
                                          </span>{" "}
                                          {currentPair.userAEmail}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            User B:
                                          </span>{" "}
                                          {currentPair.userBEmail}
                                        </div>
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-medium">
                                          Average Similarity (Phase 2):
                                        </span>{" "}
                                        {(
                                          currentPair.averageSimilarity * 100
                                        ).toFixed(1)}
                                        % ({currentPair.questionCount}{" "}
                                        questions)
                                      </div>
                                      <div className="text-sm font-semibold mt-1">
                                        <span className="font-medium">
                                          Final Pair Score (Phase 6):
                                        </span>{" "}
                                        <span
                                          className={
                                            (currentPair.finalPairScore || 0) >=
                                            60
                                              ? "text-green-600"
                                              : (currentPair.finalPairScore ||
                                                    0) >= 40
                                                ? "text-blue-600"
                                                : (currentPair.finalPairScore ||
                                                      0) >= 20
                                                  ? "text-amber-600"
                                                  : "text-red-600"
                                          }
                                        >
                                          {(
                                            currentPair.finalPairScore || 0
                                          ).toFixed(1)}
                                          /100
                                        </span>
                                        {" (A→B: "}
                                        {(currentPair.scoreAtoB || 0).toFixed(
                                          1,
                                        )}
                                        {", B→A: "}
                                        {(currentPair.scoreBtoA || 0).toFixed(
                                          1,
                                        )}
                                        {")"}
                                      </div>
                                      <details className="mt-3">
                                        <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
                                          View Question-by-Question Breakdown
                                        </summary>
                                        <div className="mt-3 max-h-96 overflow-y-auto">
                                          <table className="w-full text-xs">
                                            <thead className="sticky top-0 bg-blue-100">
                                              <tr>
                                                <th className="text-left p-2 border-b">
                                                  Q
                                                </th>
                                                <th className="text-left p-2 border-b">
                                                  User A
                                                </th>
                                                <th className="text-left p-2 border-b">
                                                  User B
                                                </th>
                                                <th className="text-right p-2 border-b">
                                                  Score
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {currentPair.questions.map(
                                                (q: any) => (
                                                  <tr
                                                    key={q.questionId}
                                                    className="border-b hover:bg-blue-50"
                                                  >
                                                    <td className="p-2 font-mono font-semibold">
                                                      {q.questionId}
                                                    </td>
                                                    <td className="p-2">
                                                      <div>
                                                        <div>
                                                          <span className="font-medium">
                                                            A:
                                                          </span>{" "}
                                                          {JSON.stringify(
                                                            q.userA.answer,
                                                          )}
                                                        </div>
                                                        {q.userA.preference !==
                                                          undefined && (
                                                          <div className="text-slate-600">
                                                            <span className="font-medium">
                                                              P:
                                                            </span>{" "}
                                                            {JSON.stringify(
                                                              q.userA
                                                                .preference,
                                                            )}
                                                          </div>
                                                        )}
                                                        {q.userA.importance && (
                                                          <div className="text-slate-500 text-xs">
                                                            {q.userA.importance}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="p-2">
                                                      <div>
                                                        <div>
                                                          <span className="font-medium">
                                                            A:
                                                          </span>{" "}
                                                          {JSON.stringify(
                                                            q.userB.answer,
                                                          )}
                                                        </div>
                                                        {q.userB.preference !==
                                                          undefined && (
                                                          <div className="text-slate-600">
                                                            <span className="font-medium">
                                                              P:
                                                            </span>{" "}
                                                            {JSON.stringify(
                                                              q.userB
                                                                .preference,
                                                            )}
                                                          </div>
                                                        )}
                                                        {q.userB.importance && (
                                                          <div className="text-slate-500 text-xs">
                                                            {q.userB.importance}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="p-2 text-right font-mono">
                                                      <span
                                                        className={
                                                          q.similarityScore >=
                                                          0.8
                                                            ? "text-green-600 font-semibold"
                                                            : q.similarityScore >=
                                                                0.5
                                                              ? "text-blue-600"
                                                              : q.similarityScore >=
                                                                  0.3
                                                                ? "text-amber-600"
                                                                : "text-red-600 font-semibold"
                                                        }
                                                      >
                                                        {q.similarityScore.toFixed(
                                                          3,
                                                        )}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </details>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                        {/* Actual Matches Section */}
                        {diagnostics?.actualMatches &&
                          diagnostics.actualMatches.length > 0 && (
                            <div className="mt-6">
                              <h3 className="font-semibold text-lg mb-3">
                                Actual Matches Created
                                <span className="text-sm font-normal text-slate-600 ml-2">
                                  ({diagnostics.actualMatches.length} match
                                  {diagnostics.actualMatches.length !== 1
                                    ? "es"
                                    : ""}
                                  )
                                </span>
                              </h3>
                              <div className="space-y-3">
                                {diagnostics.actualMatches.map((match, idx) => (
                                  <div
                                    key={`${match.userAId}-${match.userBId}`}
                                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                                  >
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                      <div>
                                        <span className="font-medium">
                                          User A:
                                        </span>{" "}
                                        {match.userAEmail}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          User B:
                                        </span>{" "}
                                        {match.userBEmail}
                                      </div>
                                    </div>
                                    <div className="text-sm mb-2">
                                      <span className="font-medium">
                                        Average Similarity (Phase 2):
                                      </span>{" "}
                                      {(match.averageSimilarity * 100).toFixed(
                                        1,
                                      )}
                                      % ({match.questionCount} questions)
                                    </div>
                                    <div className="text-sm font-semibold">
                                      <span className="font-medium">
                                        Final Pair Score (Phase 6):
                                      </span>{" "}
                                      <span
                                        className={
                                          match.pairScore >= 60
                                            ? "text-green-600"
                                            : match.pairScore >= 40
                                              ? "text-blue-600"
                                              : match.pairScore >= 20
                                                ? "text-amber-600"
                                                : "text-red-600"
                                        }
                                      >
                                        {match.pairScore.toFixed(1)}/100
                                      </span>
                                      {" (A→B: "}
                                      {match.scoreAtoB.toFixed(1)}
                                      {", B→A: "}
                                      {match.scoreBtoA.toFixed(1)}
                                      {")"}
                                    </div>
                                    <details className="mt-3">
                                      <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-800">
                                        View Question-by-Question Breakdown
                                      </summary>
                                      <div className="mt-3 max-h-96 overflow-y-auto">
                                        <table className="w-full text-xs">
                                          <thead className="sticky top-0 bg-green-100">
                                            <tr>
                                              <th className="text-left p-2 border-b">
                                                Q
                                              </th>
                                              <th className="text-left p-2 border-b">
                                                User A
                                              </th>
                                              <th className="text-left p-2 border-b">
                                                User B
                                              </th>
                                              <th className="text-right p-2 border-b">
                                                Score
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {match.questions.map((q: any) => (
                                              <tr
                                                key={q.questionId}
                                                className="border-b hover:bg-green-50"
                                              >
                                                <td className="p-2 font-mono font-semibold">
                                                  {q.questionId}
                                                </td>
                                                <td className="p-2">
                                                  <div>
                                                    <div>
                                                      <span className="font-medium">
                                                        A:
                                                      </span>{" "}
                                                      {JSON.stringify(
                                                        q.userA.answer,
                                                      )}
                                                    </div>
                                                    {q.userA.preference !==
                                                      undefined && (
                                                      <div className="text-slate-600">
                                                        <span className="font-medium">
                                                          P:
                                                        </span>{" "}
                                                        {JSON.stringify(
                                                          q.userA.preference,
                                                        )}
                                                      </div>
                                                    )}
                                                    {q.userA.importance && (
                                                      <div className="text-slate-500 text-xs">
                                                        {q.userA.importance}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="p-2">
                                                  <div>
                                                    <div>
                                                      <span className="font-medium">
                                                        A:
                                                      </span>{" "}
                                                      {JSON.stringify(
                                                        q.userB.answer,
                                                      )}
                                                    </div>
                                                    {q.userB.preference !==
                                                      undefined && (
                                                      <div className="text-slate-600">
                                                        <span className="font-medium">
                                                          P:
                                                        </span>{" "}
                                                        {JSON.stringify(
                                                          q.userB.preference,
                                                        )}
                                                      </div>
                                                    )}
                                                    {q.userB.importance && (
                                                      <div className="text-slate-500 text-xs">
                                                        {q.userB.importance}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                  <span
                                                    className={
                                                      q.similarityScore >= 0.8
                                                        ? "text-green-600 font-semibold"
                                                        : q.similarityScore >=
                                                            0.5
                                                          ? "text-blue-600"
                                                          : q.similarityScore >=
                                                              0.3
                                                            ? "text-amber-600"
                                                            : "text-red-600 font-semibold"
                                                    }
                                                  >
                                                    {q.similarityScore.toFixed(
                                                      3,
                                                    )}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </details>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })()}
          </CardContent>
        </Card>
      )}

      {/* Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">8-Phase Pipeline</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                <li>Hard Filtering (dealbreakers)</li>
                <li>Similarity Calculation</li>
                <li>Importance Weighting</li>
                <li>Directional Scoring</li>
                <li>Section Weighting (65% lifestyle, 35% personality)</li>
                <li>Pair Score Construction (mutuality)</li>
                <li>Eligibility Thresholding</li>
                <li>Global Matching (Blossom algorithm)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Key Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Quality over quantity - no forced matches</li>
                <li>Mutual satisfaction required</li>
                <li>Globally optimal outcomes</li>
                <li>Respects all dealbreakers</li>
                <li>Tunable parameters for iteration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticRow({
  label,
  value,
  subvalue,
  color,
}: {
  label: string;
  value: string;
  subvalue?: string;
  color: "red" | "blue" | "amber" | "green";
}) {
  const colorClasses = {
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-green-50 border-green-200 text-green-800",
  };

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold">{value}</span>
          {subvalue && (
            <span className="text-xs block opacity-75">{subvalue}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function QualityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">/100</div>
    </div>
  );
}
