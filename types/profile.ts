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
  pointOfContact?: string;
  campus?: string;
  okMatchingDifferentCampus?: boolean;
  showBioToMatches: boolean;
  showProfilePicToMatches: boolean;
  showInterestsToMatches: boolean;
  showPointOfContactToMatches: boolean;
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
  pointOfContact?: string;
  campus?: string;
  okMatchingDifferentCampus?: boolean;
  showBioToMatches: boolean;
  showProfilePicToMatches: boolean;
  showInterestsToMatches: boolean;
  showPointOfContactToMatches: boolean;
}

export interface ProfilePictureUploadResponse {
  url: string;
  cloudinaryId: string;
}
