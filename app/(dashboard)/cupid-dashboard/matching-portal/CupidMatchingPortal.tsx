"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Heart,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// Types matching the API response
interface ProfileHighlight {
  questionId: string;
  question: string;
  answer: string;
}

interface CupidProfileView {
  userId: string;
  firstName: string;
  age: number;
  summary: string;
  keyTraits: string[];
  lookingFor: string;
  highlights: ProfileHighlight[];
}

interface CupidPairAssignment {
  assignmentId: string;
  cupidUserId: string;
  user1: CupidProfileView;
  user2: CupidProfileView;
  algorithmScore: number;
  decision: "approve" | "reject" | null;
  decisionReason: string | null;
}

interface CupidDashboard {
  cupidId: string;
  cupidName: string;
  totalAssigned: number;
  reviewed: number;
  approved: number;
  rejected: number;
  pending: number;
  pendingPairs: CupidPairAssignment[];
}

export function CupidMatchingPortal() {
  const [dashboard, setDashboard] = useState<CupidDashboard | null>(null);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/cupid/dashboard");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard");
      }
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError("Failed to load pairs. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitDecision = async (decision: "approve" | "reject") => {
    if (!dashboard || !currentPair) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cupid/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: currentPair.assignmentId,
          decision,
          reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit decision");
      }

      // Remove the reviewed pair and move to next
      setDashboard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pendingPairs: prev.pendingPairs.filter(
            (p) => p.assignmentId !== currentPair.assignmentId
          ),
          reviewed: prev.reviewed + 1,
          approved: decision === "approve" ? prev.approved + 1 : prev.approved,
          rejected: decision === "reject" ? prev.rejected + 1 : prev.rejected,
          pending: prev.pending - 1,
        };
      });

      // Reset reason field
      setReason("");

      // Adjust index if needed
      if (currentPairIndex >= dashboard.pendingPairs.length - 1) {
        setCurrentPairIndex(Math.max(0, currentPairIndex - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPair = dashboard?.pendingPairs[currentPairIndex];

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

  if (!dashboard || dashboard.pendingPairs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton />
          <StatsHeader dashboard={dashboard} />
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-700">All Done!</h2>
              <p className="text-green-600 mt-2">
                You&apos;ve reviewed all assigned pairs. Great work, Cupid! 💘
              </p>
              <Link href="/cupid-dashboard">
                <Button className="mt-6">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton />
        <StatsHeader dashboard={dashboard} />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPairIndex((i) => Math.max(0, i - 1))}
            disabled={currentPairIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-slate-600">
            Pair {currentPairIndex + 1} of {dashboard.pendingPairs.length}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPairIndex((i) =>
                Math.min(dashboard.pendingPairs.length - 1, i + 1)
              )
            }
            disabled={currentPairIndex === dashboard.pendingPairs.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Algorithm Score Banner */}
        {currentPair && (
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="p-4 flex items-center justify-center gap-3">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <span className="font-medium">
                Algorithm Compatibility Score:{" "}
                <span className="text-lg font-bold text-pink-600">
                  {currentPair.algorithmScore.toFixed(1)}%
                </span>
              </span>
            </CardContent>
          </Card>
        )}

        {/* Split Screen Comparison */}
        {currentPair && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfileCard profile={currentPair.user1} side="left" />
            <ProfileCard profile={currentPair.user2} side="right" />
          </div>
        )}

        {/* Decision Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Optional: Add a note about why you're approving or rejecting this match..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => submitDecision("reject")}
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 mr-2" />
                Reject Match
              </Button>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => submitDecision("approve")}
                disabled={isSubmitting}
              >
                <Check className="h-5 w-5 mr-2" />
                Approve Match
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-components

function BackButton() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/cupid-dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}

function StatsHeader({ dashboard }: { dashboard: CupidDashboard | null }) {
  if (!dashboard) return null;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          🎯 Matching Portal
        </h1>
        <p className="text-slate-600">
          Welcome, {dashboard.cupidName}! Review pairs and create matches.
        </p>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
          <span className="text-slate-500">Pending: </span>
          <span className="font-bold text-orange-600">{dashboard.pending}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
          <span className="text-slate-500">Approved: </span>
          <span className="font-bold text-green-600">{dashboard.approved}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
          <span className="text-slate-500">Rejected: </span>
          <span className="font-bold text-red-600">{dashboard.rejected}</span>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  side,
}: {
  profile: CupidProfileView;
  side: "left" | "right";
}) {
  const borderColor =
    side === "left" ? "border-l-blue-500" : "border-l-pink-500";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {profile.firstName}, {profile.age}
            </CardTitle>
          </div>
          <Users className="h-5 w-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Summary */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Summary
          </h4>
          <p className="text-slate-600 text-sm">{profile.summary}</p>
        </div>

        {/* Key Traits */}
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Key Traits</h4>
          <div className="flex flex-wrap gap-2">
            {profile.keyTraits.map((trait, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Looking For */}
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Looking For</h4>
          <p className="text-slate-600 text-sm">{profile.lookingFor}</p>
        </div>

        {/* Question Highlights */}
        {profile.highlights.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">
              Response Highlights
            </h4>
            <div className="space-y-3">
              {profile.highlights.map((h, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs text-slate-500">{h.question}</p>
                  <p className="text-sm text-slate-700">{h.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" />
        <div className="flex justify-between">
          <Skeleton className="h-12 w-60" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
