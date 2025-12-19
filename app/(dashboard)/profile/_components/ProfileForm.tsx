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
  Loader2,
  Upload,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
} from "lucide-react";
import { ProfileFormData } from "@/types/profile";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
    showBioToMatches: true,
    showProfilePicToMatches: true,
    showInterestsToMatches: true,
  });

  const [accountInfo, setAccountInfo] = useState({
    isCupid: false,
    isBeingMatched: true,
    lastActiveDashboard: "match" as "match" | "cupid",
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
          showBioToMatches: data.showBioToMatches ?? true,
          showProfilePicToMatches: data.showProfilePicToMatches ?? true,
          showInterestsToMatches: data.showInterestsToMatches ?? true,
        };
        setProfileData(profile);
        initialProfileData.current = profile;
        setAccountInfo({
          isCupid: data.isCupid || false,
          isBeingMatched: data.isBeingMatched ?? true,
          lastActiveDashboard: data.lastActiveDashboard || "match",
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

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
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
          showBioToMatches: profileData.showBioToMatches,
          showProfilePicToMatches: profileData.showProfilePicToMatches,
          showInterestsToMatches: profileData.showInterestsToMatches,
        }),
      });

      if (response.ok) {
        // Show success message and scroll to top
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
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

          <style>{customValidationStyles}</style>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
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
            <div className="space-y-2">
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
                  This name is shown when you're acting as a Cupid in the
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
                      We collect your age to improve matches and ensure everyone
                      is comfortable. Please use your real age.
                    </div>
                  </div>
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={profileData.age}
                  onChange={(e) =>
                    handleProfileChange({ age: parseInt(e.target.value) || 18 })
                  }
                  required
                  placeholder="18"
                />
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
            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleProfileChange({ bio: e.target.value })}
                maxLength={300}
                rows={4}
                placeholder="Anything else you'd like to share about yourself..."
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {(profileData.bio || "").length}/300 characters
                </p>
                <div className="flex items-center space-x-2">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
