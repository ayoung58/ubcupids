"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, ChevronDown, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileButtonProps {
  firstName: string;
  lastName: string;
  profilePicture: string;
  isCupid?: boolean;
  isBeingMatched?: boolean;
}

export function ProfileButton({
  firstName,
  lastName,
  profilePicture: initialProfilePicture,
  isCupid: initialIsCupid = false,
  isBeingMatched: initialIsBeingMatched = true,
}: ProfileButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture);
  const [isCupid, setIsCupid] = useState(initialIsCupid);
  const [isBeingMatched, setIsBeingMatched] = useState(initialIsBeingMatched);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current dashboard based on pathname
  const isOnCupidDashboard = pathname?.startsWith("/cupid-dashboard");
  const currentDashboard: "cupid" | "match" = isOnCupidDashboard
    ? "cupid"
    : "match";

  // Sync with server-provided prop when it changes
  useEffect(() => {
    setProfilePicture(initialProfilePicture);
  }, [initialProfilePicture]);

  // Fetch latest profile picture and account info
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfilePicture(data.profilePicture || "");
        setIsCupid(data.isCupid || false);
        setIsBeingMatched(data.isBeingMatched ?? true);
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const hasBothAccounts = isCupid && isBeingMatched;

  const handleProfileClick = async (e: React.MouseEvent) => {
    // Update lastActiveDashboard before navigating to profile
    try {
      await fetch("/api/profile/switch-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard: currentDashboard }),
      });
    } catch (error) {
      console.error("Error updating dashboard preference:", error);
    }
    setIsOpen(false);
  };

  const handleSwitchDashboard = async (targetDashboard: "cupid" | "match") => {
    setIsSwitching(true);
    setIsOpen(false);

    try {
      const response = await fetch("/api/profile/switch-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard: targetDashboard }),
      });

      if (response.ok) {
        // Redirect to the appropriate dashboard
        if (targetDashboard === "cupid") {
          router.push("/cupid-dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Error switching dashboard:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <Avatar className="h-10 w-10 border-2 border-slate-200">
          <AvatarImage
            src={profilePicture || undefined}
            alt={`${firstName} ${lastName}`}
          />
          <AvatarFallback className="bg-primary text-white font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          className={`h-4 w-4 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/profile"
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

          {/* Dashboard Switching - Only show if user has both accounts */}
          {hasBothAccounts && (
            <>
              <div className="border-t border-slate-200 my-2" />
              <button
                onClick={() =>
                  handleSwitchDashboard(isOnCupidDashboard ? "match" : "cupid")
                }
                disabled={isSwitching}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSwitching ? "animate-spin" : ""}`}
                />
                Switch to {isOnCupidDashboard ? "Match" : "Cupid"} Dashboard
              </button>
            </>
          )}

          <div className="border-t border-slate-200 my-2" />

          <Link
            href="/signout"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      )}
    </div>
  );
}
