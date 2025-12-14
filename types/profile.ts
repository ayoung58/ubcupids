/**
 * Profile-related TypeScript types
 */

export interface ProfileData {
  displayName: string;
  cupidDisplayName?: string;
  age: number;
  major?: string;
  interests?: string;
  bio?: string;
  profilePicture?: string;
  showBioToMatches: boolean;
  showProfilePicToMatches: boolean;
  showInterestsToMatches: boolean;
}

export interface ProfileFormData extends ProfileData {
  firstName: string; // Read-only display
  lastName: string; // Read-only display
}

export interface ProfileUpdateRequest {
  displayName: string;
  cupidDisplayName?: string;
  age: number;
  major?: string;
  interests?: string;
  bio?: string;
  showBioToMatches: boolean;
  showProfilePicToMatches: boolean;
  showInterestsToMatches: boolean;
}

export interface ProfilePictureUploadResponse {
  url: string;
  cloudinaryId: string;
}
