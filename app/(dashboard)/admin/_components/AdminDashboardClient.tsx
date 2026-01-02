"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Play,
  Users,
  Eye,
  Trash2,
  Settings,
  Calendar,
  CheckCircle2,
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
  const { toast } = useToast();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: string, endpoint: string) => {
    setLoadingAction(action);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber: 1 }), // Always batch 1
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Action completed successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.error || "Action failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive",
      });
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

      {/* Matching Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Workflow</CardTitle>
          <p className="text-sm text-slate-600">
            Execute these steps in order after the January 31st deadline
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Run Matching */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </div>
            <Button
              onClick={() =>
                handleAction("start-matching", "/api/admin/start-matching")
              }
              disabled={
                loadingAction !== null ||
                matchingState.hasAssignments ||
                matchingState.hasRevealed
              }
              className="flex-1 h-16"
              title={
                matchingState.hasAssignments
                  ? "Clear matches first to run again"
                  : ""
              }
            >
              {loadingAction === "start-matching" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Run Matching Algorithm
            </Button>
          </div>

          {/* Step 2: Pair Cupids */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </div>
            <Button
              onClick={() =>
                handleAction("pair-cupids", "/api/admin/pair-cupids")
              }
              disabled={
                loadingAction !== null ||
                !matchingState.hasMatches ||
                matchingState.hasRevealed
              }
              className="flex-1 h-16"
              variant="outline"
              title={
                !matchingState.hasMatches ? "Run matching algorithm first" : ""
              }
            >
              {loadingAction === "pair-cupids" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Users className="mr-2 h-5 w-5" />
              )}
              Assign Cupids to Candidates
            </Button>
          </div>

          {/* Step 3: Reveal to Cupids */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              3
            </div>
            <Button
              onClick={() =>
                handleAction("reveal-top-5", "/api/admin/reveal-top-5")
              }
              disabled={loadingAction !== null || !matchingState.hasAssignments}
              className="flex-1 h-16"
              variant="secondary"
              title={!matchingState.hasAssignments ? "Assign cupids first" : ""}
            >
              {loadingAction === "reveal-top-5" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Top 5 to Cupids
            </Button>
          </div>

          {/* Step 4: Reveal to Candidates */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              4
            </div>
            <Button
              onClick={() =>
                handleAction("reveal-matches", "/api/admin/reveal-matches")
              }
              disabled={loadingAction !== null || !matchingState.hasMatches}
              className="flex-1 h-16"
              variant="secondary"
              title={!matchingState.hasMatches ? "Create matches first" : ""}
            >
              {loadingAction === "reveal-matches" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Matches to Candidates (Feb 7)
            </Button>
          </div>
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
        <CardContent>
          <Button
            onClick={() =>
              handleAction("clear-matches", "/api/admin/clear-matches")
            }
            disabled={loadingAction !== null}
            className="w-full h-16"
            variant="destructive"
          >
            {loadingAction === "clear-matches" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-5 w-5" />
            )}
            Clear All Matches & Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
