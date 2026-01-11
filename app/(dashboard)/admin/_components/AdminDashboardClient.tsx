"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Play,
  Users,
  Eye,
  Trash2,
  Settings,
  Calendar,
  CheckCircle2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MatchingState {
  hasMatches: boolean;
  hasAssignments: boolean;
  hasRevealed: boolean;
}

interface AdminDashboardClientProps {
  adminName: string;
  matchingStatus: string;
  matchingState: MatchingState;
}

export function AdminDashboardClient({
  adminName,
  matchingStatus,
  matchingState,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionMessages, setActionMessages] = useState<
    Record<string, { type: "success" | "error"; message: string }>
  >({});

  const handleAction = async (action: string, endpoint: string) => {
    setLoadingAction(action);
    // Clear previous message for this action
    setActionMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[action];
      return newMessages;
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber: 1 }), // Always batch 1
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessages((prev) => ({
          ...prev,
          [action]: {
            type: "success",
            message: data.message || "Action completed successfully",
          },
        }));
        router.refresh();
      } else {
        setActionMessages((prev) => ({
          ...prev,
          [action]: { type: "error", message: data.error || "Action failed" },
        }));
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      setActionMessages((prev) => ({
        ...prev,
        [action]: { type: "error", message: "Failed to execute action" },
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateUsers = async (userType: "match" | "cupid") => {
    const action = `generate-${userType}-users`;
    setLoadingAction(action);
    // Clear previous message for this action
    setActionMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[action];
      return newMessages;
    });

    try {
      const response = await fetch("/api/admin/generate-test-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 125, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessages((prev) => ({
          ...prev,
          [action]: {
            type: "success",
            message: data.message || `Generated 125 ${userType} users`,
          },
        }));
        router.refresh();
      } else {
        setActionMessages((prev) => ({
          ...prev,
          [action]: {
            type: "error",
            message: data.error || "Failed to generate users",
          },
        }));
      }
    } catch (error) {
      console.error(`Error generating ${userType} users:`, error);
      setActionMessages((prev) => ({
        ...prev,
        [action]: { type: "error", message: "Failed to generate users" },
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearTestUsers = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL test users? This cannot be undone."
      )
    ) {
      return;
    }

    const action = "clear-test-users";
    setLoadingAction(action);
    // Clear previous message for this action
    setActionMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[action];
      return newMessages;
    });

    try {
      const response = await fetch("/api/admin/clear-test-users", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessages((prev) => ({
          ...prev,
          [action]: {
            type: "success",
            message: data.message || "Test users cleared",
          },
        }));
        router.refresh();
      } else {
        setActionMessages((prev) => ({
          ...prev,
          [action]: {
            type: "error",
            message: data.error || "Failed to clear test users",
          },
        }));
      }
    } catch (error) {
      console.error("Error clearing test users:", error);
      setActionMessages((prev) => ({
        ...prev,
        [action]: { type: "error", message: "Failed to clear test users" },
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-slate-900">
          🛡️ Admin Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Welcome, {adminName}</p>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            2026 Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900">
                📝 Questionnaire Due
              </p>
              <p className="text-sm text-amber-700">January 31st, 2026</p>
            </div>
            <div className="flex-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900">💘 Cupid Evaluation</p>
              <p className="text-sm text-blue-700">Feb 1-6, 2026</p>
            </div>
            <div className="flex-1 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="font-semibold text-pink-900">💌 Match Reveal</p>
              <p className="text-sm text-pink-700">February 7th, 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Status */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Current Status
              </span>
              <span className="text-lg font-semibold capitalize px-3 py-1 bg-white rounded-full border">
                {matchingStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${matchingState.hasMatches ? "text-green-500" : "text-slate-300"}`}
                />
                <span
                  className={
                    matchingState.hasMatches
                      ? "text-slate-700"
                      : "text-slate-400"
                  }
                >
                  Matches Created
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${matchingState.hasAssignments ? "text-green-500" : "text-slate-300"}`}
                />
                <span
                  className={
                    matchingState.hasAssignments
                      ? "text-slate-700"
                      : "text-slate-400"
                  }
                >
                  Cupids Assigned
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${matchingState.hasRevealed ? "text-green-500" : "text-slate-300"}`}
                />
                <span
                  className={
                    matchingState.hasRevealed
                      ? "text-slate-700"
                      : "text-slate-400"
                  }
                >
                  Matches Revealed
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/questionnaire-config">
            <Button className="w-full h-16" variant="outline">
              <Settings className="mr-2 h-5 w-5" />
              Edit Questionnaire Configuration
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Matching Workflow - Test Users */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-blue-900">
            🧪 Test Users Matching Workflow
          </CardTitle>
          <p className="text-sm text-blue-700">
            Manage matching for test users independently (isTestUser=true)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Run Matching for Test Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["start-matching-test"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["start-matching-test"].type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["start-matching-test"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "start-matching-test",
                    "/api/admin/start-matching-test"
                  )
                }
                disabled={loadingAction !== null}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700"
              >
                {loadingAction === "start-matching-test" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Play className="mr-2 h-5 w-5" />
                )}
                Run Matching (Test Users Only)
              </Button>
            </div>
          </div>

          {/* Step 2: Pair Cupids - Test Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["pair-cupids-test"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["pair-cupids-test"].type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["pair-cupids-test"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "pair-cupids-test",
                    "/api/admin/pair-cupids-test"
                  )
                }
                disabled={loadingAction !== null}
                className="w-full h-16 bg-blue-500 hover:bg-blue-600"
                variant="outline"
              >
                {loadingAction === "pair-cupids-test" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Users className="mr-2 h-5 w-5" />
                )}
                Assign Cupids (Test Users Only)
              </Button>
            </div>
          </div>

          {/* Step 3: Reveal Matches - Test Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["reveal-matches-test"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["reveal-matches-test"].type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["reveal-matches-test"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "reveal-matches-test",
                    "/api/admin/reveal-matches-test"
                  )
                }
                disabled={loadingAction !== null}
                className="w-full h-16 bg-blue-400 hover:bg-blue-500"
                variant="secondary"
              >
                {loadingAction === "reveal-matches-test" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-5 w-5" />
                )}
                Reveal Matches (Test Users Only)
              </Button>
            </div>
          </div>

          {/* Clear Test Matches Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-blue-200">
            <div className="flex-1 space-y-2">
              {actionMessages["clear-matches-test"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["clear-matches-test"].type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["clear-matches-test"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "clear-matches-test",
                    "/api/admin/clear-matches-test"
                  )
                }
                disabled={loadingAction !== null}
                className="w-full h-12 bg-red-600 hover:bg-red-700"
                variant="destructive"
              >
                {loadingAction === "clear-matches-test" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-5 w-5" />
                )}
                Clear All Test Matches & Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Workflow - Production Users */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-purple-900">
            🚀 Production Users Matching Workflow
          </CardTitle>
          <p className="text-sm text-purple-700">
            Manage matching for real users (isTestUser=false) - Execute after
            January 31st
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Run Matching for Production Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["start-matching-production"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["start-matching-production"].type ===
                    "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["start-matching-production"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "start-matching-production",
                    "/api/admin/start-matching-production"
                  )
                }
                disabled={
                  loadingAction !== null ||
                  matchingState.hasAssignments ||
                  matchingState.hasRevealed
                }
                className="w-full h-16 bg-purple-600 hover:bg-purple-700"
                title={
                  matchingState.hasAssignments
                    ? "Clear matches first to run again"
                    : ""
                }
              >
                {loadingAction === "start-matching-production" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Play className="mr-2 h-5 w-5" />
                )}
                Run Matching (Production Users)
              </Button>
            </div>
          </div>

          {/* Step 2: Pair Cupids - Production Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["pair-cupids-production"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["pair-cupids-production"].type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["pair-cupids-production"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "pair-cupids-production",
                    "/api/admin/pair-cupids-production"
                  )
                }
                disabled={loadingAction !== null || !matchingState.hasMatches}
                className="w-full h-16 bg-purple-500 hover:bg-purple-600"
                variant="outline"
                title={
                  !matchingState.hasMatches
                    ? "Run matching algorithm first"
                    : ""
                }
              >
                {loadingAction === "pair-cupids-production" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Users className="mr-2 h-5 w-5" />
                )}
                Assign Cupids (Production Users)
              </Button>
            </div>
          </div>

          {/* Step 3: Reveal Matches - Production Users */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1 space-y-2">
              {actionMessages["reveal-matches-production"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["reveal-matches-production"].type ===
                    "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["reveal-matches-production"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "reveal-matches-production",
                    "/api/admin/reveal-matches-production"
                  )
                }
                disabled={loadingAction !== null || !matchingState.hasMatches}
                className="w-full h-16 bg-purple-400 hover:bg-purple-500"
                variant="secondary"
                title={!matchingState.hasMatches ? "Create matches first" : ""}
              >
                {loadingAction === "reveal-matches-production" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-5 w-5" />
                )}
                Reveal Matches (Production Users - Feb 7)
              </Button>
            </div>
          </div>

          {/* Clear Production Matches Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-purple-200">
            <div className="flex-1 space-y-2">
              {actionMessages["clear-matches-production"] && (
                <p
                  className={`text-sm px-3 py-2 rounded ${
                    actionMessages["clear-matches-production"].type ===
                    "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {actionMessages["clear-matches-production"].message}
                </p>
              )}
              <Button
                onClick={() =>
                  handleAction(
                    "clear-matches-production",
                    "/api/admin/clear-matches-production"
                  )
                }
                disabled={loadingAction !== null}
                className="w-full h-12 bg-red-600 hover:bg-red-700"
                variant="destructive"
              >
                {loadingAction === "clear-matches-production" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-5 w-5" />
                )}
                Clear All Production Matches & Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Data Generation */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900">🧪 Test Data</CardTitle>
          <p className="text-sm text-blue-700">
            Generate test users for development and testing
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionMessages["generate-match-users"] && (
            <p
              className={`text-sm px-3 py-2 rounded ${
                actionMessages["generate-match-users"].type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionMessages["generate-match-users"].message}
            </p>
          )}
          {actionMessages["generate-cupid-users"] && (
            <p
              className={`text-sm px-3 py-2 rounded ${
                actionMessages["generate-cupid-users"].type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionMessages["generate-cupid-users"].message}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateUsers("match")}
              disabled={loadingAction !== null}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              variant="default"
            >
              {loadingAction === "generate-match-users" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add 125 Match Users
            </Button>
            <Button
              onClick={() => handleGenerateUsers("cupid")}
              disabled={loadingAction !== null}
              className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
              variant="default"
            >
              {loadingAction === "generate-cupid-users" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UsersRound className="mr-2 h-4 w-4" />
              )}
              Add 125 Cupid Users
            </Button>
          </div>
          <p className="text-xs text-blue-600">
            💡 Password for all test users:{" "}
            <code className="bg-blue-100 px-1 py-0.5 rounded">
              TestPassword123!
            </code>
          </p>
          <p className="text-xs text-blue-600">
            ✅ Match users include completed questionnaires with randomized
            responses
          </p>
          <p className="text-xs text-blue-600">
            ℹ️ Each button click adds 125 more users (cumulative)
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-900">⚠️ Danger Zone</CardTitle>
          <p className="text-sm text-red-700">
            These actions are destructive and cannot be undone
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionMessages["clear-matches"] && (
            <p
              className={`text-sm px-3 py-2 rounded ${
                actionMessages["clear-matches"].type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionMessages["clear-matches"].message}
            </p>
          )}
          <Button
            onClick={() =>
              handleAction("clear-matches", "/api/admin/clear-matches")
            }
            disabled={loadingAction !== null}
            className="w-full h-12"
            variant="destructive"
          >
            {loadingAction === "clear-matches" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-5 w-5" />
            )}
            Clear All Matches & Reset
          </Button>
          {actionMessages["clear-test-users"] && (
            <p
              className={`text-sm px-3 py-2 rounded ${
                actionMessages["clear-test-users"].type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {actionMessages["clear-test-users"].message}
            </p>
          )}
          <Button
            onClick={handleClearTestUsers}
            disabled={loadingAction !== null}
            className="w-full h-12 bg-orange-600 hover:bg-orange-700"
            variant="destructive"
          >
            {loadingAction === "clear-test-users" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-5 w-5" />
            )}
            Delete All Test Users
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
