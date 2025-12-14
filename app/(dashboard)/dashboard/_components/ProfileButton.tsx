"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileButtonProps {
  firstName: string;
  lastName: string;
  profilePicture: string;
}

export function ProfileButton({
  firstName,
  lastName,
  profilePicture: initialProfilePicture,
}: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch latest profile picture
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profilePicture) {
          setProfilePicture(data.profilePicture);
        }
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
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

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
