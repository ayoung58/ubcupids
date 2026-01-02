"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Users,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Hourglass,
  Clock,
  Check,
  X,
  Send,
  Inbox,
} from "lucide-react";

type MatchStatus = "accepted" | "pending" | "declined";

interface MatchDisplay {
  matchId: string;
  matchType: "algorithm" | "cupid_sent" | "cupid_received";
  compatibilityScore: number | null;
  cupidComment: string | null;
  status: MatchStatus;
  matchedUser: {
    firstName: string;
    displayName: string | null;
    age: number;
    email: string;
    profilePicture: string | null;
    bio: string | null;
    interests: string | null;
    pointOfContact: string | null;
  };
  revealedAt: string | null;
  createdAt: string;
  respondedAt: string | null;
}

interface UserMatchesData {
  algorithmMatches: MatchDisplay[];
  requestsSent: MatchDisplay[];
  requestsReceived: MatchDisplay[];
  totalMatches: number;
  batchNumber: number;
  isRevealed: boolean;
}

export function MatchesDisplay() {
  const [data, setData] = useState<UserMatchesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "algorithm" | "cupid_sent" | "cupid_received"
  >("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/matches");
      if (!res.ok) {
        throw new Error("Failed to fetch matches");
      }
      const responseData = await res.json();
      setData(responseData);
    } catch (err) {
      setError("Failed to load matches. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToRequest = async (
    matchId: string,
    action: "accept" | "decline"
  ) => {
    try {
      const res = await fetch("/api/matches/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to respond to match request");
      }

      toast({
        title: action === "accept" ? "Match Accepted! 💘" : "Match Declined",
        description:
          action === "accept"
            ? "You can now see their contact information!"
            : "The match request has been declined.",
      });

      // Refresh matches
      await fetchMatches();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-700">{error}</h2>
              <Button onClick={fetchMatches} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Matches not yet revealed
  if (!data?.isRevealed) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Header />
          <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <Hourglass className="h-16 w-16 mx-auto text-pink-400 mb-6" />
              <h2 className="text-2xl font-bold text-pink-700 mb-2">
                Matching in Progress
              </h2>
              <p className="text-pink-600 max-w-md mx-auto">
                The cupids are working hard behind the scenes to match you up!
                Matches will be revealed on February 7th, stay tuned! 💘
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
                <Clock className="h-4 w-4" />
                <span>Batch {data?.batchNumber || 1}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No matches
  if (data.totalMatches === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Header />
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-slate-300 mb-6" />
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                No Matches Yet
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find compatible matches for you this batch.
                Don&apos;t worry - keep your profile updated!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Combine all matches for filtering
  const allMatches = [
    ...data.algorithmMatches,
    ...data.requestsSent,
    ...data.requestsReceived,
  ];

  const filteredMatches = getSortedAndFilteredMatches(allMatches, filterType);

  // Count matches by type
  const counts = {
    all: allMatches.length,
    algorithm: data.algorithmMatches.length,
    cupid_sent: data.requestsSent.length,
    cupid_received: data.requestsReceived.length,
  };

  // Show matches with category filter
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Header />

        {/* Category Filter Tabs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                All Matches ({counts.all})
              </Button>
              <Button
                variant={filterType === "algorithm" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("algorithm")}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Algorithm ({counts.algorithm})
              </Button>
              <Button
                variant={filterType === "cupid_sent" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("cupid_sent")}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Your Cupid&apos;s Picks ({counts.cupid_sent})
              </Button>
              <Button
                variant={
                  filterType === "cupid_received" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setFilterType("cupid_received")}
                className="flex items-center gap-2"
              >
                <Inbox className="h-4 w-4" />
                Match Requests ({counts.cupid_received})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matches Display */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">
                  No matches in this category yet
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match) => {
              if (match.matchType === "algorithm") {
                return <AlgorithmMatchCard key={match.matchId} match={match} />;
              } else if (match.matchType === "cupid_received") {
                return (
                  <MatchRequestCard
                    key={match.matchId}
                    match={match}
                    onRespond={handleRespondToRequest}
                  />
                );
              } else {
                return <RequestSentCard key={match.matchId} match={match} />;
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to sort and filter matches
function getSortedAndFilteredMatches(
  matches: MatchDisplay[],
  filterType: "all" | "algorithm" | "cupid_sent" | "cupid_received"
): MatchDisplay[] {
  // Filter matches
  const filtered =
    filterType === "all"
      ? matches
      : matches.filter((m) => m.matchType === filterType);

  // Sort: cupid_sent > algorithm > cupid_received
  return filtered.sort((a, b) => {
    const order = { cupid_sent: 1, algorithm: 2, cupid_received: 3 };
    return order[a.matchType] - order[b.matchType];
  });
}

function Header() {
  return (
    <div>
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="hover:bg-slate-200 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
        <Heart className="h-8 w-8 text-pink-500" />
        My Matches
      </h1>
      <p className="text-slate-600 mt-1">
        Here are the people we think you&apos;ll connect with!
      </p>
    </div>
  );
}

// Algorithm Match Card - Always accepted, shows full contact info
function AlgorithmMatchCard({ match }: { match: MatchDisplay }) {
  const displayName =
    match.matchedUser.displayName || match.matchedUser.firstName;
  const initials = match.matchedUser.firstName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const contactInfo =
    match.matchedUser.pointOfContact || match.matchedUser.email;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {match.matchedUser.profilePicture && (
              <AvatarImage
                src={match.matchedUser.profilePicture}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-lg bg-purple-100 text-purple-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {displayName}, {match.matchedUser.age}
                </h3>
                {match.compatibilityScore && (
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    {Math.round(match.compatibilityScore)}% Compatible
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-slate-700 mb-1">
                Contact:
              </p>
              <p className="text-sm text-slate-900 font-mono break-all">
                {contactInfo}
              </p>
            </div>

            {match.matchedUser.bio && (
              <p className="text-slate-600 mt-3">{match.matchedUser.bio}</p>
            )}

            {match.matchedUser.interests && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  <span className="font-medium">Interests:</span>{" "}
                  {match.matchedUser.interests}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Match Request Card - For cupid_received, shows accept/decline buttons
function MatchRequestCard({
  match,
  onRespond,
}: {
  match: MatchDisplay;
  onRespond: (matchId: string, action: "accept" | "decline") => void;
}) {
  const displayName =
    match.matchedUser.displayName || match.matchedUser.firstName;
  const initials = match.matchedUser.firstName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: "accept" | "decline") => {
    setIsProcessing(true);
    await onRespond(match.matchId, action);
    setIsProcessing(false);
  };

  // If already responded
  if (match.status !== "pending") {
    const contactInfo =
      match.matchedUser.pointOfContact || match.matchedUser.email;
    const statusColor =
      match.status === "accepted"
        ? "bg-green-50 border-green-200"
        : "bg-slate-50 border-slate-200";
    const statusText = match.status === "accepted" ? "Accepted ✓" : "Declined";

    return (
      <Card className={`${statusColor}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {match.matchedUser.profilePicture && (
                <AvatarImage
                  src={match.matchedUser.profilePicture}
                  alt={displayName}
                />
              )}
              <AvatarFallback className="text-lg bg-green-100 text-green-600">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {displayName}, {match.matchedUser.age}
                  </h3>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 bg-slate-200 text-slate-700">
                    {statusText}
                  </span>
                </div>
              </div>

              {match.status === "accepted" && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Contact:
                  </p>
                  <p className="text-sm text-slate-900 font-mono break-all">
                    {contactInfo}
                  </p>
                </div>
              )}

              {match.cupidComment && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    💘 Cupid says:
                  </p>
                  <p className="text-sm text-slate-700 italic">
                    &quot;{match.cupidComment}&quot;
                  </p>
                </div>
              )}

              {match.matchedUser.bio && (
                <p className="text-slate-600 mt-3">{match.matchedUser.bio}</p>
              )}

              {match.matchedUser.interests && (
                <div className="mt-3">
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Interests:</span>{" "}
                    {match.matchedUser.interests}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending - show accept/decline buttons
  return (
    <Card className="hover:shadow-md transition-shadow border-2 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {match.matchedUser.profilePicture && (
              <AvatarImage
                src={match.matchedUser.profilePicture}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-lg bg-green-100 text-green-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {displayName}, {match.matchedUser.age}
                </h3>
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 bg-yellow-100 text-yellow-700">
                  Pending Response
                </span>
              </div>
            </div>

            {match.cupidComment && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  💘 Cupid says:
                </p>
                <p className="text-sm text-slate-700 italic">
                  &quot;{match.cupidComment}&quot;
                </p>
              </div>
            )}

            {match.matchedUser.bio && (
              <p className="text-slate-600 mt-3">{match.matchedUser.bio}</p>
            )}

            {match.matchedUser.interests && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  <span className="font-medium">Interests:</span>{" "}
                  {match.matchedUser.interests}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => handleAction("accept")}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Match
              </Button>
              <Button
                onClick={() => handleAction("decline")}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-slate-300 hover:bg-slate-100"
              >
                <X className="h-4 w-4 mr-2" />
                Pass
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Contact info will be revealed if you accept
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Request Sent Card - Shows status of requests your cupid sent
function RequestSentCard({ match }: { match: MatchDisplay }) {
  const displayName =
    match.matchedUser.displayName || match.matchedUser.firstName;
  const initials = match.matchedUser.firstName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const contactInfo =
    match.matchedUser.pointOfContact || match.matchedUser.email;

  const statusConfig = {
    pending: {
      color: "bg-yellow-50 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
      text: "⏳ Pending",
    },
    accepted: {
      color: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
      text: "✓ Accepted",
    },
    declined: {
      color: "bg-slate-50 border-slate-200",
      badge: "bg-slate-100 text-slate-700",
      text: "✗ Declined",
    },
  }[match.status];

  return (
    <Card className={statusConfig.color}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {match.matchedUser.profilePicture && (
              <AvatarImage
                src={match.matchedUser.profilePicture}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {displayName}, {match.matchedUser.age}
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusConfig.badge}`}
                >
                  {statusConfig.text}
                </span>
              </div>
            </div>

            {match.status === "accepted" && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Contact:
                </p>
                <p className="text-sm text-slate-900 font-mono break-all">
                  {contactInfo}
                </p>
              </div>
            )}

            {match.status === "pending" && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-slate-700">
                  Waiting for them to accept or decline your match request
                </p>
              </div>
            )}

            {match.cupidComment && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  💘 Your cupid&apos;s reasoning:
                </p>
                <p className="text-sm text-slate-700 italic">
                  &quot;{match.cupidComment}&quot;
                </p>
              </div>
            )}

            {match.matchedUser.bio && (
              <p className="text-slate-600 mt-3">{match.matchedUser.bio}</p>
            )}

            {match.matchedUser.interests && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  <span className="font-medium">Interests:</span>{" "}
                  {match.matchedUser.interests}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchCard({ match }: { match: MatchDisplay }) {
  const displayName =
    match.matchedUser.displayName || match.matchedUser.firstName;
  const initials = match.matchedUser.firstName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const matchTypeLabel = {
    algorithm: "Algorithm Match",
    cupid_sent: "Your Cupid's Choice",
    cupid_received: "Other Cupids' Choice",
  }[match.matchType];

  const matchTypeColor = {
    algorithm: "bg-purple-100 text-purple-700",
    cupid_sent: "bg-blue-100 text-blue-700",
    cupid_received: "bg-green-100 text-green-700",
  }[match.matchType];

  const matchTypeBorder = {
    algorithm: "border-l-4 border-l-purple-500",
    cupid_sent: "border-l-4 border-l-blue-500",
    cupid_received: "border-l-4 border-l-green-500",
  }[match.matchType];

  // Determine which contact info to show
  const contactInfo =
    match.matchedUser.pointOfContact || match.matchedUser.email;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${matchTypeBorder}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {match.matchedUser.profilePicture && (
              <AvatarImage
                src={match.matchedUser.profilePicture}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-lg bg-pink-100 text-pink-600">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {displayName}, {match.matchedUser.age}
                </h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${matchTypeColor}`}
                >
                  {matchTypeLabel}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-1">
                Contact:
              </p>
              <p className="text-sm text-slate-900 font-mono">{contactInfo}</p>
            </div>

            {match.matchedUser.bio && (
              <p className="text-slate-600 mt-3 line-clamp-2">
                {match.matchedUser.bio}
              </p>
            )}

            {match.matchedUser.interests && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  <span className="font-medium">Interests:</span>{" "}
                  {match.matchedUser.interests}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
