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
  const [lastResult, setLastResult] = useState<AssignmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStats = userType === "test" ? testStats : productionStats;

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
        <h1 className="text-3xl font-bold text-slate-900">
          🏹 Cupid Assignment
        </h1>
        <p className="text-slate-600 mt-1">
          Assign match candidates to cupids for personalized review
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
              onClick={runAssignment}
              disabled={isRunning || currentStats.totalCandidates === 0}
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
