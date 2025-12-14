# Profile System Documentation

## Overview

The UBCupids profile system allows users to manage their profile information, upload profile pictures, and control visibility settings for matched users.

## Features

### Profile Information

- **Display Name** (required, max 50 characters): The name shown to other users
- **First/Last Name** (read-only): Populated from signup
- **Major** (optional): Academic major, populated from signup if provided
- **Interests & Hobbies** (optional, max 300 characters): User's interests
- **Short Bio** (optional, max 300 characters): Additional information about the user
- **Profile Picture** (optional, max 5MB, JPEG/PNG/WebP): Uploaded to Cloudinary with face-detection cropping

### Visibility Controls

Users can toggle visibility for matches on:

- Profile picture
- Interests
- Bio

All visibility settings default to `true` (shown to matches).

### User Roles

Users can have dual roles via boolean flags:

- `isCupid`: Can match other users (Cupid role)
- `isBeingMatched`: Participates as a matchable user

## Database Schema

### User Model Fields (added)

```prisma
model User {
  // ... existing fields ...

  // Profile fields
  displayName             String?
  major                  String?
  interests              String? @db.Text
  bio                    String? @db.Text
  profilePicture         String?

  // Role flags
  isCupid                Boolean @default(false)
  isBeingMatched         Boolean @default(true)

  // Visibility settings
  showBioToMatches       Boolean @default(true)
  showProfilePicToMatches Boolean @default(true)
  showInterestsToMatches  Boolean @default(true)
}
```

## API Endpoints

### GET /api/profile

Fetches the current user's profile data.

**Response:**

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  displayName: string | null;
  major: string | null;
  interests: string | null;
  bio: string | null;
  profilePicture: string | null;
  showBioToMatches: boolean;
  showProfilePicToMatches: boolean;
  showInterestsToMatches: boolean;
}
```

### POST /api/profile

Updates the current user's profile.

**Request Body:**

```typescript
{
  displayName: string; // required
  major?: string;
  interests?: string;
  bio?: string;
  showBioToMatches?: boolean;
  showProfilePicToMatches?: boolean;
  showInterestsToMatches?: boolean;
}
```

**Validation:**

- `displayName`: Required, max 50 characters
- `interests`: Optional, max 300 characters
- `bio`: Optional, max 300 characters

### POST /api/profile/upload-picture

Uploads a profile picture to Cloudinary.

**Request:** FormData with `file` field

**Validation:**

- File type: JPEG, JPG, PNG, or WebP
- File size: Max 5MB
- Cloudinary transformation: 500x500 crop with face detection

**Response:**

```typescript
{
  url: string; // Cloudinary URL
}
```

### DELETE /api/profile/upload-picture

Removes the user's profile picture.

**Response:**

```typescript
{
  success: boolean;
}
```

## Components

### ProfileButton

**Location:** `app/(dashboard)/dashboard/_components/ProfileButton.tsx`

Circular avatar button with dropdown menu showing:

- Profile link
- Logout link

Features:

- Displays profile picture or initials
- Click-outside-to-close functionality
- Fetches latest profile picture on mount
- Smooth animations

### ProfileForm

**Location:** `app/(dashboard)/profile/_components/ProfileForm.tsx`

Complete profile management form with:

- Profile picture upload with preview
- All profile fields with character counters
- Visibility toggle switches
- Reset password link
- Save button with validation

## Cloudinary Integration

### Functions

**Location:** `lib/cloudinary.ts`

#### uploadToCloudinary(buffer, folder)

Uploads an image buffer to Cloudinary with automatic transformations.

**Transformations:**

- Crop: 500x500 fill with face gravity
- Quality: Auto
- Format: Auto

#### deleteFromCloudinary(imageUrl)

Extracts public_id from Cloudinary URL and deletes the image.

## User Flow

1. **Access Profile:**
   - Click profile avatar in dashboard header
   - Select "Profile" from dropdown menu

2. **Edit Profile:**
   - Upload profile picture (optional)
   - Set display name (required)
   - Fill in major, interests, bio (optional)
   - Toggle visibility settings for matches
   - Click "Save Changes"

3. **Reset Password:**
   - Click "Reset Password" button in profile
   - Redirects to existing forgot-password flow

4. **Return to Dashboard:**
   - Click "Back to Dashboard" button
   - Profile changes are saved and visible

## Security

- All API endpoints require authentication via `getCurrentUser()`
- File uploads validate type and size
- Profile pictures stored on Cloudinary (not local filesystem)
- Old profile pictures automatically deleted when uploading new ones
- Visibility settings prevent unauthorized data exposure to matches

## Integration Points

### Dashboard

- Profile button replaces old Logout button
- Displays user's profile picture or initials
- Dropdown menu provides access to profile and logout

### Signup Flow

- Major field from signup pre-populates profile if provided
- Display name defaults to first name if not set

### Matches System (Future)

- Visibility settings control what matched users see
- Profile data displayed based on toggle settings
- Role flags determine matching behavior

## Character Limits

| Field           | Limit          |
| --------------- | -------------- |
| Display Name    | 50 characters  |
| Interests       | 300 characters |
| Bio             | 300 characters |
| Profile Picture | 5MB file size  |

## Next Steps

- [ ] Test complete profile flow end-to-end
- [ ] Add profile completion progress indicator
- [ ] Implement profile preview as matches see it
- [ ] Add profile picture cropping UI before upload
- [ ] Create admin view for Cupids to see all profiles
- [ ] Integrate profile data into match display
