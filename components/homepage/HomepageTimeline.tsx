"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  ClipboardList,
  Clock,
  Heart,
  MessageCircle,
  Users,
  ThumbsUp,
  Target,
  Search,
  CheckCircle,
  Send,
  Star,
} from "lucide-react";

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const matchCandidateJourney: TimelineStep[] = [
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: "Sign Up",
    description:
      "Create your account with your UBC email and set up your profile.",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Complete Questionnaire",
    description:
      "Fill out our compatibility questionnaire by Jan. 31 to help us find your perfect match.",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Wait for Matching",
    description:
      "The algorithm and human cupids work together to find you the best matches.",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Get Matched",
    description:
      "Receive your Valentine's Day matches on Feb. 8 with personalized rationale from your cupid!",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Accept or Decline",
    description:
      "Review your match requests and choose which connections to pursue.",
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Contact Your Match(es)",
    description:
      "Reach out to your matches using the contact info they've shared.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Meet Up!",
    description:
      "Take the next step and meet your match in person, in time for Valentine's Day. Have fun!",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Rate Your Experience",
    description: "Let us know how it went! Your feedback helps us improve.",
  },
];

const cupidJourney: TimelineStep[] = [
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: "Sign Up as Cupid",
    description:
      "Create a cupid account by Jan. 31 to help match others at UBC. You can choose to represent a specifc person if you'd like!",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Get Assigned Candidates",
    description:
      "Receive candidates who need your help finding their perfect match.",
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "Review Potential Matches",
    description:
      "Compare profiles and questionnaires to find the best compatibility.",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Select a Match",
    description:
      "Choose the best match and provide rationale for your decision.",
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: "Submit Your Picks",
    description:
      "Send your match selections by Feb. 7 to help create Valentine's Day connections!",
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: "Provide Feedback",
    description:
      "Share your experience as a cupid to help us improve the process.",
  },
];

function TimelineItem({
  step,
  index,
  isLeft,
  isVisible,
}: {
  step: TimelineStep;
  index: number;
  isLeft: boolean;
  isVisible: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 mb-8 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${isLeft ? "flex-row" : "flex-row-reverse"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Content Card */}
      <div
        className={`flex-1 max-w-xs sm:max-w-sm ${isLeft ? "text-right" : "text-left"}`}
      >
        <div
          className={`bg-white rounded-xl shadow-md p-4 sm:p-5 border border-slate-200 hover:shadow-lg transition-shadow ${
            isLeft ? "ml-auto" : "mr-auto"
          }`}
        >
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">
            {step.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600">
            {step.description}
          </p>
        </div>
      </div>

      {/* Icon Circle */}
      <div
        className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
          isVisible ? "scale-100" : "scale-0"
        }`}
        style={{ transitionDelay: `${index * 100 + 200}ms` }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white">
          {step.icon}
        </div>
      </div>

      {/* Spacer for alternating layout */}
      <div className="flex-1 max-w-xs sm:max-w-sm" />
    </div>
  );
}

function Timeline({
  steps,
  title,
  color,
}: {
  steps: TimelineStep[];
  title: string;
  color: "pink" | "purple";
}) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(
              entry.target.getAttribute("data-index") || "0"
            );
            setVisibleItems((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    const items = containerRef.current?.querySelectorAll("[data-index]");
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const gradientClass =
    color === "pink"
      ? "from-pink-500 to-rose-500"
      : "from-purple-500 to-indigo-500";

  return (
    <div className="relative" ref={containerRef}>
      {/* Timeline Title */}
      <div className="text-center mb-8">
        <h3
          className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}
        >
          {title}
        </h3>
      </div>

      {/* Vertical Line */}
      <div className="absolute left-1/2 top-16 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-rose-300 to-pink-300 transform -translate-x-1/2" />

      {/* Timeline Items */}
      <div className="relative">
        {steps.map((step, index) => (
          <div key={index} data-index={index}>
            <TimelineItem
              step={step}
              index={index}
              isLeft={index % 2 === 0}
              isVisible={visibleItems.has(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomepageTimeline() {
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Also make the section visible after a delay in case user doesn't scroll
    const timeout = setTimeout(() => {
      setSectionVisible(true);
    }, 1000); // 1 second delay

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Section Header */}
      <div
        ref={sectionRef}
        className={`text-center py-12 sm:py-16 transition-all duration-1000 ${
          sectionVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          How It Works
        </h2>
        <p className="text-slate-600 max-w-3xl mx-auto px-4 text-sm sm:text-base">
          Whether you&apos;re looking for love or helping others find it,
          here&apos;s what your journey looks like
        </p>
      </div>

      {/* Timelines Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Match Candidate Journey */}
          <div className="relative">
            <Timeline
              steps={matchCandidateJourney}
              title="💘 As a Match Candidate"
              color="pink"
            />
          </div>

          {/* Cupid Journey */}
          <div className="relative">
            <Timeline
              steps={cupidJourney}
              title="🏹 As a Cupid"
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div
        className={`text-center py-12 sm:py-16 transition-all duration-1000 delay-500 ${
          sectionVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          Ready to Get Started?
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <Link href="/register?type=match">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8"
            >
              <Heart className="w-5 h-5 mr-2" />
              Sign Up as Match
            </Button>
          </Link>
          <Link href="/register?type=cupid">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-8"
            >
              <Target className="w-5 h-5 mr-2" />
              Sign Up as Cupid
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold">💘 UBCupids</p>
              <p className="text-slate-400 text-sm mt-1">
                Find your Valentine&apos;s Day match at UBC
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm">
              <Link
                href="/user-guide"
                className="text-slate-400 hover:text-white transition-colors"
              >
                User Guide
              </Link>
              <Link
                href="/privacy"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Privacy & Terms
              </Link>
              <a
                href="mailto:support@ubcupids.org"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </a>{" "}
              <a
                href="https://www.instagram.com/ubcupids/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                title="Follow us on Instagram"
              >
                Instagram
              </a>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-6 pt-6 text-center text-slate-400 text-sm">
            © {new Date().getFullYear()} UBCupids. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
