"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ProfileFormData } from "@/types/profile";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    displayName: "",
    major: "",
    interests: "",
    bio: "",
    profilePicture: "",
    showBioToMatches: true,
    showProfilePicToMatches: true,
    showInterestsToMatches: true,
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName || data.firstName,
          major: data.major || "",
          interests: data.interests || "",
          bio: data.bio || "",
          profilePicture: data.profilePicture || "",
          showBioToMatches: data.showBioToMatches ?? true,
          showProfilePicToMatches: data.showProfilePicToMatches ?? true,
          showInterestsToMatches: data.showInterestsToMatches ?? true,
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
          major: profileData.major,
          interests: profileData.interests,
          bio: profileData.bio,
          showBioToMatches: profileData.showBioToMatches,
          showProfilePicToMatches: profileData.showProfilePicToMatches,
          showInterestsToMatches: profileData.showInterestsToMatches,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        router.push("/dashboard");
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
            <p className="text-sm text-slate-600">
              Manage your profile information and visibility settings
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-slate-200">
                    <AvatarImage src={profileData.profilePicture} />
                    <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {profileData.profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
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
                        setProfileData((prev) => ({
                          ...prev,
                          showProfilePicToMatches: checked as boolean,
                        }))
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

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={profileData.displayName}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  maxLength={50}
                  required
                  placeholder="How you'd like to be called"
                />
                <p className="text-xs text-slate-500">
                  {profileData.displayName.length}/50 characters
                </p>
              </div>

              {/* Major */}
              <div className="space-y-2">
                <Label htmlFor="major">Major (Optional)</Label>
                <Input
                  id="major"
                  value={profileData.major}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      major: e.target.value,
                    }))
                  }
                  placeholder="e.g., Computer Science"
                />
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label htmlFor="interests">
                  Interests & Hobbies (Optional)
                </Label>
                <Textarea
                  id="interests"
                  value={profileData.interests}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      interests: e.target.value,
                    }))
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
                        setProfileData((prev) => ({
                          ...prev,
                          showInterestsToMatches: checked as boolean,
                        }))
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
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, bio: e.target.value }))
                  }
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
                        setProfileData((prev) => ({
                          ...prev,
                          showBioToMatches: checked as boolean,
                        }))
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

              {/* Reset Password */}
              <div className="pt-4 border-t">
                <Link href="/forgot-password">
                  <Button type="button" variant="outline" className="w-full">
                    Reset Password
                  </Button>
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
                size="lg"
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
