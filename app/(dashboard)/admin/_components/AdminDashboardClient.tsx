"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Play,
  Users,
  UserPlus,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminDashboardClientProps {
  adminName: string;
  currentBatch: number;
  batch1Status: string;
  batch2Status: string;
}

export function AdminDashboardClient({
  adminName,
  currentBatch: initialBatch,
  batch1Status: initialBatch1Status,
  batch2Status: initialBatch2Status,
}: AdminDashboardClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentBatch, setCurrentBatch] = useState(initialBatch);
  const [batch1Status, setBatch1Status] = useState(initialBatch1Status);
  const [batch2Status, setBatch2Status] = useState(initialBatch2Status);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const batch1HasRun = batch1Status !== "pending";
  const batch2Enabled = batch1HasRun;

  const handleAction = async (
    action: string,
    endpoint: string,
    batch?: number
  ) => {
    const actionKey = batch ? `${action}-${batch}` : action;
    setLoadingAction(actionKey);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber: batch }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Action completed successfully",
        });
        // Refresh the page to get updated batch status
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-slate-900">
          🛡️ Admin Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Welcome, {adminName}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <span className="font-semibold text-primary">Current Batch:</span>
          <span className="text-2xl font-bold text-primary">
            {currentBatch}
          </span>
        </div>
      </div>

      {/* Batch Status */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium text-slate-600">Batch 1</div>
            <div className="text-lg font-semibold capitalize mt-1">
              {batch1Status}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium text-slate-600">Batch 2</div>
            <div className="text-lg font-semibold capitalize mt-1">
              {batch2Status}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Algorithm Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Algorithm</CardTitle>
          <p className="text-sm text-slate-600">
            Run the matching algorithm to generate algorithm-based matches
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button
            onClick={() =>
              handleAction("start-matching", "/api/admin/start-matching", 1)
            }
            disabled={loadingAction !== null}
            className="h-20"
          >
            {loadingAction === "start-matching-1" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            Start Matching - Batch 1
          </Button>
          <Button
            onClick={() =>
              handleAction("start-matching", "/api/admin/start-matching", 2)
            }
            disabled={loadingAction !== null || !batch2Enabled}
            className="h-20"
          >
            {loadingAction === "start-matching-2" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            Start Matching - Batch 2
          </Button>
        </CardContent>
      </Card>

      {/* Cupid Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Cupid Assignment</CardTitle>
          <p className="text-sm text-slate-600">
            Pair cupids with candidates for manual matching
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button
            onClick={() =>
              handleAction("pair-cupids", "/api/admin/pair-cupids", 1)
            }
            disabled={loadingAction !== null}
            className="h-20"
            variant="outline"
          >
            {loadingAction === "pair-cupids-1" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Users className="mr-2 h-5 w-5" />
            )}
            Pair Cupids - Batch 1
          </Button>
          <Button
            onClick={() =>
              handleAction("pair-cupids", "/api/admin/pair-cupids", 2)
            }
            disabled={loadingAction !== null || !batch2Enabled}
            className="h-20"
            variant="outline"
          >
            {loadingAction === "pair-cupids-2" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Users className="mr-2 h-5 w-5" />
            )}
            Pair Cupids - Batch 2
          </Button>
        </CardContent>
      </Card>

      {/* Reveal Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Reveal Matches</CardTitle>
          <p className="text-sm text-slate-600">
            Make matches visible to cupids and candidates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() =>
                handleAction("reveal-top-5", "/api/admin/reveal-top-5", 1)
              }
              disabled={loadingAction !== null}
              className="h-20"
              variant="secondary"
            >
              {loadingAction === "reveal-top-5-1" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Top 5 to Cupids - Batch 1
            </Button>
            <Button
              onClick={() =>
                handleAction("reveal-top-5", "/api/admin/reveal-top-5", 2)
              }
              disabled={loadingAction !== null || !batch2Enabled}
              className="h-20"
              variant="secondary"
            >
              {loadingAction === "reveal-top-5-2" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Top 5 to Cupids - Batch 2
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() =>
                handleAction("reveal-matches", "/api/admin/reveal-matches", 1)
              }
              disabled={loadingAction !== null}
              className="h-20"
              variant="secondary"
            >
              {loadingAction === "reveal-matches-1" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Matches to Candidates - Batch 1
            </Button>
            <Button
              onClick={() =>
                handleAction("reveal-matches", "/api/admin/reveal-matches", 2)
              }
              disabled={loadingAction !== null || !batch2Enabled}
              className="h-20"
              variant="secondary"
            >
              {loadingAction === "reveal-matches-2" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-5 w-5" />
              )}
              Reveal Matches to Candidates - Batch 2
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Tools</CardTitle>
          <p className="text-sm text-slate-600">
            Tools for testing and development
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() =>
              handleAction("generate-users", "/api/admin/generate-test-users")
            }
            disabled={loadingAction !== null}
            className="w-full h-16"
            variant="outline"
          >
            {loadingAction === "generate-users" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            Generate 250 Test Users
          </Button>
        </CardContent>
      </Card>

      {/* Batch Management */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-orange-900">Batch Management</CardTitle>
          <p className="text-sm text-orange-700">
            Reset and manage batch progression
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() =>
              handleAction("reset-batch-2", "/api/admin/reset-batch-2")
            }
            disabled={loadingAction !== null || !batch1HasRun}
            className="w-full h-16"
            variant="outline"
          >
            {loadingAction === "reset-batch-2" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5" />
            )}
            Reset for Batch 2
          </Button>
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
        <CardContent className="space-y-4">
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
            Clear All Matches (Current Batch)
          </Button>
          <Button
            onClick={() =>
              handleAction("reset-to-batch-1", "/api/admin/reset-to-batch-1")
            }
            disabled={loadingAction !== null}
            className="w-full h-16"
            variant="destructive"
          >
            {loadingAction === "reset-to-batch-1" ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-5 w-5" />
            )}
            Reset to Batch 1 (Testing Only)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
