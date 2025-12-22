"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Users,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Hourglass,
} from "lucide-react";

interface MatchDisplay {
  matchId: string;
  matchType: "algorithm" | "cupid_sent" | "cupid_received";
  compatibilityScore: number | null;
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
}

interface UserMatchesData {
  matches: MatchDisplay[];
  totalMatches: number;
  algorithmMatches: number;
  cupidSentMatches: number;
  cupidReceivedMatches: number;
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Header />
          <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <Hourglass className="h-16 w-16 mx-auto text-pink-400 mb-6" />
              <h2 className="text-2xl font-bold text-pink-700 mb-2">
                Matching in Progress
              </h2>
              <p className="text-pink-600 max-w-md mx-auto">
                The cupids are working hard behind the scenes to match you up!
                Matches will be revealed on Feb. 1, stay tuned! 💘
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Header />
          <Card className="border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-slate-300 mb-6" />
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                No Matches Yet
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find compatible matches for you this batch.
                Don&apos;t worry - there&apos;s always the next batch!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show matches
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Header />

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => setFilterType("all")}
            variant={filterType === "all" ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            All ({data.totalMatches})
          </Button>
          <Button
            onClick={() => setFilterType("cupid_sent")}
            variant={filterType === "cupid_sent" ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4 text-blue-500" />
            Your Cupid's Choice ({data.cupidSentMatches})
          </Button>
          <Button
            onClick={() => setFilterType("algorithm")}
            variant={filterType === "algorithm" ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            Algorithm ({data.algorithmMatches})
          </Button>
          <Button
            onClick={() => setFilterType("cupid_received")}
            variant={filterType === "cupid_received" ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4 text-green-500" />
            Other Cupids' Choice ({data.cupidReceivedMatches})
          </Button>
        </div>

        {/* Match Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Your Matches</h2>
          {getSortedAndFilteredMatches(data.matches, filterType).map(
            (match) => (
              <MatchCard key={match.matchId} match={match} />
            )
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
  const contactInfo = match.matchedUser.pointOfContact || match.matchedUser.email;

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
              <p className="text-sm text-slate-900 font-mono">
                {contactInfo}
              </p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
