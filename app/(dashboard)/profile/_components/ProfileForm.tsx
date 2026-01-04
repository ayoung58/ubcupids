"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Upload,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { ProfileFormData } from "@/types/profile";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileTutorial } from "./ProfileTutorial";

export function ProfileForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const initialProfileData = useRef<ProfileFormData | null>(null);

  // Custom validation styles
  const customValidationStyles = `
    input:invalid:not(:placeholder-shown) {
      border-color: #ef4444;
      border-width: 2px;
    }
    input:invalid:not(:placeholder-shown):focus {
      ring-color: #ef4444;
    }
  `;
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    displayName: "",
    cupidDisplayName: "",
    age: 18,
    major: "",
    interests: "",
    bio: "",
    profilePicture: "",
    pointOfContact: "",
    showBioToMatches: true,
    showProfilePicToMatches: true,
    showInterestsToMatches: true,
    showPointOfContactToMatches: true,
  });

  const [accountInfo, setAccountInfo] = useState({
    isCupid: false,
    isBeingMatched: true,
    lastActiveDashboard: "match" as "match" | "cupid",
    email: "",
    preferredCandidateEmail: "",
    profileTutorialCompleted: false,
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        const profile = {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName || data.firstName,
          cupidDisplayName:
            data.cupidDisplayName || data.displayName || data.firstName,
          age: data.age || 18,
          major: data.major || "",
          interests: data.interests || "",
          bio: data.bio || "",
          profilePicture: data.profilePicture || "",
          pointOfContact: data.pointOfContact || "",
          showBioToMatches: data.showBioToMatches ?? true,
          showProfilePicToMatches: data.showProfilePicToMatches ?? true,
          showInterestsToMatches: data.showInterestsToMatches ?? true,
          showPointOfContactToMatches: data.showPointOfContactToMatches ?? true,
        };
        setProfileData(profile);
        initialProfileData.current = profile;
        setAccountInfo({
          isCupid: data.isCupid || false,
          isBeingMatched: data.isBeingMatched ?? true,
          lastActiveDashboard: data.lastActiveDashboard || "match",
          email: data.email || "",
          preferredCandidateEmail: data.preferredCandidateEmail || "",
          profileTutorialCompleted: data.profileTutorialCompleted || false,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear any previous error
    setShowError(null);

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setShowError("Profile picture must be less than 5MB");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validate file type
    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setShowError("Only JPEG, PNG, and WebP images are allowed");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/profile/upload-picture", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData((prev) => ({ ...prev, profilePicture: data.url }));
        setHasUnsavedChanges(true);
        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Upload failed",
          description: error.error || "Failed to upload image",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await fetch("/api/profile/upload-picture", {
        method: "DELETE",
      });

      if (response.ok) {
        setProfileData((prev) => ({ ...prev, profilePicture: "" }));
        setHasUnsavedChanges(true);
        toast({
          title: "Success",
          description: "Profile picture removed",
        });
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate display name
    if (!profileData.displayName.trim()) {
      toast({
        title: "Validation error",
        description: "Display name is required",
        variant: "destructive",
      });
      // Scroll to and focus the display name field
      const displayNameField = document.getElementById("displayName");
      if (displayNameField) {
        displayNameField.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        displayNameField.focus();
        displayNameField.classList.add(
          "ring-2",
          "ring-red-500",
          "border-red-500"
        );
        // Remove highlight after 3 seconds
        setTimeout(() => {
          displayNameField.classList.remove(
            "ring-2",
            "ring-red-500",
            "border-red-500"
          );
        }, 3000);
      }
      return;
    }

    if (profileData.displayName.length > 50) {
      toast({
        title: "Validation error",
        description: "Display name must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Validate Cupid display name if user has Cupid account
    if (
      accountInfo.isCupid &&
      (!profileData.cupidDisplayName || !profileData.cupidDisplayName.trim())
    ) {
      toast({
        title: "Validation error",
        description: "Cupid display name is required",
        variant: "destructive",
      });
      // Scroll to and focus the Cupid display name field
      const cupidDisplayNameField = document.getElementById("cupidDisplayName");
      if (cupidDisplayNameField) {
        cupidDisplayNameField.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        cupidDisplayNameField.focus();
        cupidDisplayNameField.classList.add(
          "ring-2",
          "ring-red-500",
          "border-red-500"
        );
        // Remove highlight after 3 seconds
        setTimeout(() => {
          cupidDisplayNameField.classList.remove(
            "ring-2",
            "ring-red-500",
            "border-red-500"
          );
        }, 3000);
      }
      return;
    }

    if (
      accountInfo.isCupid &&
      profileData.cupidDisplayName &&
      profileData.cupidDisplayName.length > 50
    ) {
      toast({
        title: "Validation error",
        description: "Cupid display name must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Validate age if user is being matched
    if (accountInfo.isBeingMatched) {
      if (!profileData.age) {
        setShowError("Age is required for match accounts");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (profileData.age < 16 || profileData.age > 100) {
        setShowError("Age must be between 16 and 100");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (profileData.interests && profileData.interests.length > 300) {
      toast({
        title: "Validation error",
        description: "Interests must be 300 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (profileData.bio && profileData.bio.length > 300) {
      toast({
        title: "Validation error",
        description: "Bio must be 300 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Validate preferred candidate email for cupids
    if (
      accountInfo.isCupid &&
      accountInfo.preferredCandidateEmail &&
      accountInfo.preferredCandidateEmail.trim()
    ) {
      const normalizedPreferred = accountInfo.preferredCandidateEmail
        .trim()
        .toLowerCase();
      const normalizedOwn = accountInfo.email.trim().toLowerCase();

      // Check if it's a valid UBC email
      const ubcEmailRegex =
        /^[a-zA-Z0-9._%+-]+@(student\.ubc\.ca|alumni\.ubc\.ca)$/i;
      if (!ubcEmailRegex.test(normalizedPreferred)) {
        setShowError(
          "Preferred candidate email must be a valid UBC email (@student.ubc.ca or @alumni.ubc.ca)"
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileData.displayName,
          cupidDisplayName: profileData.cupidDisplayName,
          age: profileData.age,
          major: profileData.major,
          interests: profileData.interests,
          bio: profileData.bio,
          pointOfContact: profileData.pointOfContact,
          preferredCandidateEmail: accountInfo.preferredCandidateEmail,
          showBioToMatches: profileData.showBioToMatches,
          showProfilePicToMatches: profileData.showProfilePicToMatches,
          showInterestsToMatches: profileData.showInterestsToMatches,
          showPointOfContactToMatches: profileData.showPointOfContactToMatches,
        }),
      });

      if (response.ok) {
        // Show success message and scroll to top
        setShowError(null);
        setShowSuccess(true);
        setHasUnsavedChanges(false);
        // Update initial data to current saved state
        initialProfileData.current = { ...profileData };
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);

        // Refresh the page to update the profile button in header
        router.refresh();
      } else {
        const error = await response.json();
        setShowSuccess(false);
        setShowError(error.error || "Failed to update profile");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setShowSuccess(false);
      setShowError("Failed to update profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    // Check if user has both accounts
    if (accountInfo.isCupid && accountInfo.isBeingMatched) {
      setShowAccountTypeDialog(true);
    } else {
      // Only one account type, show direct confirmation
      if (accountInfo.isBeingMatched) {
        setSelectedAccountTypes(["match"]);
      } else if (accountInfo.isCupid) {
        setSelectedAccountTypes(["cupid"]);
      }
      setShowDeleteDialog(true);
    }
  };

  const handleAccountTypeSelection = () => {
    if (selectedAccountTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one account type to delete",
        variant: "destructive",
      });
      return;
    }
    setShowAccountTypeDialog(false);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountTypes: selectedAccountTypes,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // If both accounts deleted, redirect to login
        if (
          selectedAccountTypes.includes("match") &&
          selectedAccountTypes.includes("cupid")
        ) {
          toast({
            title: "Account Deleted",
            description: data.message,
          });
          // Sign out and redirect
          window.location.href = "/signout";
        } else {
          toast({
            title: "Account Deleted",
            description: data.message,
          });
          // Refresh the page to update the UI
          window.location.reload();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete account",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials =
    `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();

  const handleBackClick = (e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave this page?"
      );
      if (!confirmed) {
        e.preventDefault();
      }
    }
  };

  const handleProfileChange = (updates: Partial<ProfileFormData>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tutorial for match users */}
      {accountInfo.isBeingMatched && (
        <ProfileTutorial
          initialCompleted={accountInfo.profileTutorialCompleted}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={
            accountInfo.lastActiveDashboard === "cupid" && accountInfo.isCupid
              ? "/cupid-dashboard"
              : "/dashboard"
          }
          onClick={handleBackClick}
        >
          <Button variant="ghost" size="sm" className="hover:bg-slate-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to{" "}
            {accountInfo.lastActiveDashboard === "cupid" && accountInfo.isCupid
              ? "Cupid "
              : ""}
            Dashboard
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !hasUnsavedChanges}
          size="sm"
          data-tutorial="save-button"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Account Type Card - Moved to top for visibility */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Type</CardTitle>
          <p className="text-sm text-slate-600">
            Manage your Cupid and Match accounts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Account Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cupid Account</span>
                {accountInfo.isCupid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {accountInfo.isCupid
                  ? "You can create matches"
                  : "Not activated"}
              </p>
            </div>
            <div className="p-4 bg-slate-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Match Account</span>
                {accountInfo.isBeingMatched ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {accountInfo.isBeingMatched
                  ? "You can receive matches"
                  : "Not activated"}
              </p>
            </div>
          </div>

          {/* Account Linking Buttons */}
          {!accountInfo.isCupid && (
            <div className="pt-2">
              <Link href="/register?type=cupid&linking=true">
                <Button variant="outline" className="w-full">
                  Create Cupid Account 🏹
                </Button>
              </Link>
              <p className="text-xs text-slate-500 mt-2">
                Help match people anonymously while keeping your current account
              </p>
            </div>
          )}
          {!accountInfo.isBeingMatched && (
            <div className="pt-2">
              <Link href="/register?type=match&linking=true">
                <Button variant="outline" className="w-full">
                  Create Match Account 💖
                </Button>
              </Link>
              <p className="text-xs text-slate-500 mt-2">
                Let Cupids and the algorithm find matches for you
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <p className="text-sm text-slate-600">
            Manage your profile information and visibility settings
          </p>
        </CardHeader>

        <CardContent>
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-900 font-medium">
                All changes have been saved
              </p>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <p className="text-red-900 font-medium">{showError}</p>
            </div>
          )}

          <style>{customValidationStyles}</style>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Profile Picture */}
            <div
              className="flex flex-col items-center gap-4"
              data-tutorial="profile-picture"
            >
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-slate-200">
                  <AvatarImage src={profileData.profilePicture || undefined} />
                  <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {profileData.profilePicture && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full p-1.5 hover:bg-slate-600 transition-colors shadow-md"
                    aria-label="Remove profile picture"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <Label
                  htmlFor="profile-picture"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Picture
                    </>
                  )}
                </Label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                <p className="text-xs text-slate-500">
                  Max 5MB (JPEG, PNG, WebP)
                </p>

                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="showProfilePic"
                    checked={profileData.showProfilePicToMatches}
                    onCheckedChange={(checked) =>
                      handleProfileChange({
                        showProfilePicToMatches: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="showProfilePic"
                    className="text-sm font-normal cursor-pointer flex items-center gap-1"
                  >
                    {profileData.showProfilePicToMatches ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    Show to matches
                  </Label>
                </div>
              </div>
            </div>

            {/* Name Fields (Read-only) */}
            {/* Name Fields - Only show for Match accounts */}
            {accountInfo.isBeingMatched && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2" data-tutorial="display-name">
              <Label htmlFor="displayName">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) =>
                  handleProfileChange({ displayName: e.target.value })
                }
                maxLength={50}
                required
                placeholder="How you'd like to be called"
              />
              <p className="text-xs text-slate-500">
                {profileData.displayName.length}/50 characters
              </p>
            </div>

            {/* Cupid Display Name - Only show if user has Cupid account */}
            {accountInfo.isCupid && (
              <div className="space-y-2">
                <Label htmlFor="cupidDisplayName">
                  Cupid Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cupidDisplayName"
                  value={profileData.cupidDisplayName}
                  onChange={(e) =>
                    handleProfileChange({ cupidDisplayName: e.target.value })
                  }
                  maxLength={50}
                  required
                  placeholder="How you'd like to be called as a Cupid"
                />
                <p className="text-xs text-slate-500">
                  {(profileData.cupidDisplayName || "").length}/50 characters
                </p>
                <p className="text-xs text-slate-600">
                  This name is shown when you&apos;re acting as a Cupid in the
                  matching portal.
                </p>
              </div>
            )}

            {/* Age - Only for Match accounts */}
            {accountInfo.isBeingMatched && (
              <div className="space-y-2">
                <Label htmlFor="age" className="flex items-center gap-2">
                  Age <span className="text-red-500">*</span>
                  <div className="group relative inline-block">
                    <Info className="h-4 w-4 text-slate-400 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                      Age can only be set during signup and cannot be changed
                      later
                    </div>
                  </div>
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="100"
                  value={profileData.age}
                  onChange={(e) =>
                    handleProfileChange({ age: parseInt(e.target.value) || 18 })
                  }
                  required
                  placeholder="18"
                  disabled={profileData.age > 0}
                  className={
                    profileData.age > 0 ? "bg-slate-100 cursor-not-allowed" : ""
                  }
                />
                <p className="text-xs text-slate-600">
                  Age is set during account creation and cannot be changed.
                </p>
              </div>
            )}

            {/* Major - Only for Match accounts */}
            {accountInfo.isBeingMatched && (
              <div className="space-y-2">
                <Label htmlFor="major">Major (Optional)</Label>
                <Input
                  id="major"
                  value={profileData.major}
                  onChange={(e) =>
                    handleProfileChange({ major: e.target.value })
                  }
                  placeholder="e.g., Computer Science"
                />
              </div>
            )}

            {/* Interests */}
            <div className="space-y-2">
              <Label htmlFor="interests">Interests & Hobbies (Optional)</Label>
              <Textarea
                id="interests"
                value={profileData.interests}
                onChange={(e) =>
                  handleProfileChange({ interests: e.target.value })
                }
                maxLength={300}
                rows={4}
                placeholder="Tell us about your hobbies, interests, or what you enjoy doing..."
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {(profileData.interests || "").length}/300 characters
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showInterests"
                    checked={profileData.showInterestsToMatches}
                    onCheckedChange={(checked) =>
                      handleProfileChange({
                        showInterestsToMatches: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="showInterests"
                    className="text-sm font-normal cursor-pointer flex items-center gap-1"
                    data-tutorial="show-interests"
                  >
                    {profileData.showInterestsToMatches ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    Show to matches
                  </Label>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2" data-tutorial="bio">
              <Label htmlFor="bio">Short Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleProfileChange({ bio: e.target.value })}
                maxLength={300}
                rows={4}
                placeholder="This will be shared with the cupid that matches you!"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {(profileData.bio || "").length}/300 characters
                </p>
                <div
                  className="flex items-center space-x-2"
                  data-tutorial="show-bio"
                >
                  <Checkbox
                    id="showBio"
                    checked={profileData.showBioToMatches}
                    onCheckedChange={(checked) =>
                      handleProfileChange({
                        showBioToMatches: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="showBio"
                    className="text-sm font-normal cursor-pointer flex items-center gap-1"
                  >
                    {profileData.showBioToMatches ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    Show to matches
                  </Label>
                </div>
              </div>
            </div>

            {/* Point of Contact */}
            <div className="space-y-2" data-tutorial="point-of-contact">
              <Label htmlFor="pointOfContact">
                Point of Contact (Optional)
              </Label>
              <Input
                id="pointOfContact"
                value={profileData.pointOfContact}
                onChange={(e) =>
                  handleProfileChange({ pointOfContact: e.target.value })
                }
                maxLength={100}
                placeholder="e.g., @instagram_handle, Discord: username#1234, or personal email"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  <Info className="h-3 w-3 inline mr-1" />
                  If this is blank or not shown to matches, your student email
                  will be shared instead
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPointOfContact"
                    checked={profileData.showPointOfContactToMatches}
                    onCheckedChange={(checked) =>
                      handleProfileChange({
                        showPointOfContactToMatches: checked as boolean,
                      })
                    }
                  />
                  <Label
                    htmlFor="showPointOfContact"
                    className="text-sm font-normal cursor-pointer flex items-center gap-1"
                  >
                    {profileData.showPointOfContactToMatches ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    Show to matches
                  </Label>
                </div>
              </div>
            </div>

            {/* Cupid-related Items - Separate Section */}
            {accountInfo.isCupid && (
              <div className="pt-6 mt-6 border-t border-slate-200 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Cupid-related Items
                  </h3>
                  <p className="text-sm text-slate-600">
                    Settings specific to your cupid account
                  </p>
                </div>

                {/* Preferred Candidate Email */}
                <div className="space-y-2" data-tutorial="preferred-email">
                  <Label htmlFor="preferredCandidateEmail">
                    Preferred Candidate Email (Optional)
                  </Label>
                  <Input
                    id="preferredCandidateEmail"
                    type="email"
                    value={accountInfo.preferredCandidateEmail}
                    onChange={(e) => {
                      setAccountInfo({
                        ...accountInfo,
                        preferredCandidateEmail: e.target.value,
                      });
                      setHasUnsavedChanges(true);
                      setShowError(null); // Clear error when user starts typing
                    }}
                    placeholder="someone@student.ubc.ca"
                  />
                  <p className="text-xs text-slate-600">
                    If you have someone you&apos;d like to match (your preferred
                    candidate), enter their student email here.
                  </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="border-red-200 bg-red-50/50 mt-6">
        <CardHeader>
          <CardTitle className="text-red-900">⚠️ Danger Zone</CardTitle>
          <p className="text-sm text-red-700">
            Permanently delete your account(s)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Deleting your account will permanently remove all associated data.
              This action cannot be undone.
            </p>
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="w-full"
              type="button"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Type Selection Dialog */}
      <AlertDialog
        open={showAccountTypeDialog}
        onOpenChange={setShowAccountTypeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Accounts to Delete</AlertDialogTitle>
            <AlertDialogDescription>
              You have both a Match and a Cupid account. Please select which
              account(s) you want to delete:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-match"
                checked={selectedAccountTypes.includes("match")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAccountTypes([...selectedAccountTypes, "match"]);
                  } else {
                    setSelectedAccountTypes(
                      selectedAccountTypes.filter((t) => t !== "match")
                    );
                  }
                }}
              />
              <Label htmlFor="delete-match" className="cursor-pointer">
                Match Account - All questionnaire responses, matches, and
                match-related data will be deleted
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-cupid"
                checked={selectedAccountTypes.includes("cupid")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAccountTypes([...selectedAccountTypes, "cupid"]);
                  } else {
                    setSelectedAccountTypes(
                      selectedAccountTypes.filter((t) => t !== "cupid")
                    );
                  }
                }}
              />
              <Label htmlFor="delete-cupid" className="cursor-pointer">
                Cupid Account - All cupid assignments, selections, and
                cupid-related data will be deleted
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleAccountTypeSelection}
              variant="destructive"
              disabled={selectedAccountTypes.length === 0}
            >
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              {selectedAccountTypes.includes("match") &&
              selectedAccountTypes.includes("cupid")
                ? "Match and Cupid accounts"
                : selectedAccountTypes.includes("match")
                  ? "Match account"
                  : "Cupid account"}{" "}
              and remove all associated data from our servers.
              {selectedAccountTypes.includes("match") && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-sm">
                  ⚠️ If any cupid has you as a match candidate, they will
                  receive a notification that you deleted your account.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
